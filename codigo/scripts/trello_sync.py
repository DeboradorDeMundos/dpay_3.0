#!/usr/bin/env python3
"""Sincroniza PRs e issues de GitHub con el tablero Trello vía REST API."""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional

API = "https://api.trello.com/1"
CARD_URL_RE = re.compile(r"https?://trello\.com/c/([a-zA-Z0-9]+)", re.I)
CARD_MARKER_RE = re.compile(r"<!--\s*dpay-trello-card:\s*([a-zA-Z0-9]+)\s*-->", re.I)
MONGO_ID_RE = re.compile(r"^[a-f0-9]{24}$", re.I)

LIST_KEYS = {
    "backlog": ("TRELLO_LIST_BACKLOG", "TRELLO_LIST_BACKLOG_NAME"),
    "in_progress": ("TRELLO_LIST_IN_PROGRESS", "TRELLO_LIST_IN_PROGRESS_NAME"),
    "review": ("TRELLO_LIST_REVIEW", "TRELLO_LIST_REVIEW_NAME"),
    "done": ("TRELLO_LIST_DONE", "TRELLO_LIST_DONE_NAME"),
}

NAME_FALLBACKS = {
    "backlog": ("codigo", "código", "por hacer", "backlog", "to do", "todo", "pendiente"),
    "in_progress": ("en progreso", "in progress", "doing", "wip", "en curso"),
    "review": ("qa", "review", "en revisión", "revision", "code review"),
    "done": ("produccion", "producción", "done", "hecho", "completado", "finalizado"),
}


class TrelloError(RuntimeError):
    pass


def env(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()


def trello(method: str, path: str, params: Optional[dict] = None) -> Any:
    key = env("TRELLO_API_KEY")
    token = env("TRELLO_API_TOKEN")
    if not key or not token:
        raise TrelloError("Faltan TRELLO_API_KEY o TRELLO_API_TOKEN")

    query = {"key": key, "token": token}
    body = None
    headers = {"Accept": "application/json", "User-Agent": "dpay-trello-sync"}

    if method in ("POST", "PUT") and params:
        body = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None}).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        url = f"{API}{path}?{urllib.parse.urlencode(query)}"
    else:
        if params:
            query.update({k: str(v) for k, v in params.items() if v is not None})
        url = f"{API}{path}?{urllib.parse.urlencode(query)}"

    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise TrelloError(f"Trello {exc.code} {method} {path}: {detail}") from exc


def github_api(method: str, path: str, payload: Optional[dict] = None) -> Any:
    token = env("GITHUB_TOKEN") or env("GH_TOKEN")
    if not token:
        return None
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(
        f"https://api.github.com{path}",
        data=data,
        method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "dpay-trello-sync",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        print(f"[github] {exc.code} {method} {path}: {detail}", file=sys.stderr)
        return None


def extract_card_ref(*texts: str) -> Optional[str]:
    for text in texts:
        if not text:
            continue
        match = CARD_URL_RE.search(text) or CARD_MARKER_RE.search(text)
        if match:
            return match.group(1)
    return None


def list_id_from_config(lists: list[dict], slot: str) -> Optional[str]:
    id_key, name_key = LIST_KEYS[slot]
    configured_id = env(id_key)
    configured_name = env(name_key)
    if configured_id:
        if MONGO_ID_RE.match(configured_id):
            return configured_id
        configured_name = configured_id
    if configured_name:
        wanted = configured_name.casefold()
        for item in lists:
            if wanted in item.get("name", "").casefold():
                return item["id"]
    for alias in NAME_FALLBACKS[slot]:
        for item in lists:
            if alias in item.get("name", "").casefold():
                return item["id"]
    return None


def resolve_lists(board_id: str) -> tuple[dict[str, Optional[str]], list]:
    lists = trello("GET", f"/boards/{board_id}/lists", {"filter": "open", "fields": "name"})
    resolved = {slot: list_id_from_config(lists, slot) for slot in LIST_KEYS}
    if not any(resolved.values()) and lists:
        resolved["backlog"] = lists[0]["id"]
        print(f"[trello] Sin listas configuradas; se usa la primera: {lists[0].get('name')}")
    return resolved, lists


def card_by_ref(ref: str) -> dict:
    return trello("GET", f"/cards/{ref}", {"fields": "id,name,shortUrl,url,idList,closed"})


def ensure_attachment(card_id: str, url: str, name: str) -> None:
    try:
        trello("POST", f"/cards/{card_id}/attachments", {"url": url, "name": name})
    except TrelloError as exc:
        print(f"[trello] attachment omitido: {exc}")


def comment_card(card_id: str, text: str) -> None:
    trello("POST", f"/cards/{card_id}/actions/comments", {"text": text})


def move_card(card_id: str, list_id: Optional[str]) -> None:
    if not list_id:
        print("[trello] no hay lista destino; no se mueve la card")
        return
    trello("PUT", f"/cards/{card_id}", {"idList": list_id, "closed": "false"})


def create_card(list_id: str, name: str, desc: str) -> dict:
    if not list_id:
        raise TrelloError("No hay lista destino para crear la card (configure TRELLO_LIST_BACKLOG)")
    return trello(
        "POST",
        "/cards",
        {"idList": list_id, "name": name[:16384], "desc": desc[:16384], "pos": "top"},
    )


def existing_github_marker(repo: str, issue_number: str) -> Optional[str]:
    comments = github_api("GET", f"/repos/{repo}/issues/{issue_number}/comments") or []
    for comment in comments:
        match = CARD_MARKER_RE.search(comment.get("body") or "")
        if match:
            return match.group(1)
        match = CARD_URL_RE.search(comment.get("body") or "")
        if match:
            return match.group(1)
    return None


def post_github_comment(repo: str, issue_number: str, card: dict) -> None:
    body = (
        f"Tarjeta Trello: {card.get('shortUrl') or card.get('url')}\n\n"
        f"<!-- dpay-trello-card: {card['id']} -->"
    )
    github_api("POST", f"/repos/{repo}/issues/{issue_number}/comments", {"body": body})


def dump_setup() -> None:
    me = trello("GET", "/members/me", {"fields": "fullName,username,url"})
    board_id = env("TRELLO_BOARD_ID", "xUz6zs7Y")
    board = trello("GET", f"/boards/{board_id}", {"fields": "id,name,url,shortLink"})
    lists = trello("GET", f"/boards/{board_id}/lists", {"filter": "open", "fields": "name"})
    print("=== Trello OK ===")
    print(f"Usuario: {me.get('fullName')} (@{me.get('username')})")
    print(f"Tablero: {board.get('name')}  {board.get('url')}")
    print(f"TRELLO_BOARD_ID={board.get('id')}")
    print("")
    print("Listas abiertas (copie el id a GitHub Secrets):")
    for item in lists:
        print(f"  {item['name']}")
        print(f"    id: {item['id']}")


def target_list_for_event(lists_map: dict[str, Optional[str]]) -> Optional[str]:
    event = env("GITHUB_EVENT_NAME")
    action = env("EVENT_ACTION")
    merged = env("PR_MERGED").lower() == "true"
    draft = env("PR_DRAFT").lower() == "true"

    if event == "pull_request":
        if action == "closed" and merged:
            return lists_map.get("done") or lists_map.get("review")
        if action == "closed":
            return lists_map.get("backlog")
        if action == "converted_to_draft" or draft:
            return lists_map.get("backlog") or lists_map.get("in_progress")
        if action in ("opened", "reopened", "ready_for_review", "synchronize"):
            if action == "synchronize":
                return None
            return lists_map.get("in_progress") or lists_map.get("review") or lists_map.get("backlog")
    if event == "issues":
        if action in ("closed",):
            return lists_map.get("done")
        return lists_map.get("backlog") or lists_map.get("in_progress")
    return lists_map.get("in_progress") or lists_map.get("backlog")


def sync() -> None:
    board_id = env("TRELLO_BOARD_ID", "xUz6zs7Y")
    repo = env("GITHUB_REPOSITORY")
    event = env("GITHUB_EVENT_NAME")
    action = env("EVENT_ACTION")
    if event == "issues":
        kind, number, title, body, url = (
            "Issue",
            env("ISSUE_NUMBER"),
            env("ISSUE_TITLE") or "Sin título",
            env("ISSUE_BODY"),
            env("ISSUE_URL"),
        )
    else:
        kind, number, title, body, url = (
            "PR",
            env("PR_NUMBER"),
            env("PR_TITLE") or "Sin título",
            env("PR_BODY"),
            env("PR_URL"),
        )

    lists_map, raw_lists = resolve_lists(board_id)
    print("[trello] listas resueltas:")
    names = {item["id"]: item["name"] for item in raw_lists}
    for slot, list_id in lists_map.items():
        print(f"  {slot}: {names.get(list_id, '(no)')} {list_id or ''}")

    card_ref = extract_card_ref(title, body) or (existing_github_marker(repo, number) if repo and number else None)
    card = None
    created = False
    if card_ref:
        try:
            card = card_by_ref(card_ref)
        except TrelloError as exc:
            print(f"[trello] no se encontró la card {card_ref}: {exc}")

    if card is None:
        if action == "synchronize":
            print("[trello] push extra sin card vinculada; no se crea nada")
            return
        dest = lists_map.get("in_progress") if kind == "PR" else lists_map.get("backlog")
        dest = dest or lists_map.get("backlog") or lists_map.get("in_progress")
        desc = "\n".join(
            [
                f"{kind} de GitHub sincronizado automáticamente.",
                f"Repo: {repo}",
                f"Enlace: {url}",
                "",
                (body or "")[:8000],
            ]
        )
        card = create_card(dest or "", f"{kind} #{number}: {title}"[:256], desc)
        created = True
        print(f"[trello] card creada: {card.get('shortUrl')}")
    else:
        print(f"[trello] card existente: {card.get('shortUrl')}")

    dest = target_list_for_event(lists_map)
    if dest:
        move_card(card["id"], dest)

    if url:
        ensure_attachment(card["id"], url, f"{kind} #{number}")

    comment_bits = [f"{kind} #{number} ({action}) {url}".strip()]
    if created:
        comment_bits.insert(0, "Card creada desde GitHub Actions.")
    comment_card(card["id"], "\n".join(comment_bits))

    if created and repo and number:
        post_github_comment(repo, number, card)


def main() -> int:
    mode = (sys.argv[1] if len(sys.argv) > 1 else env("TRELLO_MODE", "sync")).lstrip("-")
    try:
        if mode in ("lists", "setup", "test"):
            dump_setup()
        else:
            sync()
        return 0
    except TrelloError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

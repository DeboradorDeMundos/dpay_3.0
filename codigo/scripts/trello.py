#!/usr/bin/env python3
"""CLI local para mover/comentar cards del tablero D-PAY desde Cursor."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.trello.com/1"
ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env.trello"


def load_env() -> None:
    if not ENV_FILE.exists():
        return
    for raw in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        os.environ.setdefault(name.strip(), value.strip().strip('"').strip("'"))


def env(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()


def trello(method: str, path: str, params: dict | None = None):
    key = env("TRELLO_API_KEY")
    token = env("TRELLO_API_TOKEN")
    if not key or not token:
        raise SystemExit(
            "Faltan credenciales. Copie .env.trello.example a .env.trello "
            "y complete TRELLO_API_KEY y TRELLO_API_TOKEN."
        )
    query = {"key": key, "token": token}
    data = None
    headers = {"Accept": "application/json", "User-Agent": "dpay-trello-cli"}
    if method in ("POST", "PUT") and params:
        data = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None}).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        url = f"{API}{path}?{urllib.parse.urlencode(query)}"
    else:
        if params:
            query.update({k: str(v) for k, v in params.items() if v is not None})
        url = f"{API}{path}?{urllib.parse.urlencode(query)}"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Trello {exc.code} {method} {path}: {detail}") from exc


def board_id() -> str:
    return env("TRELLO_BOARD_ID", "xUz6zs7Y")


def open_lists():
    return trello("GET", f"/boards/{board_id()}/lists", {"filter": "open", "fields": "name"})


def find_list(query: str) -> dict:
    lists = open_lists()
    wanted = query.strip()
    by_id = [item for item in lists if item["id"] == wanted]
    if by_id:
        return by_id[0]
    wanted_cf = wanted.casefold()
    exact = [item for item in lists if item["name"].casefold() == wanted_cf]
    if exact:
        return exact[0]
    partial = [item for item in lists if wanted_cf in item["name"].casefold()]
    if len(partial) == 1:
        return partial[0]
    if not partial:
        names = ", ".join(item["name"] for item in lists)
        raise SystemExit(f"No hay lista que coincida con '{query}'. Listas: {names}")
    names = ", ".join(item["name"] for item in partial)
    raise SystemExit(f"Varias listas coinciden con '{query}': {names}")


def find_card(query: str) -> dict:
    wanted = query.casefold()
    cards = trello(
        "GET",
        f"/boards/{board_id()}/cards",
        {"filter": "open", "fields": "name,idList,shortUrl,url"},
    )
    hits = [card for card in cards if wanted in (card.get("name") or "").casefold()]
    if len(hits) == 1:
        return hits[0]
    if not hits:
        raise SystemExit(f"No hay card abierta que coincida con '{query}'.")
    lines = "\n".join(f"  - {card['name']}  {card.get('shortUrl')}" for card in hits[:10])
    raise SystemExit(f"Varias cards coinciden con '{query}'. Sea mas especifico:\n{lines}")


def cmd_lists() -> None:
    for item in open_lists():
        print(f"{item['id']}  {item['name']}")


def cmd_cards(list_query: str | None) -> None:
    lists_by_id = {item["id"]: item["name"] for item in open_lists()}
    cards = trello(
        "GET",
        f"/boards/{board_id()}/cards",
        {"filter": "open", "fields": "name,idList,shortUrl"},
    )
    if list_query:
        target = find_list(list_query)
        cards = [card for card in cards if card.get("idList") == target["id"]]
        print(f"Lista: {target['name']}\n")
    for card in cards:
        column = lists_by_id.get(card.get("idList"), "?")
        print(f"[{column}] {card['name']}")
        print(f"         {card.get('shortUrl')}")


def cmd_move(card_query: str, list_query: str) -> None:
    card = find_card(card_query)
    target = find_list(list_query)
    trello("PUT", f"/cards/{card['id']}", {"idList": target["id"], "closed": "false"})
    print(f"OK  '{card['name']}' -> {target['name']}")
    print(card.get("shortUrl") or card.get("url"))


def cmd_comment(card_query: str, text: str) -> None:
    card = find_card(card_query)
    trello("POST", f"/cards/{card['id']}/actions/comments", {"text": text})
    print(f"OK  comentario en '{card['name']}'")
    print(card.get("shortUrl") or card.get("url"))


def _safe_print(text: str) -> None:
    encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
    print(text.encode(encoding, errors="replace").decode(encoding, errors="replace"))


def cmd_create(list_query: str, name: str, desc: str = "") -> None:
    target = find_list(list_query)
    card = trello(
        "POST",
        "/cards",
        {
            "idList": target["id"],
            "name": name[:16384],
            "desc": desc[:16384],
            "pos": "bottom",
        },
    )
    _safe_print(f"OK  [{target['name']}] {card.get('name')}")
    print(card.get("shortUrl") or card.get("url"))


def usage() -> str:
    return """Uso:
  python scripts/trello.py lists
  python scripts/trello.py cards [lista]
  python scripts/trello.py create <lista> <nombre> [descripcion]
  python scripts/trello.py move <texto-card> <lista>
  python scripts/trello.py comment <texto-card> <mensaje>

Ejemplos:
  python scripts/trello.py move HU-01 progreso
  python scripts/trello.py move HU-01 qa
  python scripts/trello.py comment HU-01 "Pruebas OK en POS"
"""


def main() -> int:
    load_env()
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help", "help"):
        print(usage())
        return 0
    cmd = args[0].lower()
    if cmd == "lists":
        cmd_lists()
    elif cmd == "cards":
        cmd_cards(args[1] if len(args) > 1 else None)
    elif cmd == "move" and len(args) >= 3:
        cmd_move(args[1], " ".join(args[2:]))
    elif cmd == "comment" and len(args) >= 3:
        cmd_comment(args[1], " ".join(args[2:]))
    elif cmd == "create" and len(args) >= 3:
        cmd_create(args[1], args[2], " ".join(args[3:]))
    else:
        print(usage())
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""Mediciones de laboratorio DOC-07 / RNF (PC). No reemplaza el cronometro en Celular Android."""
import json, os, time, urllib.error, urllib.request

OUT = os.path.join(os.path.dirname(__file__), "metricas-laboratorio-20260927.json")
PROXY = "http://127.0.0.1:8787"
LOGIN = "https://proqa.dtemite.cl/api/login"


def ms(fn):
    t0 = time.perf_counter()
    fn()
    return round((time.perf_counter() - t0) * 1000, 1)


def health():
    with urllib.request.urlopen(PROXY + "/health", timeout=5) as r:
        r.read()


def create_and_checkout():
    req = urllib.request.Request(
        PROXY + "/payments/webpay/create",
        data=json.dumps({
            "amount": 1000,
            "sale_id": "rnf-lab",
            "method": "credit",
            "simulate": "",
        }).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        body = json.loads(r.read().decode())
    url = body.get("redirect_url") or body.get("url") or ""
    if url:
        with urllib.request.urlopen(url, timeout=10) as r:
            r.read()
    return body


def login_probe():
    req = urllib.request.Request(
        LOGIN,
        data=b"{}",
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            r.read()
            return r.status
    except urllib.error.HTTPError as e:
        e.read()
        return e.code


def main():
    result = {"fecha": time.strftime("%Y-%m-%d %H:%M:%S"), "ambiente": "PC laboratorio"}
    # health warmup
    try:
        health()
        proxy_ok = True
    except Exception as e:
        proxy_ok = False
        result["proxy_error"] = str(e)

    webpay = []
    if proxy_ok:
        for i in range(5):
            t = ms(create_and_checkout)
            webpay.append(t)
            print("Webpay create+checkout M{}: {} ms".format(i + 1, t))
        result["webpay_create_checkout_ms"] = webpay
        result["webpay_prom_ms"] = round(sum(webpay) / 5, 1)
        result["webpay_max_ms"] = max(webpay)

    login = []
    login_status = []
    for i in range(5):
        def _probe():
            login_status.append(login_probe())
        t = ms(_probe)
        login.append(t)
        print("API login probe M{}: {} ms status={}".format(i + 1, t, login_status[-1]))
    result["login_api_probe_ms"] = login
    result["login_api_status"] = login_status
    result["login_prom_ms"] = round(sum(login) / 5, 1)
    result["login_max_ms"] = max(login)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print("Wrote", OUT)


if __name__ == "__main__":
    main()

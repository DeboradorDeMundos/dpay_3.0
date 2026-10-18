# -*- coding: utf-8 -*-
"""Second pass: docx phrases split across XML or missed encodings."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

FASE2 = Path(__file__).resolve().parents[1]
DOCX_DIRS = [
    FASE2 / "Evidencias Grupales",
    FASE2 / "Evidencias Individuales",
]

REPS = [
    ("y el Sprint 3 est\u00e1 en curso", "; retrospectiva S3 cerrada 15/10/2026 (Goal Parcial)"),
    ("el Sprint 3 (06/10\u201317/10) est\u00e1 en curso", "retrospectiva S3 cerrada 15/10/2026; Goal Parcial (ventana 06/10-17/10)"),
    ("Completado (v1.0.1, 12/10)", "Completado (v1.0.2, 16/10)"),
    ("Cat\u00e1logo v1.0.1 publicado", "Cat\u00e1logo v1.0.2 publicado"),
    ("Cat\u00e1logo RNF ISO/IEC 25010 v1.0.1;", "Cat\u00e1logo RNF ISO/IEC 25010 v1.0.2;"),
    (
        "ISO/IEC 25010 D-PAY 3.0 (Versi\u00f3n 1.0.1)",
        "ISO/IEC 25010 D-PAY 3.0 (Versi\u00f3n 1.0.2)",
    ),
    (
        "1 bloqueado de 19",
        "0 bloqueados de 19 (TC-064 Parcial fuera del conteo 15 MTC)",
    ),
    (
        "TUU/Kozen regression (TC-064) is blocked pending execution by Diego Madrid (TUU/Kozen in production)",
        "TUU/Kozen regression TC-064 / TC-RG-01 is Partial (13 Oct 2026, Kozen P8 Neo; production TUU baseline unchanged)",
    ),
    (
        "Retrospectivas S01 y S02: registro",
        "Retrospectivas S01, S02 y S03 (acta S03 15/10/2026): registro",
    ),
    (
        "En curso al 12/10:",
        "Al corte 18/10/2026:",
    ),
]


def patch_docx(path: Path) -> bool:
    changed = False
    with ZipFile(path, "r") as zin:
        names = zin.namelist()
        blobs = {n: zin.read(n) for n in names}
    for name, data in list(blobs.items()):
        if not name.startswith("word/") or not name.endswith(".xml"):
            continue
        text = data.decode("utf-8")
        new = text
        for old, rep in REPS:
            new = new.replace(old, rep)
        if new != text:
            blobs[name] = new.encode("utf-8")
            changed = True
    if changed:
        with ZipFile(path, "w", ZIP_DEFLATED) as zout:
            for name in names:
                zout.writestr(name, blobs[name])
    return changed


def main():
    n = 0
    for d in DOCX_DIRS:
        for p in d.rglob("*.docx"):
            if patch_docx(p):
                print("patched", p.relative_to(FASE2))
                n += 1
    print("done", n)


if __name__ == "__main__":
    main()

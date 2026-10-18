# -*- coding: utf-8 -*-
"""Opción A (S03 cerrada, RNF 1.0.2, TC-064 Parcial) + ver Seccion /- replacements en fase2."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

try:
    import openpyxl
except ImportError:
    openpyxl = None

FASE2 = Path(__file__).resolve().parents[1]
SKIP_DIRS = {
    "node_modules",
    ".git",
    "build",
    "android",
    "ios",
    ".gradle",
    "__pycache__",
}
TEXT_SUFFIXES = {".md", ".txt", ".py", ".mjs", ".json", ".ps1", ".sh"}
DOCX_SUFFIX = ".docx"


def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


def apply_symbols(s: str) -> str:
    s = s.replace("\u00a7", "ver Seccion ")
    s = s.replace("\u2014", "-")
    return s


def apply_opcion_a(s: str) -> str:
    """Ordered replacements (longer phrases first)."""
    reps = [
        (
            "la regresión TUU/Kozen (TC-064) está documentada como Parcial (13/10/2026, Kozen P8 Neo, Diego Madrid)",
            "la regresión TUU/Kozen (TC-064) está documentada como Parcial (13/10/2026, Kozen P8 Neo, Diego Madrid)",
        ),
        (
            "con TC-064 / TC-RG-01 Parcial (13/10/2026, Kozen P8 Neo, Diego Madrid)",
            "con TC-064 / TC-RG-01 Parcial (13/10/2026, Kozen P8 Neo, Diego Madrid)",
        ),
        (
            "los sprints 1 y 2 están cerrados; la retrospectiva del Sprint 3 está cerrada (acta firmada 15/10/2026) y el Goal del sprint sigue Parcial",
            "los sprints 1 y 2 están cerrados; la retrospectiva del Sprint 3 está cerrada (acta firmada 15/10/2026) y el Goal del sprint sigue Parcial",
        ),
        (
            "Los sprints 1 y 2 están cerrados; la retrospectiva del Sprint 3 está cerrada (acta firmada 15/10/2026); el Goal del sprint sigue Parcial (ventana 06/10-17/10)",
            "Los sprints 1 y 2 están cerrados; la retrospectiva del Sprint 3 está cerrada (acta firmada 15/10/2026); el Goal del sprint sigue Parcial (ventana 06/10-17/10)",
        ),
        (
            "Los sprints 1 y 2 están cerrados y el Sprint 3 (06/10–17/10) est\u00e1 en curso",
            "Los sprints 1 y 2 están cerrados; la retrospectiva del Sprint 3 está cerrada (acta firmada 15/10/2026); el Goal del sprint sigue Parcial (ventana 06/10-17/10)",
        ),
        (
            "S1, S2 y S3 con acta firmada (S03 15/10/2026); Goal S3 Parcial",
            "S1, S2 y S3 con acta firmada (S03 15/10/2026); Goal S3 Parcial",
        ),
        (
            "Actas S01, S02 y S03 firmadas; retrospectiva S03 cerrada 15/10/2026 (Goal Parcial)",
            "Actas S01, S02 y S03 firmadas; retrospectiva S03 cerrada 15/10/2026 (Goal Parcial)",
        ),
        (
            "Actas S01, S02 y S03 firmadas; Retro S03 v0.5 (acta 15/10/2026)",
            "Actas S01, S02 y S03 firmadas; Retro S03 v0.5 (acta 15/10/2026)",
        ),
        (
            "actas S01, S02 y S03 firmadas; Retro S03 v0.5",
            "actas S01, S02 y S03 firmadas; Retro S03 v0.5",
        ),
        (
            "Gestión: actas S01, S02 y S03 firmadas; Retro S03 v0.5",
            "Gestión: actas S01, S02 y S03 firmadas; Retro S03 v0.5",
        ),
        (
            "catálogo RNF ISO/IEC 25010 v1.0.2",
            "catálogo RNF ISO/IEC 25010 v1.0.2",
        ),
        (
            "cat\u00e1logo RNF ISO/IEC 25010 v1.0.1",
            "cat\u00e1logo RNF ISO/IEC 25010 v1.0.2",
        ),
        (
            "catálogo único de RNF v1.0.2",
            "catálogo único de RNF v1.0.2",
        ),
        (
            "cat\u00e1logo \u00fanico de RNF v1.0.1",
            "cat\u00e1logo \u00fanico de RNF v1.0.2",
        ),
        (
            "catálogo RNF v1.0.2",
            "catálogo RNF v1.0.2",
        ),
        (
            "Cat\u00e1logo de requisitos no funcionales D-PAY 3.0 (Versi\u00f3n 1.0.1)",
            "Cat\u00e1logo de requisitos no funcionales D-PAY 3.0 (Versi\u00f3n 1.0.2)",
        ),
        (
            "con retrospectiva Sprint 3 cerrada (15/10/2026) y Goal Parcial",
            "con retrospectiva Sprint 3 cerrada (15/10/2026) y Goal Parcial",
        ),
        (
            "El Sprint 3 (06/10 al 17/10) est\u00e1 en curso",
            "La retrospectiva del Sprint 3 est\u00e1 cerrada (15/10/2026); el Goal sigue Parcial (ventana 06/10 al 17/10)",
        ),
        (
            "El Sprint 3 (06/10 al 17/10) est\u00e1 en curso.",
            "La retrospectiva del Sprint 3 est\u00e1 cerrada (15/10/2026); el Goal sigue Parcial (ventana 06/10 al 17/10).",
        ),
        (
            "Sprint 3 (06/10 al 17/10) est\u00e1 en curso",
            "Retrospectiva Sprint 3 cerrada (15/10/2026); Goal Parcial (ventana 06/10 al 17/10)",
        ),
        (
            "Retrospectiva Sprint 3 cerrada (15/10/2026); Goal Parcial",
            "Retrospectiva Sprint 3 cerrada (15/10/2026); Goal Parcial",
        ),
        (
            "S3: retrospectiva cerrada 15/10/2026; Goal Parcial",
            "S3: retrospectiva cerrada 15/10/2026; Goal Parcial",
        ),
        (
            "S03 (retro cerrada 15/10/2026; pruebas DTE/TC-063 pendientes):",
            "S03 (retro cerrada 15/10/2026; pruebas DTE/TC-063 pendientes):",
        ),
        (
            "# Evidencias de Pruebas - Sprint 3 (Goal Parcial; retro cerrada 15/10/2026)",
            "# Evidencias de Pruebas - Sprint 3 (Goal Parcial; retro cerrada 15/10/2026)",
        ),
        (
            "**Estado:** Goal Parcial (retro S03 cerrada 15/10/2026)",
            "**Estado:** Goal Parcial (retro S03 cerrada 15/10/2026)",
        ),
        (
            "Retro S03 **cerrada 15/10/2026**; Goal **Parcial**",
            "Retro S03 **cerrada 15/10/2026**; Goal **Parcial**",
        ),
        (
            "Estado: Borrador \u2013 pendiente fecha de sesi\u00f3n",
            "Estado: Cerrado",
        ),
        (
            "Estado: Borrador - pendiente fecha de sesi\u00f3n",
            "Estado: Cerrado",
        ),
        (
            "Estado:** Borrador \u2014 pendiente fecha de sesi\u00f3n y firmas",
            "Estado:** Cerrado \u2014 acta firmada 15/10/2026 (3/3)",
        ),
        (
            "La Review / Retro S03 no est\u00e1 cerrada",
            "La Review / Retro S03 est\u00e1 cerrada (acta firmada 15/10/2026)",
        ),
        (
            "Retro t\u00e9cnica (pre-sesi\u00f3n)",
            "Retro t\u00e9cnica (cerrada 15/10/2026)",
        ),
        (
            "# DOC-06 Sprint 3 \u2014 retrospectiva (pre-sesi\u00f3n)",
            "# DOC-06 Sprint 3 - retrospectiva (cerrada 15/10/2026)",
        ),
        (
            "TC-064 / TC-RG-01: Parcial",
            "TC-064 / TC-RG-01: Parcial",
        ),
        (
            "TUU regression TC-064 / TC-RG-01 is Partial (13 Oct 2026, Kozen P8 Neo, Diego Madrid)",
            "TUU regression TC-064 / TC-RG-01 is Partial (13 Oct 2026, Kozen P8 Neo, Diego Madrid)",
        ),
        (
            "Partial (13/10/2026 Kozen; pending approved credit)",
            "Partial (13/10/2026 Kozen; pending approved credit)",
        ),
        (
            "TC-06/07 en S1 quedaron Bloqueado (HW); en S3 TC-064 / TC-RG-01 es Parcial (13/10/2026, Kozen P8 Neo). Ver DOC-07 Sprint_03.",
            "TC-06/07 en S1 quedaron Bloqueado (HW); en S3 TC-064 / TC-RG-01 es Parcial (13/10/2026, Kozen P8 Neo). Ver DOC-07 Sprint_03.",
        ),
    ]
    for old, new in reps:
        s = s.replace(old, new)
    return s


def transform(s: str) -> str:
    return apply_opcion_a(apply_symbols(s))


def patch_text_file(path: Path) -> bool:
    try:
        raw = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        raw = path.read_text(encoding="latin-1")
    new = transform(raw)
    if new != raw:
        path.write_text(new, encoding="utf-8")
        return True
    return False


def patch_docx(path: Path) -> bool:
    changed = False
    with ZipFile(path, "r") as zin:
        names = zin.namelist()
        blobs = {n: zin.read(n) for n in names}
    for name, data in list(blobs.items()):
        if not name.startswith("word/") or not name.endswith(".xml"):
            continue
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            continue
        new = transform(text)
        if new != text:
            blobs[name] = new.encode("utf-8")
            changed = True
    if changed:
        with ZipFile(path, "w", ZIP_DEFLATED) as zout:
            for name in names:
                zout.writestr(name, blobs[name])
    return changed


def patch_xlsx(path: Path) -> bool:
    if openpyxl is None:
        return False
    wb = openpyxl.load_workbook(path)
    changed = False
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for cell in row:
                if isinstance(cell.value, str):
                    new = transform(cell.value)
                    if new != cell.value:
                        cell.value = new
                        changed = True
    if changed:
        wb.save(path)
    wb.close()
    return changed


def main(root: Path) -> None:
    touched: list[str] = []
    for path in root.rglob("*"):
        if not path.is_file() or should_skip(path):
            continue
        if path.suffix.lower() in TEXT_SUFFIXES:
            if patch_text_file(path):
                touched.append(str(path.relative_to(root)))
        elif path.suffix.lower() == DOCX_SUFFIX:
            if patch_docx(path):
                touched.append(str(path.relative_to(root)))
        elif path.suffix.lower() == ".xlsx":
            if patch_xlsx(path):
                touched.append(str(path.relative_to(root)))
    print(f"Root: {root}")
    print(f"Modified {len(touched)} files")
    for t in sorted(touched):
        print(" ", t)


if __name__ == "__main__":
    roots = [FASE2]
    extra = Path(r"C:\CAPSTONE_documentos\Fase2")
    if extra.is_dir():
        roots.append(extra)
    for r in roots:
        main(r)

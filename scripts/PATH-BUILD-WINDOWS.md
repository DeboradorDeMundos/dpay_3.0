# Rutas Windows — build Android D-PAY

**Problema:** `react-native-reanimated` + Ninja/CMake fallan si la ruta supera ~250 caracteres (DEF-BUILD-01).

**Referencia:** [Reanimated — Building on Windows](https://docs.swmansion.com/react-native-reanimated/docs/guides/building-on-windows/)

---

## Medidas de rutas críticas (reanimated)

| Layout | Raíz `codigo` | Obj. reanimated (aprox.) | ¿Compila? |
|---|---|---|---|
| Repo original | `...\Documents\CAPSTONE\dpay_3.0\codigo` (51) | **~336** | ❌ |
| SUBST `W:\` | Igual (CMake usa ruta real `C:\...`) | **~336** | ❌ |
| `C:\dpay\codigo` | 14 | **~262** | ⚠️ Límite |
| **`C:\p\a`** (ShortPaths) | **7** | **~220** | ✅ Recomendado |

---

## Estrategia en 3 niveles

### Nivel 1 — Copia build (recomendado, ya implementado)

| Qué | Dónde |
|---|---|
| Git, commits, PRs | `Documents\CAPSTONE\dpay_3.0` |
| Compilar Honor | `C:\dpay` o **`C:\p`** (`-ShortPaths`) |
| Evidencias | `Documents\CAPSTONE\Evidencias_dpay` (sin cambio) |

```powershell
.\scripts\sync-build-copy.ps1 -ShortPaths -InstallNpm
cd C:\p\a
npm run dev:mobile -- -DeviceId "<SERIAL>"
```

### Nivel 2 — Acortar CAPSTONE en disco (opcional, una vez)

Mover el workspace sin romper Git:

```powershell
# 1. Cerrar Cursor/terminales
# 2. Mover carpeta
Move-Item "C:\Users\NEKODev\Documents\CAPSTONE" "C:\CAPSTONE"
# 3. Junction para rutas viejas (opcional)
cmd /c mklink /J "C:\Users\NEKODev\Documents\CAPSTONE" "C:\CAPSTONE"
```

**Ahorro:** ~22 caracteres. Repo pasa a `C:\CAPSTONE\dpay_3.0\codigo` (29 chars).

| Carpeta actual | Nombre corto sugerido | Ahorro | Impacto build |
|---|---|---|---|
| `Documents\CAPSTONE` | `C:\CAPSTONE` | 22 | Alto |
| `dpay_3.0` | `dpay` | 4 | Medio |
| `codigo` | `app` | 3 | Medio (requiere actualizar docs/scripts) |
| `arch-skills-framework` | `arch-sk` | 12 | Nulo (no afecta Android) |
| `Evidencias_dpay` | `evid` | 10 | Nulo |

**No renombrar en repo (sin acuerdo equipo):** `codigo`, `fase2`, paths en GitHub Actions.

### Nivel 3 — Sistema (complemento)

1. **Rutas largas Windows** (gpedit → Enable Win32 long paths) + reinicio.
2. **Ninja ≥ 1.12** + **CMake ≥ 3.31** en Android SDK.
3. Variable `CMAKE_VERSION=3.31.0` si Gradle sigue usando 3.22.

---

## Duplicados — qué evitar

| Carpeta | ¿Duplicar? |
|---|---|
| `.git` | ❌ Solo en repo original |
| `node_modules` | ⚠️ Excluir en sync → `npm install` en copia |
| `android/build`, `.cxx`, `.gradle` | ❌ Regenerar en build |
| `Evidencias_dpay` | ❌ Una sola copia en CAPSTONE |
| `webpay-proxy/data/*.sqlite` | ❌ Local QA, no sync |

---

## Flujo QA recomendado

```powershell
cd C:\Users\NEKODev\Documents\CAPSTONE\dpay_3.0
git pull origin main
.\scripts\sync-build-copy.ps1 -ShortPaths -InstallNpm
# Metro + proxy en terminales separadas
cd C:\p\a
npm run dev:mobile -- -DeviceId "AFMGBB6413102097"
```

Cambios en `C:\p\a` → volver al repo:

```powershell
.\scripts\sync-build-copy.ps1 -ShortPaths -Reverse
```

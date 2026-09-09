# Trello — sincronización D-PAY 3.0 Capstone

> **Board:** [D-PAY 3.0 🚀 Capstone Duoc × Dtemite](https://trello.com/b/xUz6zs7Y/d-pay-30-🚀-capstone-duoc-×-dtemite)  
> **Última actualización:** 2026-09-08 (Reinhartd Munzenmayer)  
> **Fuente CSV:** `Downloads/xUz6zs7Y - d-pay-30-🚀-capstone-duoc-×-dtemite.csv`

Usar este archivo como **cola de cambios** al actualizar Trello manualmente. Marca `[x]` cuando apliques la acción en el tablero.

---

## Resumen ejecutivo (sesión 2026-09-08)

| Área | Estado | Evidencia / enlace |
|---|---|---|
| Entorno dev Android (PC Reinhartd) | ✅ Listo | Node 24, JDK 17, SDK 34/35, adb, scrcpy |
| Celular Huawei NLA-LX3 | ⚠️ Reconectar USB | Serial esperado: `AFMGBB6413102097` — `adb devices` vacío al cierre |
| Deshabilitar modal actualización app | ✅ Código + push | Rama `feature/disable-app-version-check` |
| PR merge versión check | ⏳ Pendiente revisión | [Compare main...feature](https://github.com/DeboradorDeMundos/dpay_3.0/compare/main...feature/disable-app-version-check) |
| Product Vision / Backlog v3 (fase1) | ⏳ PR docs | Rama `docs/fase1-grupales-v3-reinhard` |
| Sprint 1 desarrollo (PaymentGateway) | 🔜 No iniciado | COD-00 pendiente (Diego) |

---

## Acciones inmediatas en Trello

### Mover a **Producción** (DoD cumplido, mal ubicadas)

- [ ] **DOC-01** Product Vision — checklist **8/8**, Due Complete ✅  
  - Comentario sugerido: `v3.0 en fase1/grupales/Product_Vision_DPAY3.0.docx — PR docs/fase1-grupales-v3-reinhard`
- [ ] **DOC-02** Product Backlog priorizado — checklist **8/8**, Due Complete ✅  
  - Comentario sugerido: `v3.0 en fase1/grupales/Product_Backlog_DPAY3.0.docx — alineado HU-01…HU-08`

### Mover a **En progreso**

- [ ] **COD-00** Inventario baseline — Diego — Sprint 1 día 1  
  - Comentario: `Baseline: tuuPayment.ts directo en PaymentsMethods; sin IPaymentGateway aún`

### Nueva tarjeta sugerida (infra Capstone — opcional)

- [ ] **COD-11** Capstone: deshabilitar chequeo versión Payment Hub  
  - **Lista:** En progreso → QA cuando PR mergeado  
  - **Responsable:** Reinhartd  
  - **Descripción:** Flag `APP_VERSION_CHECK_ENABLED=false` para builds dev Capstone; evita modal bloqueante en login QA.  
  - **Rama:** `feature/disable-app-version-check`  
  - **Checklist:**  
    - [x] Flag en `appVersion.ts`  
    - [x] Guard en `appUpdateService` / `appUpdateStore` / `App.tsx`  
    - [ ] PR aprobado y merge a `main`  
    - [ ] Prueba en dispositivo: login sin modal  
    - [ ] Coordinar con equipo: ¿solo debug/Capstone o también release?

---

## Orden de desarrollo Sprint 1 (referencia tablero)

```
COD-00 → HU-01 → HU-02 → COD-03 Mock → refactor PaymentsMethods → HU-03 Webpay → HU-04 UI
```

| Orden | Tarjeta | Responsable | Notas |
|---|---|---|---|
| 0 | COD-00 Inventario | Diego | Sin cambiar lógica |
| 1 | COD-01 / HU-01 Detección | Diego | `settingsStore` TUU vs GENERIC |
| 2 | COD-02 / HU-02 Contrato + factory | Diego | `IPaymentGateway` |
| 3 | COD-03 MockPaymentGateway | Diego | Desbloquea UI sin llaves Transbank |
| 4 | COD-04 / HU-03 Webpay sandbox | Diego | |
| 5 | COD-05 / HU-04 UI selector | Pablo | |
| QA | COD-07 Tests HU-06 | Reinhartd | Tras factory + detección |
| QA | COD-08 Regresión TUU/Kozen | Reinhartd | Tras refactor pagos |

---

## Tarjetas asignadas a Reinhartd (backlog activo)

| Tarjeta | Lista actual | Próxima acción |
|---|---|---|
| DOC-06 Plan de pruebas maestro | DOC · Por hacer | Redactar borrador S5 |
| DOC-07a…g Planes por sprint | DOC · Por hacer | DOC-07a tras COD-02 |
| COD-07 Tests automatizados HU-06 | CÓDIGO · Por hacer | Esperar factory |
| COD-08 Regresión TUU Kozen | CÓDIGO · Por hacer | Tras HU-02 + celular/Kozen |

---

## Estado listas (CSV 2026-09-08)

| Lista | Tarjetas |
|---|---:|
| 🧭 DOC · Por hacer | 29 |
| 💻 CÓDIGO · Por hacer | 11 |
| 📦 Backlog futuro | 3 |
| En progreso / QA / Producción | 0 |

---

## Evidencias técnicas — deshabilitar actualización

**Problema:** `GET /paymenthub/app/version?platform=android` bloqueaba login si `versionCode < min_version_code`.

**Solución (rama dedicada, no mezclar con docs):**

| Archivo | Cambio |
|---|---|
| `codigo/src/constants/appVersion.ts` | `APP_VERSION_CHECK_ENABLED = false` |
| `codigo/src/services/appUpdateService.ts` | Early return si disabled |
| `codigo/src/stores/appUpdateStore.ts` | `checkForUpdate` no-op |
| `codigo/App.tsx` | Sin timer ni `AppUpdateModal` |

**Reactivar producción:** `APP_VERSION_CHECK_ENABLED = true`

### Casos de prueba (COD-08 / QA sesión)

| ID | Precondición | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-VER-01 | APK debug, flag `false`, red OK | Instalar, abrir app, login QA | Sin modal "actualización obligatoria" | ⏳ Pendiente dispositivo |
| TC-VER-02 | Flag `false`, modo avión | Abrir app | App usable; no crash por version API | ⏳ |
| TC-VER-03 | Flag `true` (build prueba), min_version > 18 | Abrir app | Modal actualización visible | ⏳ Post-merge validación |
| TC-VER-04 | Flag `false` | Flujo venta TUU/effectivo | Sin regresión en pagos | ⏳ |

**Comandos dev (Reinhartd):**

```powershell
cd dpay_3.0/codigo
adb devices                    # autorizar depuración USB en celular
npm start                      # terminal 1
npm run android:dev            # terminal 2 — build + install
npm run scrcpy                 # espejo pantalla (opcional)
```

---

## Git — ramas abiertas

| Rama | Propósito | URL |
|---|---|---|
| `feature/disable-app-version-check` | Fix modal versión + scripts dev | [tree](https://github.com/DeboradorDeMundos/dpay_3.0/tree/feature/disable-app-version-check) |
| `docs/fase1-grupales-v3-reinhard` | Product Vision + Backlog v3 actualizados | PR pendiente |
| `main` (local) | 17 commits detrás de origin | `git pull` cuando no haya WIP |

---

## Bloqueos y seguimiento

1. **adb vacío:** cable USB, modo "Transferencia de archivos", re-autorizar depuración USB.
2. **gh CLI:** no instalado — crear PR desde GitHub web.
3. **PayPal vs Khipu:** inconsistencia documental — unificar antes defensa (ver `Prompt_Contexto_DPAY_3.0.md` §7).
4. **Ortografía nombre:** corregir "Reinhard" → **Reinhartd** en docs v3 si aplica.

---

## Historial de sync (bitácora)

| Fecha | Cambio en repo / entorno | Acción Trello pendiente |
|---|---|---|
| 2026-09-08 | Toolchain Android completo; scripts `run-android-dev.ps1` | — |
| 2026-09-08 | Rama `feature/disable-app-version-check` pusheada (2 commits) | Crear COD-11 o comentar en COD-09 |
| 2026-09-08 | Docx v3 locales ≠ main (hashes distintos) | PR docs; mover DOC-01/02 a Producción |
| 2026-09-08 | Build `assembleDebug` en curso | Marcar TC-VER-01 cuando adb OK |

---

*Copiar secciones a comentarios de tarjetas Trello según avance. Actualizar "Historial de sync" al final de cada sesión.*

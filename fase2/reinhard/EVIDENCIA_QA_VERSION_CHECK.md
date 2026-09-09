# Evidencia QA — deshabilitar chequeo de versión (Capstone dev)

**HU / tarjeta:** Infra Capstone (sugerida COD-11) · apoya COD-08 regresión  
**Responsable:** Reinhartd Munzenmayer  
**Rama:** `feature/disable-app-version-check`  
**Build:** `dtemite-pos` v2.7.0 (`versionCode` 18)  
**Dispositivo objetivo:** Huawei NLA-LX3 (`AFMGBB6413102097`)

---

## Objetivo

Verificar que con `APP_VERSION_CHECK_ENABLED = false` la app **no consulta** Payment Hub ni muestra modal bloqueante de actualización, permitiendo login y pruebas QA en Capstone.

---

## Matriz de prueba

| ID | Tipo | Precondición | Pasos | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|---|---|
| TC-VER-01 | Funcional | APK debug rama feature, USB, credenciales QA | 1. Instalar APK 2. Abrir app 3. Login | Sin modal actualización; login OK | ⏳ | — |
| TC-VER-02 | Resiliencia | Flag false, sin red | Modo avión → abrir app | No crash; app arranca | ⏳ | — |
| TC-VER-03 | Regresión (control) | Flag **true** en build local | Mismo flujo | Modal si `min_version_code` > 18 | ⏳ | Solo validación post-merge |
| TC-VER-04 | Regresión pagos | Flag false, login OK | Venta efectivo o flujo sin TUU | Sin cambio en checkout | ⏳ | — |

---

## Criterios de aceptación técnicos

- [x] `fetchAppVersionPolicy` retorna `null` sin HTTP cuando flag es `false`
- [x] `appUpdateStore.checkForUpdate` sale inmediatamente
- [x] `App.tsx` no monta `AppUpdateModal` ni programa re-check
- [ ] Build debug instala en dispositivo
- [ ] TC-VER-01 ejecutado con captura (scrcpy / screenshot)

---

## Comandos de ejecución

```powershell
cd C:\Users\NEKODev\Documents\CAPSTONE\dpay_3.0\codigo
git checkout feature/disable-app-version-check
adb kill-server; adb start-server; adb devices
npm start
# otra terminal:
npm run android:dev
```

Si `adb devices` vacío: desbloquear teléfono → notificación "Permitir depuración USB" → aceptar.

---

## Notas para merge / producción

- El flag debe acordarse con Diego/Pablo: **¿solo builds Capstone o permanentemente false en debug?**
- Google Play / producción: mantener `APP_VERSION_CHECK_ENABLED = true`.
- Documentar decisión en DOC-05 Manual técnico cuando exista.

---

## Registro de ejecución

| Fecha | Ejecutor | Build | Dispositivo | TC ejecutados | Observaciones |
|---|---|---|---|---|---|
| 2026-09-08 | Reinhartd | — | — | 0/4 | adb sin dispositivo; build Gradle en curso |

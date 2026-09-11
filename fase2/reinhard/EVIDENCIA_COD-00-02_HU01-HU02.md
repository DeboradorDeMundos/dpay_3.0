# Evidencia QA — COD-00 / COD-01 / COD-02 (HU-01 detección + HU-02 factory)

**Responsable:** Reinhartd Munzenmayer  
**Fecha:** 2026-09-09  
**Rama de trabajo:** `feature/COD-00-02-payment-gateway` · commits `d29fd3e`, `091d751`  
**PR:** [#7 mergeado a main](https://github.com/DeboradorDeMundos/dpay_3.0/pull/7) (2026-09-11)  
**Build:** D-PAY v2.7.0 · `APP_UPDATE_CHECK_ENABLED = false`

---

## 1. Qué debes ver en el celular

### Honor X5c (celular genérico — perfil esperado: `GENERIC_MOBILE`)

| Pantalla / acción | Comportamiento esperado |
|---|---|
| **Arranque / Login** | Sin modal bloqueante de “actualización obligatoria” |
| **Login QA** | Entrada normal con credenciales del entorno QA |
| **Venta → Efectivo** | Flujo completo hasta `SaleCompleted` (sin TUU) |
| **Venta → Tarjeta crédito/débito** | Modal: *“Cobro con tarjeta no disponible”* + texto *“En celular genérico use efectivo. Webpay estará disponible en un próximo sprint.”* |
| **Botones tarjeta en UI** | Pueden seguir visibles si están en configuración global (HU-04 ocultará/selector después) |
| **Settings** | Sin cambios visibles de perfil (dato interno en MMKV) |

### Kozen / NLA-LX3 (terminal POS — perfil esperado: `TUU_KOZEN`)

| Pantalla / acción | Comportamiento esperado |
|---|---|
| **Arranque** | Log: `Perfil dispositivo: TUU_KOZEN \| gateways: tuu` |
| **Tarjeta + TUU instalado** | Abre app TUU Negocio → cobro → vuelve a D-PAY |
| **Tarjeta sin TUU** | Modal indicando instalar Tuu Negocio |
| **Efectivo** | Sin regresión |

---

## 2. Cómo verificar (paso a paso)

### A. Preparar PC + celular

```powershell
cd C:\Users\NEKODev\Documents\CAPSTONE\dpay_3.0\codigo
adb kill-server; adb start-server
adb devices
# Honor X5c: desbloquear → "Transferencia de archivos" → autorizar depuración USB
```

### B. Instalar y ejecutar

**Terminal 1:**
```powershell
npm start
```

**Terminal 2:**
```powershell
npm run dev:mobile
# o: npm run dev:mobile -DeviceId "SERIAL_DEL_HONOR"
```

Opcional espejo pantalla:
```powershell
npm run scrcpy
```

### C. Ver logs de detección (Metro o logcat)

En Metro buscar al abrir la app:
```
[App] Perfil dispositivo: GENERIC_MOBILE | gateways: ninguno
```
o en Kozen:
```
[App] Perfil dispositivo: TUU_KOZEN | gateways: tuu
```

**Logcat filtrado:**
```powershell
adb logcat -s ReactNativeJS:* | Select-String "DeviceProfile|PaymentGateway|Perfil dispositivo"
```

### D. Casos de prueba manuales (Honor X5c)

| ID | Pasos | Resultado esperado | Resultado real | Evidencia |
|---|---|---|---|---|
| TC-DEV-01 | Abrir app tras install | Login sin modal versión | ⏳ | captura |
| TC-DEV-02 | Revisar log arranque | `GENERIC_MOBILE`, gateways vacío | ⏳ | log Metro |
| TC-DEV-03 | Venta simple → Efectivo | Completa venta | ⏳ | captura |
| TC-DEV-04 | Venta → Tarjeta débito | Modal “no disponible” celular genérico | ⏳ | captura |
| TC-DEV-05 | Modo avión → abrir app | No crash | ⏳ | — |

*(Completar columna “Resultado real” y adjuntar capturas en `fase2/evidencias/`)*

---

## 3. Auditoría automática (2026-09-09)

### Tests Jest

| Suite | Resultado |
|---|---|
| `PaymentGatewayFactory.test.ts` | ✅ 3/3 |
| `devicePaymentProfile.test.ts` | ✅ 2/2 (TUU_KOZEN + GENERIC_MOBILE) |
| `App.test.tsx` | ⚠️ Falla preexistente (import ESM `@react-navigation`) — no relacionado con COD-00/02 |

**Comando:** `npm test -- --testPathPattern="devicePaymentProfile|PaymentGatewayFactory"` → **5 passed**; 1 suite legacy (`App.test.tsx`) fallida preexistente.

### Calidad de código (revisión estática)

| Criterio | Estado | Notas |
|---|---|---|
| UI desacoplada de TUU en venta | ✅ | `PaymentsMethods` usa `PaymentGatewayFactory` |
| Adapter TUU aislado | ✅ | `TuuPaymentGateway.ts` |
| Factory extensible | ✅ | Stubs `webpay`, `mock` registrados |
| Perfil persistido MMKV | ✅ | `settingsStore.refreshDevicePaymentProfile` |
| Detección al boot | ✅ | `App.tsx` |
| Payment Hub sin refactor | ⚠️ Pendiente | `ExternalPaymentScreen` aún importa `tuuPaymentService` directo |
| Ocultar tarjetas en celular | ⚠️ HU-04 | Hoy muestra modal al intentar cobro |
| Cobertura tests integración | ⚠️ | Solo unitarios con mocks |

### Riesgos conocidos

1. Honor X5c puede reportar serial vacío → correctamente cae en `GENERIC_MOBILE`.
2. Si config global incluye tarjetas, el usuario las ve pero no puede cobrar (esperado hasta Webpay).
3. Cambios aún **no commiteados** en rama feature — coordinar PR con Diego/Pablo.

---

## 4. Archivos entregables COD-00 → COD-02

| COD | Artefacto |
|---|---|
| COD-00 | `fase2/COD-00-inventario-baseline.md` |
| COD-01 | `devicePaymentProfileService.ts`, `settingsStore` (+ campos), `deviceInfo.isKozenPosDevice` |
| COD-02 | `types/paymentGateway.ts`, `paymentGateway/*`, refactor `PaymentsMethods.tsx` |
| QA | `__tests__/PaymentGatewayFactory.test.ts`, `__tests__/devicePaymentProfile.test.ts` |

---

## 5. Trello — dónde y cómo actualizar

**Board:** [D-PAY 3.0 Capstone](https://trello.com/b/xUz6zs7Y/d-pay-30-🚀-capstone-duoc-×-dtemite)

### Tarjetas a mover / comentar

| Tarjeta | Acción sugerida | Checklist |
|---|---|---|
| **COD-00 Inventario baseline** | Mover a **QA** → tras validar, **Producción** | Marcar ítems checklist; adjuntar link a `COD-00-inventario-baseline.md` en GitHub |
| **COD-01 HU-01 Detección** | **En progreso** → **QA** cuando TC-DEV-02 pase en Honor | Perfil MMKV, log arranque, Kozen vs genérico |
| **COD-02 HU-02 Contrato + factory** | **En progreso** → **QA** | Factory + adapter + PaymentsMethods sin import directo TUU |

### Pasos en Trello (manual)

1. Abrir el board → lista **💻 CÓDIGO · Por hacer** (o **En progreso**).
2. Abrir tarjeta **COD-00** → **Mover** a **QA** (Reinhartd validando).
3. En **Comentarios**, pegar:
   ```
   Evidencia COD-00: inventario baseline en repo fase2/COD-00-inventario-baseline.md
   Commit/PR: [pendiente feature/COD-00-02-payment-gateway]
   Tests: PaymentGatewayFactory + devicePaymentProfile OK
   ```
4. Repetir para **COD-01** y **COD-02** con link a este archivo:  
   `fase2/reinhard/EVIDENCIA_COD-00-02_HU01-HU02.md`
5. **Adjuntar** capturas desde `fase2/evidencias/` (crear carpeta si no existe).
6. Asignarte (**REINHARDT**) en COD-01/02 si no está.
7. Cuando TC-DEV-01…05 pasen en Honor X5c → mover COD-01 y COD-02 a **Producción**.

### Etiquetas

- `CÓDIGO`, `HU-01`, `HU-02`, `REINHARDT`, `S1`

---

## 6. Plantilla comentario Trello (copiar/pegar)

```
✅ COD-00/01/02 — evidencia Reinhartd (2026-09-09)

Dispositivo prueba: Honor X5c (GENERIC_MOBILE esperado)
Build: v2.7.0 · main local

Automático:
- Jest PaymentGatewayFactory: PASS
- Jest devicePaymentProfile: PASS

Manual (Honor):
- TC-DEV-01 login sin modal versión: [OK/FAIL]
- TC-DEV-02 perfil GENERIC_MOBILE en log: [OK/FAIL]
- TC-DEV-03 efectivo: [OK/FAIL]
- TC-DEV-04 tarjeta → modal no disponible: [OK/FAIL]

Docs: fase2/reinhard/EVIDENCIA_COD-00-02_HU01-HU02.md
PR: pendiente
```

---

*Actualizar sección 2.D y plantilla Trello tras prueba en Honor X5c.*

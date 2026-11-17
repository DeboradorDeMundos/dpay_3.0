# Pruebas de Seguridad - D-PAY 3.0

_Sin PAN/CVV en logs ni MMKV; repo sin keystore ni .env reales_

- **Proyecto:** D-PAY 3.0 - POS movil multi-pasarela (DTemite)
- **Asignatura:** Capstone APT122 - Duoc UC 2026-2
- **Documento:** DOC-07 / 04_Seguridad
- **Version:** 1.0
- **Fecha:** 2026-10-04
- **Autor:** Reinhartd Munzenmayer (QA)
- **Equipo:** Diego Madrid, Pablo Gutierrez, Reinhartd Munzenmayer
- **Estado:** Vigente
- **Repositorio:** https://github.com/DeboradorDeMundos/dpay_3.0

---

## 1. Objetivo

Evidenciar que la app no almacena datos sensibles de tarjeta y que el repositorio publico no contiene secretos (keystore de firma, .env reales).


## 2. No PAN/CVV en logs ni MMKV

- El cobro de tarjeta se delega a TUU (Intent) o al proxy Webpay; la app no captura PAN/CVV.
- El proxy mapea solo last4 (ej. '6623'); el PAN no se persiste. Test node:test: 'commit AUTHORIZED guarda autorizacion y ultimos 4, no el PAN' -> PASS.
- El historial de intentos (cardPaymentAttempts) guarda provider/status/last4/token, no PAN.


## 3. Secretos fuera de Git

Verificacion 27/09/2026 sobre dpay_3.0:

| Comando | Resultado |
|---|---|
| git ls-files (patrones .env/keystore/token/secret) | solo .env.example, .env.trello.example, keystore.properties.example, debug.keystore, ios/.xcode.env |
| git check-ignore codigo/.env codigo/.env.trello webpay-proxy/.env | los tres estan IGNORADOS |
| .gitignore | ignora .env.trello, codigo/.env.trello, node_modules, .cursor/, .agents/ |

> Hallazgo: debug.keystore SI esta versionado. Es la keystore de depuracion estandar de Android (publica, no de firma de release); no es un secreto. La keystore de release debe permanecer fuera de Git (ver HALLAZGOS).


## 4. Otros controles

| Check | Criterio | Estado |
|---|---|---|
| SEC-02 | Token de sesion en MMKV (no AsyncStorage plano) | OK |
| SEC-03 | API solo HTTPS (TLS 1.2+) | OK (revision apiClient.ts) |
| SEC-04 | b64pass solo para DTE legacy; clave nunca en texto plano | OK |

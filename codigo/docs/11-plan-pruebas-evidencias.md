# Plan de Pruebas y Evidencias — D-PAY 3.0

**Capstone APT122 · Scrum**  
**Versión:** 2.0 · 9 septiembre 2026

---

## 1. Objetivo

Validar que **D-PAY funciona como POS completo**: el cajero entra, vende, cobra, emite DTE, revisa historial e imprime. Las pruebas cubren el producto, no un módulo de pasarela.

---

## 2. Estrategia

| Tipo | Alcance | Herramienta | Cuándo |
|---|---|---|---|
| **Unitarias** | Totales, neto/IVA, mapeo TUU → `tbl_dpay` | Jest | Sprints 2–5 |
| **Integración** | Login, catálogo, `POST /pos/transaccion`, DTE | Manual + Postman | Continuo |
| **Funcionales E2E** | Flujos de caja en Android | Dispositivo físico | Cada sprint |
| **Regresión** | Efectivo + DTE; TUU si hay Kozen | Celular / P8 Neo | Cada Review |
| **Rendimiento** | Login, catálogo, emisión DTE | Cronómetro / logs | Semana 10 |
| **Seguridad** | Sin PAN, HTTPS, secretos fuera de Git | Checklist | Sprints 3 y 15 |

---

## 3. Matriz de casos — producto

| ID | Módulo | Escenario | Resultado esperado | Prioridad | Evidencia |
|---|---|---|---|---|---|
| TC-01 | Auth | Login válido QA | Entra al POS, carga catálogo/CAF | Alta | Pendiente |
| TC-02 | Auth | Clave incorrecta | Error en español, no entra | Alta | Pendiente |
| TC-03 | Venta | Calculadora + boleta 39 + efectivo | DTE emitido, fila en `tbl_dpay` | Alta | Pendiente |
| TC-04 | Venta | Catálogo + factura 33 + cliente | DTE 33, neto/IVA correctos | Alta | Pendiente |
| TC-05 | Venta | Comprobante 0 + efectivo | Sin DTE SII; transacción registrada | Media | Pendiente |
| TC-06 | TUU | Crédito en Kozen | authCode, last4, status OK | Alta | Pendiente (si hay hardware) |
| TC-07 | TUU | Rechazo / error TUU | Mensaje claro, `detalle_error` | Alta | Pendiente |
| TC-08 | Historial | Filtro fecha y folio | Aparece la venta del TC-03 | Alta | Pendiente |
| TC-09 | NC | Anulación total post-boleta | NC 61, estado actualizado | Alta | Pendiente |
| TC-10 | Print | Ticket Bluetooth | Imprime documento o voucher | Media | Pendiente |
| TC-11 | Hub | Intent remoto | Monto en pantalla, cobro, webhook | Media | Pendiente |
| TC-12 | Offline | Carrito sin red; DTE/TUU con red | Venta local en MMKV; DTE falla sin red y se reintenta | Media | Pendiente |
| TC-13 | Seg | Secretos no en repo | `git grep` limpio | Alta | Parcial |
| TC-14 | Perf | Login < 3 s | Cumple RNF-01.1 | Media | Pendiente |
| TC-15 | Perf | DTE < 15 s | Cumple RNF-01.4 | Media | Pendiente |

**Leyenda:** Pendiente · Parcial · OK

Si no hay Kozen en la demo, TC-06/07 se documentan como bloqueados por hardware y la defensa usa TC-03.

---

## 4. Pruebas unitarias planificadas

```typescript
describe('calculosDte', () => {
  it('boleta 39 trata el monto como bruto', ...);
  it('factura 33 calcula neto e IVA', ...);
});

describe('mapTuuToTblDpay', () => {
  it('mapea crédito a id_mediopago 101', ...);
  it('guarda detalle_error en rechazo', ...);
});
```

---

## 5. Seguridad

| Check | Criterio | Método |
|---|---|---|
| SEC-01 | No PAN/CVV en logs ni MMKV | Revisión código |
| SEC-02 | Token en MMKV | `authStore` |
| SEC-03 | HTTPS en `apiClient.ts` | Revisión |
| SEC-04 | `.env` y keystore fuera de Git | `.gitignore` |

---

## 6. Rendimiento (Semana 10)

| Métrica | Objetivo | Método |
|---|---|---|
| Login | < 3 s | 5 muestras |
| Catálogo 500 prod. | < 5 s | Reloj + red |
| Emisión DTE | < 15 s | Confirmar → folio |

Resultados: `fase2/informe-avance/metricas-rendimiento.md`.

---

## 7. Evidencias por hito

| Hito | Semana | Evidencia | Carpeta |
|---|---|---|---|
| Fase 1 | 4 | Capturas UI del POS, docs | `fase1/` |
| Informe avance | 10 | PRs, capturas TC-01..05, logs | `fase2/informe-avance/` |
| Producto final | 15 | APK, matriz TC, video flujo completo | `fase2/entrega-final/` |
| Defensa | 17 | Demo en vivo | `fase3/` |

Nombres: `TC-03_efectivo_boleta_2026-10-15.png`. Video ≤ 10 min: login → venta → cobro → DTE → historial.

---

## 8. Defectos

| Severidad | Definición | SLA |
|---|---|---|
| Crítico | No se puede vender o se pierde el DTE | Antes de cerrar sprint |
| Alto | TUU o emisión fallan en caso feliz | ≤ 3 días |
| Medio | UI / mensaje | Siguiente sprint |
| Bajo | Cosmético | Backlog |

---

## 9. DoD de pruebas

- [ ] 100% de casos Alta ejecutados (salvo hardware TUU)
- [ ] 0 defectos críticos abiertos
- [ ] Evidencias en repo antes de Semana 10
- [ ] Flujo efectivo + boleta grabado en video

---

**Revisión:** v2.0 — 9 septiembre 2026

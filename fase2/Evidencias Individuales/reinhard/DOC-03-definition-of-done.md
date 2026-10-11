# DOC-03 — Definition of Done

Fecha: 2026-09-26. Sirve para decidir si una tarjeta puede ir a QA o a Producción.

## Código

Una tarjeta de código está lista para **QA** cuando:

- El cambio está en el repo (`dpay_3.0`) y la copia de compilación `C:\dpay` está sincronizada.
- Hay prueba automática del comportamiento nuevo, y esa prueba pasa en el PC.
- No se guardan PAN, CVV ni secretos de Transbank en la app, en SQLite ni en git.
- El flujo de efectivo y DTE no se rompe.
- Si el cambio toca Webpay, el proxy expone `provider`, `token`, `buy_order` y `status`, y un fallo no se envía a `tbl_dpay` TUU.

Está lista para **Producción** cuando, además, QA ejecutó el caso manual en Honor o emulador, hay evidencia con nombre de caso y fecha, y no queda un defecto crítico abierto.

## Documentos

Un documento está listo cuando describe el comportamiento del código vigente, indica qué queda fuera de alcance y no copia credenciales reales distintas de los códigos públicos de integración Transbank ya publicados en `.env.example`.

## Sprint

El sprint no se cierra con tarjetas en CÓDIGO que el equipo ya declaró terminadas en la demo. La evidencia manual pendiente se nombra en la matriz (`Evidencias_dpay/00-indice/MATRIZ-TRAZABILIDAD.md`) y no se marca como cubierta.

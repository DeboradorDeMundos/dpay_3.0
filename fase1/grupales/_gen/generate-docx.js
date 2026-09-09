const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, HeadingLevel, VerticalAlign,
  ShadingType, LevelFormat
} = require('docx');

const OUT_DIR = path.join(__dirname, '..');

const FONT = 'Calibri';
const INSTITUCION = 'DUOC UC — ESCUELA DE INFORMÁTICA Y TELECOMUNICACIONES';

function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color });
}

function para(children, opts = {}) {
  const items = typeof children === 'string' ? [run(children, opts)] : children;
  return new Paragraph({
    children: items,
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    alignment: opts.align,
    heading: opts.heading,
    bullet: opts.bullet ? { level: opts.bulletLevel || 0 } : undefined,
  });
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function metaRow(label, value) {
  return para([run(label + '\t', { bold: true }), run(value)]);
}

function cell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({
      children: [run(text, { bold: opts.bold, size: opts.size || 20 })],
      alignment: opts.align,
    })],
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.header ? { fill: 'D9E2F3', type: ShadingType.CLEAR } : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function backlogTable(rows) {
  const header = ['ID', 'Historia de usuario', 'Criterios de aceptación', 'Prioridad', 'Pts.', 'Sprint'];
  const tableRows = [
    new TableRow({
      children: header.map(h => cell(h, { bold: true, header: true, size: 18 })),
      tableHeader: true,
    }),
    ...rows.map(r => new TableRow({
      children: [
        cell(r.id, { size: 18 }),
        cell(r.story, { size: 18 }),
        cell(r.ca, { size: 18 }),
        cell(r.priority, { size: 18 }),
        cell(String(r.pts), { size: 18, align: AlignmentType.CENTER }),
        cell(r.sprint, { size: 18, align: AlignmentType.CENTER }),
      ],
    })),
  ];
  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
  });
}

function coverBlock(title, subtitle) {
  return [
    para(INSTITUCION, { align: AlignmentType.CENTER, after: 80 }),
    para('[Espacio reservado para logo institucional DUOC UC]', { align: AlignmentType.CENTER, after: 200, italics: true }),
    para(title, { align: AlignmentType.CENTER, after: 80, bold: true, size: 32 }),
    para(subtitle, { align: AlignmentType.CENTER, after: 300, size: 24 }),
  ];
}

function metaBlock(fields) {
  return fields.flatMap(([k, v]) => [metaRow(k, v)]);
}

async function writeDoc(filename, doc) {
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, buffer);
  console.log('Written:', outPath, '(' + buffer.length + ' bytes)');
}

function buildVisionDoc() {
  const children = [
    ...coverBlock('PRODUCT VISION', 'Proyecto Capstone D-PAY 3.0\nPOS móvil de DTemite: vender, cobrar y emitir DTE'),
    ...metaBlock([
      ['Asignatura', 'DSY1102 / PTY4614-001V — Capstone (Sección 001)'],
      ['Empresa mandante', 'DTemite — ERP SaaS de facturación electrónica; encarga un nuevo rubro POS'],
      ['Contacto / líder empresa', 'José Robles Rocha — Product Owner'],
      ['Equipo de proyecto', 'Diego Madrid (desarrollo), Pablo Gutiérrez (arquitectura/Scrum Master), Reinhartd Munzenmayer (QA/documentación)'],
      ['Product Owner', 'José Robles Rocha (DTemite)'],
      ['Scrum Master', 'Pablo Gutiérrez'],
      ['Docente guía', 'Fabián Alcántara Guajardo'],
      ['Metodología', 'Scrum — sprints de 2 semanas, 18 semanas (2026-2)'],
      ['Repositorio', 'github.com/DeboradorDeMundos/dpay_3.0'],
      ['Fecha', 'Septiembre 2026 — Fase 1'],
      ['Revisión', 'v2.0 — Producto D-PAY completo'],
    ]),
    para(''),
    heading('1. Problema u Oportunidad'),
    heading('1.1 Situación de la empresa', HeadingLevel.HEADING_2),
    para('DTemite opera un ERP web de facturación electrónica: el comercio emite DTE al SII, administra clientes, productos y folios desde un computador. Ese producto cubre la oficina. No cubre el mostrador, la feria ni el delivery.'),
    para('La plataforma cloud de DTemite (API REST, Legacy PHP, PostgreSQL multi-tenant) ya existe. Lo que no existía como línea de producto es un punto de venta móvil alineado a esa misma base de datos.'),
    heading('1.2 El hueco', HeadingLevel.HEADING_2),
    para('En el momento de vender, el comercio necesita armar el cobro, recibir efectivo o tarjeta, emitir la boleta o factura y entregar comprobante. Sin POS móvil, DTemite queda fuera de ese rubro y el cliente usa dos herramientas desconectadas (caja + facturador).'),
    heading('1.3 Oportunidad', HeadingLevel.HEADING_2),
    para('Crear D-PAY: un DTemite compacto para celular y terminal Android. El equipo Capstone diseña y desarrolla ese producto completo — login, venta, cobro, DTE, historial, impresión y Payment Hub — integrado a la API de la empresa.'),
    heading('2. Objetivos'),
    heading('Objetivo general', HeadingLevel.HEADING_2),
    para('Diseñar y desarrollar D-PAY, el POS móvil de DTemite, para que un comercio autenticado venda, cobre y emita DTE desde un dispositivo Android, sobre la plataforma cloud de la empresa.'),
    heading('Objetivos específicos', HeadingLevel.HEADING_2),
    para('OE-01: Autenticar al comercio (RUT, usuario, clave) y persistir sesión segura (token bearer, PIN/biometría).', { bullet: true }),
    para('OE-02: Armar ventas con calculadora, catálogo, scanner, cliente y tipo de documento.', { bullet: true }),
    para('OE-03: Cobrar en efectivo y con tarjeta TUU (Kozen); registrar en tbl_dpay.', { bullet: true }),
    para('OE-04: Emitir DTE al SII (33, 34, 39, 41, 0, NC 61) con TED y PDF.', { bullet: true }),
    para('OE-05: Historial, notas de crédito e impresión Bluetooth ESC/POS.', { bullet: true }),
    para('OE-06: Recibir cobros remotos vía Payment Hub.', { bullet: true }),
    para('OE-07: Documentar producto, arquitectura, RF/RNF y pruebas del Capstone.', { bullet: true }),
    heading('3. Usuarios / Stakeholders'),
    para('DTemite — empresa mandante que abre el rubro POS. Contacto: José Robles Rocha.', { bullet: true }),
    para('Comerciante / cajero — vende en local o terreno con celular o terminal Kozen.', { bullet: true }),
    para('Cliente final — paga y recibe boleta o factura.', { bullet: true }),
    para('Administrador DTemite — ve las ventas móviles en el ERP.', { bullet: true }),
    para('Integradores — envían cobros al POS por Payment Hub.', { bullet: true }),
    para('Equipo Capstone — Diego Madrid, Pablo Gutiérrez, Reinhartd Munzenmayer.', { bullet: true }),
    para('Docente guía — Fabián Alcántara Guajardo.', { bullet: true }),
    heading('4. Alcance del producto (MVP)'),
    heading('Incluye', HeadingLevel.HEADING_2),
    para('• Login multi-tenant, PIN y biometría.', { bullet: true }),
    para('• Venta (calculadora, catálogo, scanner, propina, offline).', { bullet: true }),
    para('• Cobro efectivo y tarjeta TUU.', { bullet: true }),
    para('• Emisión DTE, TED, PDF, vínculo a transacción.', { bullet: true }),
    para('• Historial, NC, anulación, impresión Bluetooth.', { bullet: true }),
    para('• Payment Hub y configuración del POS.', { bullet: true }),
    para('• Documentación y plan de pruebas Capstone.', { bullet: true }),
    heading('No incluye', HeadingLevel.HEADING_2),
    para('• Reescribir el ERP web DTemite.', { bullet: true }),
    para('• Abonos, inventario avanzado y contabilidad (siguen en el ERP).', { bullet: true }),
    para('• iOS nativo.', { bullet: true }),
    para('• Nuevas pasarelas web (Webpay, Flow, Mercado Pago) — backlog futuro.', { bullet: true }),
    heading('5. Restricciones'),
    para('• 18 semanas; equipo de 3; repo público sin secretos.', { bullet: true }),
    para('• Stack: React Native 0.75.5, TypeScript, Zustand, MMKV.', { bullet: true }),
    para('• Backend DTemite compartido: integración por API, cambios coordinados con PO.', { bullet: true }),
    para('• TUU solo en hardware Kozen; en celular el cobro del MVP es efectivo.', { bullet: true }),
    para('• DTE sujeto a normativa SII.', { bullet: true }),
    heading('6. Justificación'),
    para('El ERP ya factura. El problema es dónde ocurre la venta. D-PAY es un producto distinto (UX táctil, offline, Bluetooth, Intent de pago), no otra pantalla del navegador.'),
    para('El Capstone cumple situación real: empresa mandante, SII, TUU, multi-tenant. El valor para DTemite es una línea de negocio nueva (POS) sobre la misma plataforma.'),
    heading('7. Métricas de éxito'),
    para('• Flujos: login, venta, efectivo, TUU, DTE, historial, NC, impresión.', { bullet: true }),
    para('• Tipos DTE: 33, 34, 39, 41, 0, NC 61.', { bullet: true }),
    para('• Transacción en tbl_dpay + DTE vinculado.', { bullet: true }),
    para('• 0 defectos críticos en el flujo venta → cobro → DTE.', { bullet: true }),
    heading('8. Riesgos'),
    para('• QA/API DTemite no disponible → credenciales desde Semana 1.', { bullet: true }),
    para('• Sin Kozen → demo con efectivo + DTE.', { bullet: true }),
    para('• Complejidad SII → reutilizar contrato legacy de la empresa.', { bullet: true }),
    para(''),
    para([run('Equipo Capstone D-PAY 3.0 — Duoc UC San Bernardo, 2026.', { italics: true })]),
    para([run('Versión v2.0 — 9 de septiembre de 2026. Producto D-PAY completo.', { italics: true })]),
  ];

  return new Document({
    sections: [{ properties: {}, children }],
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT }],
      }],
    },
  });
}

function buildBacklogDoc() {
  const mvpRows = [
    { id: 'HU-01', story: 'Como comercio DTemite, quiero entrar a D-PAY con RUT, usuario y clave, para usar mi empresa desde el celular.', ca: 'Login POST /api/login. Token bearer en MMKV. Descarga CAF, catálogo y clientes.', priority: 'Alta', pts: 5, sprint: '1' },
    { id: 'HU-02', story: 'Como cajero, quiero bloquear la app con PIN patrón o biometría, para proteger la caja.', ca: 'PIN patrón 3×3. Biometría opcional (off en Kozen). Contrato dpay_pos. b64pass solo para DTE.', priority: 'Alta', pts: 3, sprint: '1' },
    { id: 'HU-03', story: 'Como cajero, quiero armar una venta con calculadora, catálogo o scanner, para cobrar rápido.', ca: 'Calculadora, catálogo, scanner, carrito, offline.', priority: 'Alta', pts: 8, sprint: '1-2' },
    { id: 'HU-04', story: 'Como cajero, quiero elegir tipo de documento y cliente, para emitir boleta, factura o comprobante.', ca: 'Tipos 39, 33, 34, 41, 0. Cliente o consumidor final. Propina.', priority: 'Alta', pts: 5, sprint: '2' },
    { id: 'HU-05', story: 'Como cajero, quiero cobrar en efectivo, para cerrar ventas sin terminal de tarjeta.', ca: 'Medio efectivo. Registro tbl_dpay. Sigue a DTE si aplica.', priority: 'Alta', pts: 5, sprint: '2' },
    { id: 'HU-06', story: 'Como cajero con Kozen, quiero cobrar crédito o débito con TUU, para aceptar tarjeta.', ca: 'Intent TUU. authCode, last4, comisiones. detalle_error en fallos.', priority: 'Alta', pts: 8, sprint: '2' },
    { id: 'HU-07', story: 'Como comercio, quiero emitir el DTE al SII al cerrar la venta, para cumplir la ley.', ca: 'API Documento. Neto/IVA. TED, PDF, vínculo a transacción.', priority: 'Alta', pts: 13, sprint: '2-3' },
    { id: 'HU-08', story: 'Como cajero, quiero ver el historial de ventas, para revisar folios y montos.', ca: 'Filtro fecha/tipo/folio. Une local y servidor.', priority: 'Media', pts: 5, sprint: '3' },
    { id: 'HU-09', story: 'Como cajero, quiero anular o emitir nota de crédito, para corregir una venta.', ca: 'NC total o corrección. Anular pago sin DTE.', priority: 'Media', pts: 5, sprint: '3' },
    { id: 'HU-10', story: 'Como cajero, quiero imprimir el ticket por Bluetooth, para entregar comprobante.', ca: 'ESC/POS. Auto print. TED PDF417.', priority: 'Media', pts: 5, sprint: '4' },
    { id: 'HU-11', story: 'Como integrador, quiero enviar un cobro al POS por Payment Hub.', ca: 'Poll de intents. Cobro local. Resultado al Hub.', priority: 'Media', pts: 8, sprint: '4' },
    { id: 'HU-12', story: 'Como cajero, quiero configurar documentos, logo, impresión y tema.', ca: 'Logo. Docs on/off. Comisiones. Claro/oscuro.', priority: 'Baja', pts: 3, sprint: '4' },
    { id: 'HU-13', story: 'Como equipo, quiero documentar D-PAY como producto completo.', ca: 'docs/ + Vision/Backlog Word.', priority: 'Media', pts: 5, sprint: '0-1' },
    { id: 'HU-14', story: 'Como equipo, quiero probar venta → cobro → DTE, para defender el producto.', ca: 'Matriz TC. Capturas/video. 0 críticos.', priority: 'Media', pts: 8, sprint: '5' },
  ];

  const futureRows = [
    { id: 'HU-15', story: 'Como comercio, quiero cobrar con Webpay en celular sin Kozen.', ca: 'Sandbox Transbank. Fuera del MVP.', priority: 'Baja — futuro', pts: 13, sprint: '—' },
    { id: 'HU-16', story: 'Como comercio, quiero D-PAY en iOS.', ca: 'Misma app en iPhone. Fuera del MVP.', priority: 'Baja — futuro', pts: 13, sprint: '—' },
  ];

  const children = [
    ...coverBlock('PRODUCT BACKLOG', 'Proyecto Capstone D-PAY 3.0\nPOS móvil de DTemite — producto completo'),
    ...metaBlock([
      ['Empresa mandante', 'DTemite'],
      ['Contacto / líder empresa', 'José Robles Rocha — Product Owner'],
      ['Equipo de proyecto', 'Diego Madrid, Pablo Gutiérrez, Reinhartd Munzenmayer'],
      ['Product Owner', 'José Robles Rocha (DTemite)'],
      ['Scrum Master', 'Pablo Gutiérrez'],
      ['Docente guía', 'Fabián Alcántara Guajardo'],
      ['Metodología', 'Scrum — 7 sprints, 2 semanas c/u'],
      ['Revisión', 'v2.0 — 9 septiembre 2026 — producto D-PAY completo'],
    ]),
    para(''),
    heading('1. Introducción'),
    para('Este backlog describe D-PAY completo: el POS que DTemite encarga para vender, cobrar y emitir DTE desde el celular. Prioridad: flujo comercial de punta a punta, luego post-venta, luego Hub y calidad.'),
    para('Velocidad: 18–22 pts/sprint. Historias de producto HU-01 a HU-14.'),
    heading('2. Épicas'),
    para('EP-01 Identidad · EP-02 Venta · EP-03 Cobro · EP-04 DTE · EP-05 Post-venta · EP-06 Hub/config · EP-07 Calidad Capstone.'),
    heading('3. Backlog priorizado — producto'),
    backlogTable(mvpRows),
    para(''),
    heading('4. Backlog futuro'),
    backlogTable(futureRows),
    para(''),
    heading('5. Definition of Ready (DoR)'),
    para('CA claros, sin bloqueo, estimada, priorizada, riesgos identificados.', { bullet: true }),
    heading('6. Definition of Done (DoD)'),
    para('Código en main, CA en Android, sin romper venta→DTE, docs al día, review, demo.', { bullet: true }),
    heading('7. Evidencia UI'),
    para('Pantallas del POS: login, venta, documento, pago, catálogo, historial, NC, settings, impresora, Hub.'),
    para(''),
    para([run('Documento vivo v2.0 — Product Vision D-PAY como POS completo de DTemite.', { italics: true })]),
  ];

  return new Document({
    sections: [{ properties: {}, children }],
  });
}

(async () => {
  await writeDoc('Product_Vision_DPAYv3.0.docx', buildVisionDoc());
  await writeDoc('Product_Backlog_DPAYv3.0.docx', buildBacklogDoc());
})();

/**
 * Genera las colecciones Postman Personal Dev e Integrador.
 * Uso: node generate-postman-collections.js
 */
const fs = require('fs');
const path = require('path');

const TEST_SAVE_INTENT = [
  "pm.test('HTTP 200', () => pm.response.to.have.status(200));",
  "const json = pm.response.json();",
  "pm.test('Intent creado', () => {",
  "  pm.expect(json.success).to.eql(true);",
  "  pm.expect(json.intent).to.be.an('object');",
  "  pm.expect(json.intent.status).to.eql('pending');",
  "});",
  "if (json.intent) {",
  "  pm.collectionVariables.set('intent_id', String(json.intent.id));",
  "  pm.collectionVariables.set('external_id', json.intent.external_id);",
  "  console.log('intent_id:', json.intent.id, '| external_id:', json.intent.external_id);",
  "  console.log('👉 En ~5 s debe aparecer en el POS con Cobros externos activos');",
  "}",
];

const TEST_POLL = [
  "pm.test('HTTP 200', () => pm.response.to.have.status(200));",
  "const json = pm.response.json();",
  "const st = json.intent && json.intent.status;",
  "console.log('Estado:', st);",
  "if (st === 'succeeded') {",
  "  console.log('✅ COBRO OK | dpay_transaccion_id:', json.intent.dpay_transaccion_id);",
  "} else if (['failed','cancelled','expired'].includes(st)) {",
  "  console.log('❌ Terminó en:', st);",
  "} else {",
  "  console.log('⏳ Sigue en curso — ejecuta de nuevo en 3-5 s');",
  "}",
];

const TEST_TERMINALS = [
  "pm.test('HTTP 200', () => pm.response.to.have.status(200));",
  "const json = pm.response.json();",
  "pm.test('success true', () => pm.expect(json.success).to.eql(true));",
  "if (json.terminals && json.terminals.length) {",
  "  json.terminals.forEach(t => {",
  "    console.log(t.terminal_code, '|', t.connection_status, '| ext:', t.external_payment_enabled);",
  "  });",
  "} else {",
  "  console.warn('Sin terminales — verifica merchant_rut y vínculo del integrador');",
  "}",
];

function prerequestExternalId(prefix) {
  return [
    `const ext = '${prefix}-' + Date.now();`,
    "pm.collectionVariables.set('external_id', ext);",
    "console.log('external_id:', ext);",
  ];
}

function postRequest(name, method, url, description, body, tests, prerequest) {
  const req = {
    name,
    request: {
      method,
      header: [
        { key: 'Content-Type', value: 'application/json', disabled: method === 'GET' || method === 'DELETE' },
        { key: 'X-Api-Key', value: '{{api_key}}', type: 'text' },
      ].filter(h => !h.disabled || h.key !== 'Content-Type'),
      url,
      description,
    },
    response: [],
  };
  if (body !== undefined) {
    req.request.body = { mode: 'raw', raw: body };
  }
  const events = [];
  if (prerequest) {
    events.push({ listen: 'prerequest', script: { exec: prerequest, type: 'text/javascript' } });
  }
  if (tests) {
    events.push({ listen: 'test', script: { exec: tests, type: 'text/javascript' } });
  }
  if (events.length) req.event = events;
  return req;
}

function intentBody(metadataExtra, amount = '{{demo_amount}}', description = 'Cobro externo desde Postman') {
  const metadata = { flow_type: 'payment_only', ...metadataExtra };
  return JSON.stringify({
    merchant_rut: '{{merchant_rut}}',
    sistema: '{{sistema}}',
    amount: Number(String(amount).replace(/\{\{demo_amount\}\}/, '15990')) || '{{demo_amount}}',
    terminal_code: '{{terminal_code}}',
    external_id: '{{external_id}}',
    description,
    currency: 'CLP',
    expires_in_seconds: 900,
    metadata,
  }, null, 2)
    .replace('"15990"', '{{demo_amount}}')
    .replace('"{{merchant_rut}}"', '"{{merchant_rut}}"')
    .replace('"{{sistema}}"', '"{{sistema}}"')
    .replace('"{{terminal_code}}"', '"{{terminal_code}}"')
    .replace('"{{external_id}}"', '"{{external_id}}"');
}

// Fix intentBody - use template strings in raw JSON instead
function rawIntent(metadata, opts = {}) {
  const amount = opts.amount || '{{demo_amount}}';
  const desc = opts.description || 'Cobro externo desde Postman';
  const metaJson = JSON.stringify(metadata, null, 4).split('\n').map((l, i) => (i === 0 ? l : '    ' + l)).join('\n');
  return `{
  "merchant_rut": "{{merchant_rut}}",
  "sistema": "{{sistema}}",
  "amount": ${amount === '{{demo_amount}}' ? '{{demo_amount}}' : amount},
  "terminal_code": "{{terminal_code}}",
  "external_id": "{{external_id}}",
  "description": "${desc}",
  "currency": "CLP",
  "expires_in_seconds": 900,
  "metadata": ${JSON.stringify(metadata, null, 2).split('\n').join('\n  ')}
}`;
}

function buildCollection({ name, description, variables, selfContainedNote, items }) {
  return {
    info: {
      name,
      description: `${selfContainedNote}\n\n${description}`,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: variables,
    auth: {
      type: 'apikey',
      apikey: [
        { key: 'key', value: 'X-Api-Key', type: 'string' },
        { key: 'value', value: '{{api_key}}', type: 'string' },
        { key: 'in', value: 'header', type: 'string' },
      ],
    },
    item: items,
  };
}

const TEST_CONFIG_INTEGRADOR = [
  "const placeholders = ['PEGAR', 'SU_', 'nombre_tenant', '12345678-9', 'CAJA-01'];",
  "const vars = ['api_key', 'merchant_rut', 'sistema', 'terminal_code'];",
  "vars.forEach(k => {",
  "  const v = (pm.collectionVariables.get(k) || '').trim();",
  "  if (!v || v.includes('PEGAR') || v.includes('SU_API_KEY') || v === '12345678-9' || v === 'nombre_tenant' || v === 'CAJA-01') {",
  "    console.warn('⚠️ Configure la variable:', k, '(Edit → Variables de la colección)');",
  "  }",
  "});",
  "const code = pm.collectionVariables.get('terminal_code');",
  "const serial = pm.collectionVariables.get('terminal_serial');",
  "if ((!code || code === 'CAJA-01') && !serial) {",
  "  console.warn('⚠️ Indique terminal_code (real) o terminal_serial');",
  "}",
];

function prerequestExternalIdIntegrador() {
  return [
    "const sys = (pm.collectionVariables.get('sistema') || 'INT')",
    "  .toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'INT';",
    "const ext = sys + '-' + Date.now();",
    "pm.collectionVariables.set('external_id', ext);",
    "console.log('external_id:', ext);",
  ];
}

function buildItems({ integrador = false } = {}) {
  const extIdScript = integrador ? prerequestExternalIdIntegrador : (p) => prerequestExternalId(p);
  const preDemoTests = integrador
    ? [...TEST_CONFIG_INTEGRADOR, ...TEST_TERMINALS]
    : TEST_TERMINALS;

  const folders = [
    {
      name: '00 — Verificación',
      description: integrador
        ? 'Complete Variables de la colección (api_key, merchant_rut, sistema, terminal) antes de continuar.\nDTemite entrega: api_key + datos del comercio/terminal tras el onboarding.'
        : 'Confirma API key, merchant y que el POS está online antes de cobrar.',
      item: [
        postRequest(
          'Listar terminales del merchant',
          'GET',
          '{{hub_base_url}}/paymenthub/terminals?merchant_rut={{merchant_rut}}&limit=50',
          'Primera llamada: valida X-Api-Key y lista terminales enrolados.',
          undefined,
          preDemoTests,
        ),
        postRequest(
          'Listar terminales ONLINE',
          'GET',
          '{{hub_base_url}}/paymenthub/terminals?merchant_rut={{merchant_rut}}&status=online',
          'Debe devolver al menos 1 terminal antes de crear cobros.\nSi vacío: activar Cobros externos en D-PAY y esperar ~30 s.',
          undefined,
          preDemoTests,
        ),
        postRequest(
          'Listar por serial (alternativa)',
          'GET',
          '{{hub_base_url}}/paymenthub/terminals?merchant_rut={{merchant_rut}}&search={{terminal_serial}}',
          'Busca por serial hardware si no conoces el terminal_code.',
        ),
      ],
    },
    {
      name: '01 — Cobro simple SIN ticket adicional',
      description: 'Solo cobro en POS con tarjeta. No imprime ticket extra personalizado.\n`flow_type: payment_only` sin bloque `extra_print`.',
      item: [
        postRequest(
          'Crear cobro payment_only (sin ticket)',
          'POST',
          '{{hub_base_url}}/paymenthub/intents',
          'El POS muestra monto y descripción. Tras pagar, imprime según la configuración D-PAY (comprobante de pago del terminal).',
          rawIntent({ flow_type: 'payment_only' }, { description: 'Cobro simple sin ticket adicional' }),
          TEST_SAVE_INTENT,
          integrador ? prerequestExternalIdIntegrador() : prerequestExternalId('PAY'),
        ),
      ],
    },
    {
      name: '02 — Cobro simple CON ticket adicional',
      description: 'Cobro + ticket extra impreso por D-PAY después del pago (líneas adicional_1…10).\nRequiere `metadata.extra_print.enabled: true` y al menos `adicional_1`.',
      item: [
        postRequest(
          'Crear cobro payment_only + extra_print',
          'POST',
          '{{hub_base_url}}/paymenthub/intents',
          'Tras el pago: comprobante de pago → pausa → ticket extra con tus líneas.\n`system_name` lo agrega el servidor (razón social del comercio).',
          rawIntent({
            flow_type: 'payment_only',
            extra_print: {
              enabled: true,
              show_logo: true,
              adicional_1: 'Gracias por su compra',
              adicional_2: 'Válido por 30 días',
              adicional_3: 'Consultas: ventas@empresa.cl',
            },
          }, { description: 'Cobro con ticket adicional' }),
          TEST_SAVE_INTENT,
          integrador ? prerequestExternalIdIntegrador() : prerequestExternalId('PAY-TKT'),
        ),
      ],
    },
    {
      name: '03 — Cobro con documento SIN ticket adicional',
      description: 'El POS muestra líneas, cliente y tipo DTE. Emite documento electrónico al completar.\nSin ticket extra impreso.',
      item: [
        postRequest(
          'Crear cobro with_document (sin ticket)',
          'POST',
          '{{hub_base_url}}/paymenthub/intents',
          'document_type: 39 = Boleta electrónica. El total de líneas debe coincidir con amount.',
          rawIntent({
            flow_type: 'with_document',
            document_type: '39',
            customer_rut: '66666666-6',
            customer_name: 'PUBLICO GENERAL',
            document_reference: 'Pedido Postman',
            document_lines: [
              { description: 'Producto A', quantity: 2, unit_price: 10000, subtotal: 20000 },
              { description: 'Producto B', quantity: 1, unit_price: 5000, subtotal: 5000 },
            ],
          }, { amount: 25000, description: 'Venta con documento sin ticket extra' }),
          TEST_SAVE_INTENT,
          integrador ? prerequestExternalIdIntegrador() : prerequestExternalId('DOC'),
        ),
      ],
    },
    {
      name: '04 — Cobro con documento CON ticket adicional',
      description: 'Documento electrónico + ticket extra personalizado después del cobro.',
      item: [
        postRequest(
          'Crear cobro with_document + extra_print',
          'POST',
          '{{hub_base_url}}/paymenthub/intents',
          'Combina detalle de documento en pantalla del POS con impresión de ticket adicional al finalizar.',
          rawIntent({
            flow_type: 'with_document',
            document_type: '39',
            customer_rut: '66666666-6',
            customer_name: 'PUBLICO GENERAL',
            document_reference: 'Pedido #12345',
            document_lines: [
              { description: 'Producto A', quantity: 2, unit_price: 10000, subtotal: 20000 },
              { description: 'Producto B', quantity: 1, unit_price: 5000, subtotal: 5000 },
            ],
            extra_print: {
              enabled: true,
              show_logo: false,
              adicional_1: 'Pedido N° 12345',
              adicional_2: 'Entrega en 24 horas',
            },
          }, { amount: 25000, description: 'Documento + ticket adicional' }),
          TEST_SAVE_INTENT,
          integrador ? prerequestExternalIdIntegrador() : prerequestExternalId('DOC-TKT'),
        ),
      ],
    },
    {
      name: '05 — Seguimiento y cancelación',
      item: [
        postRequest(
          'Consultar intent por ID (poll)',
          'GET',
          '{{hub_base_url}}/paymenthub/intents/{{intent_id}}',
          'Repetir cada 3-5 s hasta status: succeeded | failed | cancelled | expired.',
          undefined,
          TEST_POLL,
        ),
        postRequest(
          'Consultar intent por external_id',
          'GET',
          '{{hub_base_url}}/paymenthub/intents?merchant_rut={{merchant_rut}}&external_id={{external_id}}',
          'Misma consulta usando la referencia de tu sistema.',
        ),
        postRequest(
          'Cancelar intent pendiente',
          'PUT',
          '{{hub_base_url}}/paymenthub/intents/{{intent_id}}/cancel',
          'Solo pending | claimed | processing. Usa el intent_id del último cobro creado.',
          '{}',
        ),
      ],
    },
    {
      name: '06 — Por serial (sin terminal_code)',
      item: [
        postRequest(
          'Crear cobro usando serial_number',
          'POST',
          '{{hub_base_url}}/paymenthub/intents',
          'Alternativa a terminal_code: envía serial_number del hardware del POS.',
          `{
  "merchant_rut": "{{merchant_rut}}",
  "sistema": "{{sistema}}",
  "amount": {{demo_amount}},
  "serial_number": "{{terminal_serial}}",
  "external_id": "{{external_id}}",
  "description": "Cobro por serial hardware",
  "metadata": { "flow_type": "payment_only" }
}`,
          TEST_SAVE_INTENT,
          integrador ? prerequestExternalIdIntegrador() : prerequestExternalId('SN'),
        ),
      ],
    },
    {
      name: '07 — Errores (referencia)',
      item: [
        postRequest(
          '[401] API key inválida',
          'GET',
          '{{hub_base_url}}/paymenthub/terminals?merchant_rut={{merchant_rut}}',
          'Demuestra respuesta cuando la clave es incorrecta.',
          undefined,
          undefined,
        ),
        postRequest(
          '[404] Terminal inexistente',
          'POST',
          '{{hub_base_url}}/paymenthub/intents',
          'terminal_code que no existe en el merchant.',
          rawIntent({ flow_type: 'payment_only' }).replace('"{{terminal_code}}"', '"TERMINAL-INEXISTENTE"'),
        ),
      ],
    },
  ];
  return folders;
}

const PERSONAL_VARS = [
  { key: 'hub_base_url', value: 'https://TU_ENTORNO_QA/api' },
  { key: 'api_key', value: 'PEGAR_SU_API_KEY' },
  { key: 'merchant_rut', value: '12345678-9' },
  { key: 'sistema', value: 'nombre_tenant' },
  { key: 'terminal_code', value: 'CAJA-01' },
  { key: 'terminal_serial', value: 'SERIAL_TERMINAL' },
  { key: 'demo_amount', value: '15990' },
  { key: 'external_id', value: '' },
  { key: 'intent_id', value: '' },
];

const dir = __dirname;

const SELF_CONTAINED = '**Importar solo este archivo** (sin environment).\nEditar variables: clic derecho en la colección → **Edit** → pestaña **Variables**.';

const personal = buildCollection({
  name: 'D-PAY Payment Hub — Personal Dev (Mauro)',
  selfContainedNote: SELF_CONTAINED,
  description: 'Colección personal con datos de prueba devdiego.',
  variables: PERSONAL_VARS,
  items: buildItems({ integrador: false }),
});

personal.item[7].item[0].request.header = [
  { key: 'X-Api-Key', value: 'dph_clave_invalida_ejemplo', type: 'text' },
];

fs.writeFileSync(
  path.join(dir, 'D-PAY-PaymentHub-Personal-Dev.postman_collection.json'),
  JSON.stringify(personal, null, 2),
);

console.log('Colección personal generada OK');

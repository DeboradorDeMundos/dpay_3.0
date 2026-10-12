import { formatCurrency } from '../utils/format';
import moment from 'moment';

interface InvoiceData {
  sale: {
    results: Array<{
      name: string;
      code: string;
      count: number;
      value: number;
      total: number;
    }>;
  };
  ted: string;
  information: {
    empresa: {
      razon: string;
      rut: string;
      giro: string;
      direccion: string;
      comuna: string;
      telefono: string;
      email: string;
    };
  };
  documentType: {
    id: number;
    name: string;
  };
  folio: number;
  purchaseDate: string;
  neto: number;
  exento: number;
  iva: number;
  total: number;
  propina?: number;
  cliente?: {
    rut: string;
    nombre: string;
  };
}

interface Settings {
  systemImage?: string;
  showLogo?: boolean;
  header1?: string;
  header2?: string;
  header3?: string;
  header4?: string;
  header5?: string;
  header6?: string;
  footer1?: string;
  footer2?: string;
  footer3?: string;
  footer4?: string;
  footer5?: string;
  footer6?: string;
  commentInvoice?: string;
}

/**
 * Calcula los totales de una venta (Neto, Exento, IVA, Total)
 */
export const calculateTotals = (results: Array<{ total: number; taxable?: boolean }>) => {
  const total = results.reduce((sum, item) => sum + item.total, 0);
  const exento = results
    .filter(item => item.taxable === false)
    .reduce((sum, item) => sum + item.total, 0);
  const neto = total - exento;
  const iva = Math.round(neto * 0.19);

  return {
    neto: neto - iva,
    exento,
    iva,
    total,
  };
};

/**
 * Genera el HTML para convertir a PDF
 */
export const generatePDF = (
  invoiceData: InvoiceData,
  settings: Settings,
  barcodeImage?: string
): string => {
  let items = '';

  // Generar filas de items
  invoiceData.sale.results.forEach((item) => {
    items += `
      <div style="display: flex; font-size:12px; padding-top:5px; padding-bottom: 5px; flex-direction: column;">
        <div style="width: 100%">${item.name}</div>
        <div style="width: 100%; display: flex;">
          <div style="width: 20%">${item.count}</div>
          <div style="width: 40%; text-align: right;">${formatCurrency(item.value)}</div>
          <div style="width: 40%; text-align: right;">${formatCurrency(item.total)}</div>
        </div>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documento Electrónico - ${invoiceData.documentType.name}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; display: flex; justify-content: center;">
          <div style="width: 60%; max-width: 600px;">
            <!-- Logo -->
            ${settings.systemImage ? `
              <div style="width: 100%; text-align: center; margin-bottom: 20px;">
                <img src="data:image/png;base64,${settings.systemImage}" width="300" style="max-width: 100%;">
              </div>
            ` : ''}
            
            <!-- Información Empresa -->
            <div style="text-align: center; font-weight: 700; border-bottom: 1px solid #000; padding-bottom: 20px;">
              <p style="margin: 5px 0; font-size: 16px;">${invoiceData.information.empresa.razon}</p>
              <p style="margin: 5px 0; font-size: 14px;">R.U.T.: ${invoiceData.information.empresa.rut}</p>
              <p style="margin: 5px 0; font-size: 14px;">${invoiceData.information.empresa.giro}</p>
            </div>
            
            <!-- Datos de Contacto -->
            <div style="margin-top: 20px; font-size: 13px;">
              <p style="margin: 5px 0;">DIRECCIÓN: ${invoiceData.information.empresa.direccion}, ${invoiceData.information.empresa.comuna}</p>
              <p style="margin: 5px 0;">FONO: +56${invoiceData.information.empresa.telefono}</p>
              <p style="margin: 5px 0;">EMAIL: ${invoiceData.information.empresa.email}</p>
              
              <!-- Tipo de Documento y Folio -->
              <div style="display: flex; margin-top: 15px;">
                <div style="width: 50%;">
                  <p style="margin: 0; font-weight: 700; font-size: 14px;">${invoiceData.documentType.name}</p>
                </div>
                <div style="width: 50%; text-align: right; font-weight: 700;">
                  <p style="margin: 0; font-size: 14px;">No: ${invoiceData.folio}</p>
                </div>
              </div>
            </div>
            
            <!-- Fecha -->
            <p style="margin: 10px 0; font-size: 13px;">
              Fecha Emisión: ${moment(invoiceData.purchaseDate, 'YYYY-MM-DDTHH:mm:ss').format('DD-MM-YYYY HH:mm')}
            </p>
            
            <!-- Headers Personalizables -->
            ${settings.header1 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.header1}</p>` : ''}
            ${settings.header2 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.header2}</p>` : ''}
            ${settings.header3 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.header3}</p>` : ''}
            ${settings.header4 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.header4}</p>` : ''}
            ${settings.header5 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.header5}</p>` : ''}
            ${settings.header6 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.header6}</p>` : ''}
            
            <!-- Tabla de Items -->
            <div style="margin-top: 20px; margin-bottom: 20px;">
              <!-- Header de Tabla -->
              <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; display: flex; font-size:12px; font-weight: 600; padding-top:5px; padding-bottom: 5px; flex-direction: column;">
                <div style="width: 100%">Descripción</div>
                <div style="width: 100%; display: flex;">
                  <div style="width: 20%">Cantidad</div>
                  <div style="width: 40%; text-align: right;">Precio</div>
                  <div style="width: 40%; text-align: right;">Monto Total</div>
                </div>
              </div>
              
              <!-- Items -->
              ${items}
              
              <!-- Totales -->
              <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding-bottom: 5px; font-size:12px; padding-top:5px;">
                <div style="width: 100%; display: flex; margin-top: 5px;">
                  <div style="width: 50%;"><strong>Monto Neto:</strong></div>
                  <div style="width: 50%; text-align: right;">${formatCurrency(invoiceData.neto)}</div>              
                </div>
                <div style="width: 100%; display: flex; margin-top: 5px;">
                  <div style="width: 50%;"><strong>Monto Exento:</strong></div>
                  <div style="width: 50%; text-align: right;">${formatCurrency(invoiceData.exento)}</div>              
                </div>
                <div style="width: 100%; display: flex; margin-top: 5px;">
                  <div style="width: 50%;"><strong>IVA (19%):</strong></div>
                  <div style="width: 50%; text-align: right;">${formatCurrency(invoiceData.iva)}</div>              
                </div>
                <div style="width: 100%; display: flex; margin-top: 5px;">
                  <div style="width: 50%;"><strong>Total:</strong></div>
                  <div style="width: 50%; text-align: right; font-size: 14px;">${formatCurrency(invoiceData.total)}</div>              
                </div>
                ${invoiceData.propina && invoiceData.propina > 0 ? `
                <div style="width: 100%; display: flex; margin-top: 5px;">
                  <div style="width: 50%;"><strong>Propina:</strong></div>
                  <div style="width: 50%; text-align: right;">${formatCurrency(invoiceData.propina)}</div>              
                </div>
                <div style="width: 100%; display: flex; margin-top: 5px;">
                  <div style="width: 50%;"><strong>A PAGAR:</strong></div>
                  <div style="width: 50%; text-align: right; font-size: 14px;">${formatCurrency(invoiceData.total + invoiceData.propina)}</div>              
                </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Footers Personalizables -->
            ${settings.footer1 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.footer1}</p>` : ''}
            ${settings.footer2 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.footer2}</p>` : ''}
            ${settings.footer3 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.footer3}</p>` : ''}
            ${settings.footer4 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.footer4}</p>` : ''}
            ${settings.footer5 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.footer5}</p>` : ''}
            ${settings.footer6 ? `<p style="margin: 5px 0; font-size: 12px;">${settings.footer6}</p>` : ''}
            
            <!-- Código de Barras TED -->
            ${barcodeImage ? `
              <div style="width: 100%; text-align: center; margin-top: 20px; margin-bottom: 20px;">
                <img src="data:image/png;base64,${barcodeImage}" style="width: 100%; max-width: 400px;">
              </div>
            ` : ''}
            
            <!-- Verificación SII -->
            <div style="text-align: center; font-size: 11px; margin-top: 20px;">
              <p style="margin: 5px 0;">
                Resolución 80 del 2014-08-22 - Verifique Documento 
                <a style="color: #0066cc;" href="https://www.sii.cl">https://www.sii.cl</a>
              </p>
            </div>
            
            <!-- Comentario Adicional -->
            ${settings.commentInvoice ? `
              <div style="text-align: center; margin-top: 20px; font-size: 12px;">
                <span>${settings.commentInvoice}</span>
              </div>
            ` : ''}
            
            <!-- Branding -->
            <div style="text-align: center; margin-top: 20px; font-size: 12px;">
              <a style="color: #5ec3c4; text-decoration: none;" href="https://www.dtemite.cl">www.dtemite.cl</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Genera el HTML con formato de recibo POS (boleta térmica) para convertir a PDF.
 * Replica la estructura y estilo del recibo que imprime la impresora térmica.
 */
export const generateBoletaPDF = (
  invoiceData: InvoiceData,
  settings: Settings,
  barcodeImage?: string
): string => {
  let items = '';

  // Generar filas de items (formato similar al ticket POS)
  invoiceData.sale.results.forEach((item) => {
    items += `
      <div style="padding: 3px 0;">
        <div>${item.name}</div>
        <div style="display: flex;">
          <div style="width: 25%;">${item.count}</div>
          <div style="width: 35%; text-align: right;">${formatCurrency(item.value)}</div>
          <div style="width: 40%; text-align: right;">${formatCurrency(item.total)}</div>
        </div>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boleta - ${invoiceData.folio}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 10px 10px 4px 10px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            line-height: 1.35;
            width: 80mm;
          }
          .receipt {
            width: 100%;
          }
          .separator {
            text-align: center;
            letter-spacing: 1px;
          }
          .center {
            text-align: center;
          }
          .bold {
            font-weight: 700;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <!-- Logo -->
          ${settings.systemImage ? `
            <div class="center" style="margin-bottom: 15px;">
              <img src="data:image/png;base64,${settings.systemImage}" width="180" style="max-width: 100%;">
            </div>
          ` : ''}
          
          <!-- Información Empresa -->
          <div class="center bold">
            <div>${invoiceData.information.empresa.razon}</div>
            <div>R.U.T.: ${invoiceData.information.empresa.rut}</div>
            <div>${invoiceData.information.empresa.giro}</div>
          </div>
          <div class="separator">--------------------------------</div>
          
          <!-- Datos de Contacto -->
          <div>
            <div>Direccion: ${invoiceData.information.empresa.direccion}, ${invoiceData.information.empresa.comuna}</div>
            ${invoiceData.information.empresa.telefono ? `<div>FONO: +56${invoiceData.information.empresa.telefono}</div>` : ''}
            ${invoiceData.information.empresa.email ? `<div>EMAIL: ${invoiceData.information.empresa.email}</div>` : ''}
          </div>
          
          <!-- Tipo de Documento y Folio -->
          <div class="separator" style="margin-top: 8px;">================================</div>
          <div class="center bold">
            <div>${invoiceData.documentType.name}</div>
            ${invoiceData.folio ? `<div>No. ${invoiceData.folio}</div>` : ''}
          </div>
          <div class="separator">================================</div>
          
          <!-- Fecha -->
          <div style="margin-top: 4px;">
            Fecha Emision: ${moment(invoiceData.purchaseDate, 'YYYY-MM-DDTHH:mm:ss').format('DD-MM-YYYY HH:mm')}
          </div>
          
          <!-- Datos del Cliente (si existe) -->
          ${invoiceData.cliente ? `
            <div class="separator">--------------------------------</div>
            <div>RECEPTOR:</div>
            <div>RUT: ${invoiceData.cliente.rut}</div>
            <div>Nombre: ${invoiceData.cliente.nombre}</div>
          ` : ''}
          
          <!-- Headers Personalizables -->
          ${settings.header1 ? `<div>${settings.header1}</div>` : ''}
          ${settings.header2 ? `<div>${settings.header2}</div>` : ''}
          ${settings.header3 ? `<div>${settings.header3}</div>` : ''}
          ${settings.header4 ? `<div>${settings.header4}</div>` : ''}
          ${settings.header5 ? `<div>${settings.header5}</div>` : ''}
          ${settings.header6 ? `<div>${settings.header6}</div>` : ''}
          
          <!-- Tabla de Items -->
          <div class="separator">--------------------------------</div>
          <div>Descripcion</div>
          <div style="display: flex;">
            <div style="width: 25%;">Cant</div>
            <div style="width: 35%; text-align: right;">Precio</div>
            <div style="width: 40%; text-align: right;">Total</div>
          </div>
          <div class="separator">--------------------------------</div>
          
          ${items}
          
          <!-- Totales -->
          <div class="separator">--------------------------------</div>
          <div class="totals-row">
            <span>Neto:</span>
            <span>${formatCurrency(invoiceData.neto)}</span>
          </div>
          <div class="totals-row">
            <span>Exento:</span>
            <span>${formatCurrency(invoiceData.exento)}</span>
          </div>
          <div class="totals-row">
            <span>IVA (19%):</span>
            <span>${formatCurrency(invoiceData.iva)}</span>
          </div>
          <div class="totals-row bold" style="font-size: 14px;">
            <span>Total:</span>
            <span>${formatCurrency(invoiceData.total)}</span>
          </div>
          ${invoiceData.propina && invoiceData.propina > 0 ? `
            <div class="totals-row">
              <span>Propina:</span>
              <span>${formatCurrency(invoiceData.propina)}</span>
            </div>
            <div class="totals-row bold" style="font-size: 14px;">
              <span>A PAGAR:</span>
              <span>${formatCurrency(invoiceData.total + invoiceData.propina)}</span>
            </div>
          ` : ''}
          
          <!-- Footers Personalizables -->
          ${settings.footer1 ? `<div>${settings.footer1}</div>` : ''}
          ${settings.footer2 ? `<div>${settings.footer2}</div>` : ''}
          ${settings.footer3 ? `<div>${settings.footer3}</div>` : ''}
          ${settings.footer4 ? `<div>${settings.footer4}</div>` : ''}
          ${settings.footer5 ? `<div>${settings.footer5}</div>` : ''}
          ${settings.footer6 ? `<div>${settings.footer6}</div>` : ''}
          
          <!-- Código de Barras TED (PDF417) - solo si está habilitado -->
          ${barcodeImage ? `
            <div class="center" style="margin-top: 15px;">
              <img src="data:image/png;base64,${barcodeImage}" style="width: 100%; max-width: 300px;">
            </div>
          ` : ''}
          
          <!-- Textos SII - siempre visibles cuando el documento tiene TED -->
          ${invoiceData.ted ? `
            <div class="center" style="margin-top: 6px; font-size: 11px;">
              <div>Timbre Electronico SII</div>
              <div>Res. 80 de 22.08.2014</div>
              <div>Verifique en www.dtemite.cl</div>
            </div>
          ` : ''}
          
        </div>
      </body>
    </html>
  `;
};

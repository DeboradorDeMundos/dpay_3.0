import { useCallback, useEffect, useState } from 'react';
import { BluetoothManager, BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';
import PDF417Generator from '../utils/PDF417Generator';
import { TED_PRINT_MAX_HEIGHT, TED_PRINT_WIDTH } from '../constants/tedPrint';
import { processImageForPrinting } from '../utils/ImageProcessor';
import { useSettingsStore } from '../stores/settingsStore';
import { usePrinterStore } from '../stores/printerStore';
import { formatCurrency, removeAccents, formatDate } from '../utils/format';
import type { CartItem } from '../stores/salesStore';

interface PrintData {
  empresa: {
    razon: string;
    rut: string;
    giro: string;
    direccion: string;
    comuna: string;
    telefono?: string;
    email?: string;
  };
  cliente?: {
    rut: string;
    nombre: string;
  };
  documentType: {
    name: string;
    id?: number; // ID del tipo de documento (61 para NC)
  };
  folio: number;
  purchaseDate: string;
  items: CartItem[];
  neto: number;
  exento: number;
  iva: number;
  total: number;
  propina?: number;
  ted?: string;
  // Información de referencia para Notas de Crédito
  referencia?: {
    tipoDocRef: number; // Tipo de documento referenciado (33, 39, etc.)
    nombreDocRef: string; // Nombre del documento referenciado
    folioRef: number; // Folio del documento referenciado
    fechaRef: string; // Fecha del documento referenciado
    razonRef: string; // Razón de la referencia ("Anula documento total", etc.)
    codigoRef: number; // Código de referencia (1=Anula, 2=Corrige, 3=Otro)
  };
}

export interface ExtraTicketData {
  showLogo: boolean;
  systemName: string;
  lines: string[];
}

interface PaymentVoucherData {
  empresa: {
    razon: string;
    rut: string;
    direccion: string;
    comuna: string;
  };
  tipoTarjeta: 'CREDITO' | 'DEBITO';
  sequenceNumber: string;
  monto: number;
  montoNeto: number;
  montoExento: number;
  iva: number;
  propina?: number;
  cuotas?: number;
  authCode?: string;
  last4?: string;
  fecha: string;
  estado: boolean;
}

export const usePrinter = () => {
  const { systemImage, header1, header2, header3, header4, footer1, footer2, footer3, footer4, additionalLines, printTED } = useSettingsStore();
  const { selectedPrinter, isConnected: printerConnected, setConnected } = usePrinterStore();
  const [isConnected, setIsConnected] = useState(false);

  // Sincronizar estado de conexión con el store
  useEffect(() => {
    setIsConnected(printerConnected);
  }, [printerConnected]);

  useEffect(() => {
    if (selectedPrinter?.address) {
      BluetoothManager.enableBluetooth()
        .then(() => {
          console.log('Bluetooth enabled');
          connectToPrinter();
        })
        .catch(() => console.log('Bluetooth not enabled'));
    }
  }, [selectedPrinter]);

  const connectToPrinter = useCallback(async (attempts = 0) => {
    if (!selectedPrinter?.address) return;
    if (attempts >= 3) {
      console.log('Max connection attempts reached');
      return;
    }

    try {
      await BluetoothManager.connect(selectedPrinter.address);
      console.log('Printer connected successfully');
      setIsConnected(true);
      setConnected(true);
    } catch (e) {
      console.log('Connection failed, attempt', attempts + 1, ':', e);
      setIsConnected(false);
      setConnected(false);

      if (attempts < 2) {
        setTimeout(() => connectToPrinter(attempts + 1), 500);
      }
    }
  }, [selectedPrinter, setConnected]);

  const printReceipt = async (data: PrintData) => {
    // Verificar conexión y reconectar si es necesario
    if (!isConnected && selectedPrinter?.address) {
      try {
        await BluetoothManager.connect(selectedPrinter.address);
        setIsConnected(true);
        setConnected(true);
      } catch (e) {
        throw new Error('Impresora no conectada. Por favor, verifica la conexión Bluetooth.');
      }
    }

    const config = {
      encoding: 'CP850',
      codepage: 2,
      widthtimes: 0,
      heigthtimes: 0,
      fonttype: 0,
    };

    try {
      // Inicializar impresora (reset posición)
      await BluetoothEscposPrinter.printerInit();

      // === SECCIÓN 1: LOGO DE LA EMPRESA ===
      if (systemImage) {
        try {
          console.log('[usePrinter] Procesando logo para impresión...');
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
          // Procesar imagen para remover transparencia y convertir a fondo blanco
          const processedImage = await processImageForPrinting(systemImage, 180);
          console.log('[usePrinter] Logo procesado, imprimiendo...', processedImage?.length || 0);
          // Usar printPicNoCut para NO cortar el papel después del logo
          await BluetoothEscposPrinter.printPicNoCut(processedImage, { width: 180, left: 102 });
          // Esperar a que la impresora procese la imagen antes de continuar
          await new Promise(resolve => setTimeout(resolve, 300));
          console.log('[usePrinter] Logo impreso correctamente');
        } catch (logoError) {
          console.log('[usePrinter] Aviso: No se pudo imprimir el logo (error ignorado para demo):', logoError);
          // Continuar sin logo si hay error
        }
      } else {
        console.log('[usePrinter] No hay logo configurado');
      }

      // === SECCIÓN 2: INFORMACIÓN DE LA EMPRESA ===
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.setBlob(1);
      await BluetoothEscposPrinter.printText(removeAccents(data.empresa.razon), config);
      await BluetoothEscposPrinter.printText('\n', config);
      await BluetoothEscposPrinter.printText('R.U.T.: ' + data.empresa.rut, config);
      await BluetoothEscposPrinter.printText('\n', config);
      await BluetoothEscposPrinter.printText(removeAccents(data.empresa.giro), config);
      await BluetoothEscposPrinter.printText('\n', config);
      await BluetoothEscposPrinter.setBlob(0);
      await BluetoothEscposPrinter.printText('--------------------------------\n', config);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(
        `Dirección: ${removeAccents(data.empresa.direccion)}, ${removeAccents(data.empresa.comuna)}`,
        config
      );
      await BluetoothEscposPrinter.printText('\n', config);

      if (data.empresa.telefono) {
        await BluetoothEscposPrinter.printText('FONO: +56' + data.empresa.telefono, config);
        await BluetoothEscposPrinter.printText('\n', config);
      }

      if (data.empresa.email) {
        await BluetoothEscposPrinter.printText('EMAIL: ' + data.empresa.email, config);
        await BluetoothEscposPrinter.printText('\n', config);
      }

      // === SECCIÓN 3: TIPO DE DOCUMENTO Y FOLIO ===
      await BluetoothEscposPrinter.printText('\n', config);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('================================\n', config);
      await BluetoothEscposPrinter.printText(removeAccents(data.documentType.name), config);
      await BluetoothEscposPrinter.printText('\n', config);
      if (data.folio) {
        await BluetoothEscposPrinter.printText('No. ' + data.folio, config);
        await BluetoothEscposPrinter.printText('\n', config);
      }
      await BluetoothEscposPrinter.printText('================================\n', config);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);

      await BluetoothEscposPrinter.printText(
        'Fecha Emisión: ' + formatDate(data.purchaseDate),
        config
      );
      await BluetoothEscposPrinter.printText('\n', config);

      // === SECCIÓN 4: DATOS DEL RECEPTOR (CLIENTE) ===
      if (data.cliente) {
        await BluetoothEscposPrinter.printText('--------------------------------\n', config);
        await BluetoothEscposPrinter.printText('RECEPTOR:\n', config);
        await BluetoothEscposPrinter.printText('RUT: ' + data.cliente.rut + '\n', config);
        await BluetoothEscposPrinter.printText('Nombre: ' + removeAccents(data.cliente.nombre) + '\n', config);
      }

      // === SECCIÓN 4.5: REFERENCIAS (Para Notas de Crédito) ===
      if (data.referencia) {
        await BluetoothEscposPrinter.printText('--------------------------------\n', config);
        await BluetoothEscposPrinter.setBlob(1);
        await BluetoothEscposPrinter.printText('REFERENCIAS:\n', config);
        await BluetoothEscposPrinter.setBlob(0);
        await BluetoothEscposPrinter.printText('Tipo Doc.: ' + removeAccents(data.referencia.nombreDocRef) + '\n', config);
        await BluetoothEscposPrinter.printText('Folio Ref.: ' + data.referencia.folioRef + '\n', config);
        await BluetoothEscposPrinter.printText('Fecha Ref.: ' + formatDate(data.referencia.fechaRef) + '\n', config);
        await BluetoothEscposPrinter.printText('Razon: ' + removeAccents(data.referencia.razonRef) + '\n', config);
        
        // Código de referencia (texto descriptivo)
        const codigoRefTexto = data.referencia.codigoRef === 1 
          ? 'ANULA DOCUMENTO' 
          : data.referencia.codigoRef === 2 
          ? 'CORRIGE MONTO' 
          : 'OTRO';
        await BluetoothEscposPrinter.setBlob(1);
        await BluetoothEscposPrinter.printText(codigoRefTexto + '\n', config);
        await BluetoothEscposPrinter.setBlob(0);
      }

      // Headers personalizados
      if (header1) await BluetoothEscposPrinter.printText(removeAccents(header1) + '\n', config);
      if (header2) await BluetoothEscposPrinter.printText(removeAccents(header2) + '\n', config);
      if (header3) await BluetoothEscposPrinter.printText(removeAccents(header3) + '\n', config);
      if (header4) await BluetoothEscposPrinter.printText(removeAccents(header4) + '\n', config);

      // === SECCIÓN 5: DETALLE DE PRODUCTOS ===
      await BluetoothEscposPrinter.printText('--------------------------------\n', config);
      const columnWidths = [9, 9, 14];
      await BluetoothEscposPrinter.printText('Descripción\n', config);
      await BluetoothEscposPrinter.printColumn(
        columnWidths,
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Cant', 'Precio', 'Total'],
        config
      );
      await BluetoothEscposPrinter.printText('--------------------------------\n', config);

      for (const item of data.items) {
        await BluetoothEscposPrinter.printText(removeAccents(item.name) + '\n', config);
        await BluetoothEscposPrinter.printColumn(
          columnWidths,
          [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
          [item.count.toString(), formatCurrency(item.value), formatCurrency(item.total)],
          config
        );
      }

      // === SECCIÓN 6: TOTALES ===
      await BluetoothEscposPrinter.printText('--------------------------------\n', config);
      // Usar columnas para alinear títulos a la izquierda y montos a la derecha
      const totalColumnWidths = [16, 16];
      const totalAligns = [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT];

      await BluetoothEscposPrinter.printColumn(totalColumnWidths, totalAligns, ['Neto:', formatCurrency(data.neto)], config);
      await BluetoothEscposPrinter.printColumn(totalColumnWidths, totalAligns, ['Exento:', formatCurrency(data.exento)], config);
      await BluetoothEscposPrinter.printColumn(totalColumnWidths, totalAligns, ['IVA (19%):', formatCurrency(data.iva)], config);
      await BluetoothEscposPrinter.setBlob(1);
      await BluetoothEscposPrinter.printColumn(totalColumnWidths, totalAligns, ['Total:', formatCurrency(data.total)], config);
      await BluetoothEscposPrinter.setBlob(0);

      if (data.propina && data.propina > 0) {
        await BluetoothEscposPrinter.printColumn(totalColumnWidths, totalAligns, ['Propina:', formatCurrency(data.propina)], config);
        await BluetoothEscposPrinter.setBlob(1);
        await BluetoothEscposPrinter.printColumn(totalColumnWidths, totalAligns, ['A PAGAR:', formatCurrency(data.total + data.propina)], config);
        await BluetoothEscposPrinter.setBlob(0);
      }

      await BluetoothEscposPrinter.printText('\n', config);

      // Footers personalizados
      if (footer1) await BluetoothEscposPrinter.printText(removeAccents(footer1) + '\n', config);
      if (footer2) await BluetoothEscposPrinter.printText(removeAccents(footer2) + '\n', config);
      if (footer3) await BluetoothEscposPrinter.printText(removeAccents(footer3) + '\n', config);
      if (footer4) await BluetoothEscposPrinter.printText(removeAccents(footer4) + '\n', config);

      // === SECCIÓN 7: TIMBRE ELECTRÓNICO SII (PDF417) ===
      if (data.ted && data.ted.length > 0) {
        console.log(`[TED] printTED=${printTED} tedLength=${data.ted.length}`);
        await BluetoothEscposPrinter.printText('\n', config);
        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);

        if (printTED) {
          try {
            // Espaciado mínimo entre líneas mientras se imprime el raster (evita franjas en TED)
            await BluetoothEscposPrinter.printerLineSpace(0);
            console.log(`[TED] Generando PDF417 (${TED_PRINT_WIDTH}x${TED_PRINT_MAX_HEIGHT} max)...`);
            const pdf417Base64 = await PDF417Generator.generate(
              data.ted,
              TED_PRINT_WIDTH,
              TED_PRINT_MAX_HEIGHT,
            );
            await BluetoothEscposPrinter.printPicNoCut(pdf417Base64, {
              width: TED_PRINT_WIDTH,
              left: 0,
            });
            await BluetoothEscposPrinter.printerLineSpace(24);
            await new Promise(resolve => setTimeout(resolve, 600));
            console.log('[TED] PDF417 impreso');
          } catch (tedError) {
            console.error('[TED] Error en barcode PDF417 (continuando con textos SII):', tedError);
            try {
              await BluetoothEscposPrinter.printText('(Error generando timbre)\n', config);
            } catch {
              // no relanzar — el recibo debe completarse
            }
          }
        }

        try {
          await BluetoothEscposPrinter.printText('\n', config);
          await BluetoothEscposPrinter.printText('Timbre Electrónico SII\n', config);
          await BluetoothEscposPrinter.printText('Res. 80 de 22.08.2014\n', config);
          await BluetoothEscposPrinter.printText('Verifique en www.dtemite.cl\n', config);
        } catch (siiTextError) {
          console.error('[TED] Error imprimiendo textos SII:', siiTextError);
        }
      } else {
        console.log('[TED] Sin TED disponible (documento no sincronizado) - omitiendo sección timbre');
      }


      // Líneas adicionales antes de cortar
      const linesToAdd = additionalLines ? parseInt(additionalLines, 10) : 6;
      const lines = '\n'.repeat(linesToAdd);
      await BluetoothEscposPrinter.printText(lines, config);

      console.log('Print successful');
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  };

  const printPaymentVoucher = async (data: PaymentVoucherData) => {
    if (!isConnected && selectedPrinter?.address) {
      try {
        await BluetoothManager.connect(selectedPrinter.address);
        setIsConnected(true);
        setConnected(true);
      } catch (e) {
        throw new Error('Impresora no conectada. Por favor, verifica la conexión Bluetooth.');
      }
    }

    const config = {
      encoding: 'CP850',
      codepage: 2,
      widthtimes: 0,
      heigthtimes: 0,
      fonttype: 0,
    };

    try {
      // Inicializar impresora (reset posición)
      await BluetoothEscposPrinter.printerInit();

      // === LOGO DE LA EMPRESA ===
      if (systemImage) {
        try {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
          const processedImage = await processImageForPrinting(systemImage, 180);
          await BluetoothEscposPrinter.printPicNoCut(processedImage, { width: 180, left: 102 });
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (logoError) {
          console.log('[Voucher] Aviso: Error imprimiendo logo (ignorado):', logoError);
        }
      }

      // === INFORMACIÓN DE LA EMPRESA ===
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.setBlob(1);
      await BluetoothEscposPrinter.printText(removeAccents(data.empresa.razon), config);
      await BluetoothEscposPrinter.printText('\n', config);
      await BluetoothEscposPrinter.printText('R.U.T.: ' + data.empresa.rut, config);
      await BluetoothEscposPrinter.printText('\n', config);
      await BluetoothEscposPrinter.setBlob(0);
      await BluetoothEscposPrinter.printText('--------------------------------\n', config);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(
        `${removeAccents(data.empresa.direccion)}, ${removeAccents(data.empresa.comuna)}`,
        config
      );
      await BluetoothEscposPrinter.printText('\n', config);

      // === TÍTULO COMPROBANTE ===
      await BluetoothEscposPrinter.printText('\n', config);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('================================\n', config);
      await BluetoothEscposPrinter.setBlob(1);
      await BluetoothEscposPrinter.printText('COMPROBANTE DE PAGO\n', config);
      await BluetoothEscposPrinter.printText('TARJETA ' + data.tipoTarjeta + '\n', config);
      await BluetoothEscposPrinter.setBlob(0);
      await BluetoothEscposPrinter.printText('================================\n', config);

      // === DETALLES DEL PAGO ===
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      const columnWidths = [16, 16];
      const aligns = [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT];

      await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['N Transaccion:', data.sequenceNumber], config);
      await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['Fecha:', formatDate(data.fecha, 'DD/MM/YYYY')], config);
      await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['Hora:', formatDate(data.fecha, 'HH:mm')], config);
      
      if (data.authCode) {
        await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['Cod. Autorizac.:', data.authCode], config);
      }
      
      if (data.last4) {
        await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['Tarjeta:', '****' + data.last4], config);
      }
      
      if (data.cuotas && data.cuotas > 1) {
        await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['Cuotas:', data.cuotas.toString()], config);
      }
      
      await BluetoothEscposPrinter.printText('--------------------------------\n', config);

      await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['Monto Neto:', formatCurrency(data.montoNeto)], config);

      if (data.montoExento > 0) {
        await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['Monto Exento:', formatCurrency(data.montoExento)], config);
      }
      
      await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['IVA (19%):', formatCurrency(data.iva)], config);

      await BluetoothEscposPrinter.printText('--------------------------------\n', config);
      await BluetoothEscposPrinter.setBlob(1);
      await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['Total:', formatCurrency(data.monto)], config);
      await BluetoothEscposPrinter.setBlob(0);

      if (data.propina && data.propina > 0) {
        await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['Propina:', formatCurrency(data.propina)], config);
        await BluetoothEscposPrinter.printText('--------------------------------\n', config);
        await BluetoothEscposPrinter.setBlob(1);
        await BluetoothEscposPrinter.printColumn(columnWidths, aligns, ['A PAGAR:', formatCurrency(data.monto + data.propina)], config);
        await BluetoothEscposPrinter.setBlob(0);
      }

      await BluetoothEscposPrinter.printText('\n', config);
      
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('Estado: ', config);
      await BluetoothEscposPrinter.setBlob(1);
      await BluetoothEscposPrinter.printText(data.estado ? 'APROBADO' : 'RECHAZADO', config);
      await BluetoothEscposPrinter.setBlob(0);
      await BluetoothEscposPrinter.printText('\n', config);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);

      // === WEB DEL COMERCIO ===
      await BluetoothEscposPrinter.printText('\n', config);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('www.dtemite.cl\n', config);

      // === LÍNEAS FINALES ===
      const linesToAdd = additionalLines ? parseInt(additionalLines, 10) : 6;
      const lines = '\n'.repeat(linesToAdd);
      await BluetoothEscposPrinter.printText(lines, config);

      console.log('[Voucher] Impresión exitosa');
    } catch (error) {
      console.error('[Voucher] Error:', error);
      throw error;
    }
  };

  const printExtraTicket = async (data: ExtraTicketData) => {
    if (!isConnected && selectedPrinter?.address) {
      try {
        await BluetoothManager.connect(selectedPrinter.address);
        setIsConnected(true);
        setConnected(true);
      } catch {
        throw new Error('Impresora no conectada. Por favor, verifica la conexión Bluetooth.');
      }
    }

    const config = {
      encoding: 'CP850',
      codepage: 2,
      widthtimes: 0,
      heigthtimes: 0,
      fonttype: 0,
    };

    try {
      await BluetoothEscposPrinter.printerInit();

      // Logo (controlado por el intent, no por ajuste global)
      if (data.showLogo && systemImage) {
        try {
          await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
          const processedImage = await processImageForPrinting(systemImage, 180);
          await BluetoothEscposPrinter.printPicNoCut(processedImage, { width: 180, left: 102 });
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (logoError) {
          console.log('[ExtraTicket] Logo ignorado:', logoError);
        }
      }

      // Nombre del comercio (system_name del intent)
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      if (data.systemName) {
        await BluetoothEscposPrinter.setBlob(1);
        await BluetoothEscposPrinter.printText(removeAccents(data.systemName) + '\n', config);
        await BluetoothEscposPrinter.setBlob(0);
      }
      await BluetoothEscposPrinter.printText('--------------------------------\n', config);

      // Líneas del ticket
      for (const line of data.lines) {
        await BluetoothEscposPrinter.printText(removeAccents(line) + '\n', config);
      }

      // Líneas de avance para cortar
      const linesToAdd = additionalLines ? parseInt(additionalLines, 10) : 6;
      await BluetoothEscposPrinter.printText('\n'.repeat(linesToAdd), config);

      console.log('[ExtraTicket] Impresión exitosa');
    } catch (error) {
      console.error('[ExtraTicket] Error:', error);
      throw error;
    }
  };

  return {
    isConnected,
    connectToPrinter,
    printReceipt,
    printPaymentVoucher,
    printExtraTicket,
  };
};

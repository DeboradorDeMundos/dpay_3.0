import { useState } from 'react';
import { Platform, Linking } from 'react-native';
import Share from 'react-native-share';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFetchBlob from 'rn-fetch-blob';
import { generatePDF } from '../services/pdf';
import { useAlertStore } from '../stores/alertStore';

const DownloadDir = RNFetchBlob.fs.dirs.DownloadDir;

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
}

interface Settings {
  systemImage?: string;
  showLogo?: boolean;
  header1?: string;
  header2?: string;
  header3?: string;
  header4?: string;
  footer1?: string;
  footer2?: string;
  footer3?: string;
  footer4?: string;
  commentInvoice?: string;
}

type ShareType = 'whatsapp' | 'email';

/**
 * Hook para compartir documentos por WhatsApp o Email
 * Genera un PDF del documento y lo comparte mediante la app seleccionada
 */
export const useShare = (invoiceData: InvoiceData, settings: Settings, barcodeImage?: string) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const showAlert = useAlertStore((state) => state.showAlert);

  /**
   * Valida el número de teléfono (debe tener 9 dígitos)
   */
  const validatePhone = (phone: string): boolean => {
    return /^\d{9}$/.test(phone);
  };

  /**
   * Valida el formato del email
   */
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  /**
   * Genera el PDF del documento
   */
  const generatePDFFile = async (): Promise<{ base64: string; filePath?: string } | null> => {
    try {
      const fileName = `documento_${invoiceData.folio}_${Date.now()}`;
      const html = generatePDF(invoiceData, settings, barcodeImage);

      console.log('Iniciando generación de PDF...');

      // Configuración para generar el PDF
      const options = {
        html: html,
        fileName: fileName,
        directory: Platform.OS === 'android' ? 'Downloads' : 'Documents',
        base64: true,
      };

      console.log('Opciones PDF:', options.fileName);

      const file = await RNHTMLtoPDF.convert(options);

      console.log('PDF generado:', file);

      if (!file || !file.filePath) {
        throw new Error('Error al generar el PDF');
      }

      // Leer el archivo como base64 si no viene en la respuesta
      let base64 = file.base64;
      if (!base64) {
        console.log('Leyendo base64 desde archivo...');
        base64 = await RNFetchBlob.fs.readFile(file.filePath, 'base64');
      }

      console.log('PDF listo, base64 length:', base64?.length || 0);

      return { base64, filePath: file.filePath };
    } catch (error) {
      console.error('Error generando PDF:', error);
      showAlert('Error', 'No se pudo generar el documento');
      return null;
    }
  };

  /**
   * Comparte el documento por WhatsApp o Email
   */
  const onShare = async (shareType: ShareType) => {
    // Validaciones
    if (shareType === 'whatsapp') {
      if (!phone) {
        showAlert('Atención', 'Debe ingresar el número telefónico');
        return;
      }
      if (!validatePhone(phone)) {
        showAlert('Atención', 'El número telefónico debe tener 9 dígitos');
        return;
      }
    } else if (shareType === 'email') {
      if (!email) {
        showAlert('Atención', 'Debe ingresar el correo electrónico');
        return;
      }
      if (!validateEmail(email)) {
        showAlert('Atención', 'El formato del correo electrónico no es válido');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Generar PDF
      const pdfFile = await generatePDFFile();
      
      if (!pdfFile) {
        setIsLoading(false);
        return;
      }

      // Compartir según el tipo
      if (shareType === 'whatsapp') {
        await shareViaWhatsApp(pdfFile.base64);
      } else {
        await shareViaEmail(pdfFile.base64);
      }
    } catch (error: any) {
      console.error('Error compartiendo documento:', error);
      
      // Verificar si el usuario canceló la acción
      if (error?.message?.includes('User did not share')) {
        showAlert('Información', 'La acción "Compartir" se ha cancelado');
      } else {
        showAlert('Error', 'No se pudo compartir el documento');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Comparte vía WhatsApp
   */
  const shareViaWhatsApp = async (base64: string) => {
    const message = `Documento Electrónico - ${invoiceData.documentType.name} N° ${invoiceData.folio}`;
    const whatsappNumber = `56${phone}`;
    const fileName = `documento_${invoiceData.folio}.pdf`;

    if (Platform.OS === 'android') {
      // En Android (POS), guardar el PDF primero
      const pdfPath = `${DownloadDir}/${fileName}`;
      await RNFetchBlob.fs.writeFile(pdfPath, base64, 'base64');
      
      // Abrir WhatsApp con el contacto y el mensaje
      // El usuario deberá adjuntar manualmente el PDF desde la galería/archivos
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}&phone=${whatsappNumber}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        // Mostrar alerta indicando dónde está el PDF
        showAlert(
          'PDF Guardado',
          `El documento se guardó en:\nDescargas/${fileName}.pdf\n\nPuedes adjuntarlo desde WhatsApp usando el botón de adjuntar (+)`,
          [{text: 'Entendido'}]
        );
      } else {
        throw new Error('WhatsApp no está instalado');
      }
    } else {
      // En iOS, usar shareSingle con WhatsApp
      const shareOptions = {
        url: `data:application/pdf;base64,${base64}`,
        social: 'whatsapp',
        whatsAppNumber: whatsappNumber,
        message: message,
        filename: fileName,
      };

      await Share.shareSingle(shareOptions);
    }
  };

  /**
   * Comparte vía Email
   */
  const shareViaEmail = async (base64: string) => {
    const fileName = `documento_${invoiceData.folio}.pdf`;
    
    if (Platform.OS === 'android') {
      // Guardar el archivo
      const pdfPath = `${DownloadDir}/${fileName}`;
      await RNFetchBlob.fs.writeFile(pdfPath, base64, 'base64');
    }
    
    const shareOptions = {
      url: `data:application/pdf;base64,${base64}`,
      social: 'email', // En versión 10+ es un string
      recipient: email,
      subject: `Documento Electrónico - ${invoiceData.documentType.name} N° ${invoiceData.folio}`,
      message: `Adjunto encontrará el documento electrónico solicitado.\n\n${invoiceData.information.empresa.razon}\nRUT: ${invoiceData.information.empresa.rut}`,
      filename: fileName,
    };

    await Share.shareSingle(shareOptions);
  };

  return {
    phone,
    setPhone,
    email,
    setEmail,
    isLoading,
    onShare,
    validatePhone,
    validateEmail,
  };
};

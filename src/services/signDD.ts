/**
 * Servicio de firma digital para documentos tributarios electrónicos
 * Utiliza jsrsasign para firmar el DD (Documento de Datos) con RSA
 */

import { decode as atob } from 'base-64';
import { KJUR, hextob64 } from 'jsrsasign';

/**
 * Firma digitalmente un DD (Documento de Datos) XML
 * Utiliza RSA con SHA1 para la firma (estándar SII Chile)
 * 
 * @param dd - String del DD (Documento de Datos) en formato XML
 * @param rsask - Private Key en formato Base64 (del CAF)
 * @returns Firma digital en formato Base64
 */
export const signDDXML = (dd: string, rsask: string): string => {
  try {
    // Decodificar la private key desde Base64
    const privateKeyPEM = atob(rsask);
    
    // Usar KJUR.crypto.Signature para firmar con SHA1withRSA
    const sig = new KJUR.crypto.Signature({ alg: 'SHA1withRSA' });
    sig.init(privateKeyPEM);
    sig.updateString(dd);
    const signatureHex = sig.sign();
    
    // Convertir la firma de hex a base64
    return hextob64(signatureHex);
  } catch (error) {
    console.error('Error al firmar DD:', error);
    throw new Error(`Error en firma digital: ${error}`);
  }
};

/**
 * Verifica una firma digital RSA
 * 
 * @param dd - String del DD original
 * @param signature - Firma en Base64
 * @param publicKey - Public Key en formato PEM
 * @returns true si la firma es válida
 */
export const verifySignature = (
  dd: string,
  signature: string,
  publicKey: string
): boolean => {
  try {
    const sig = new KJUR.crypto.Signature({ alg: 'SHA1withRSA' });
    sig.init(publicKey);
    sig.updateString(dd);
    return sig.verify(signature);
  } catch (error) {
    console.error('Error al verificar firma:', error);
    return false;
  }
};

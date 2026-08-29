import { apiClient, getAuthToken, API_BASE_URL } from './apiClient';
import type { CartItem, DocumentType } from '../stores/salesStore';
import type { Client, Sale, SaleItem } from '../types/common';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency } from '../utils/format';
import moment from 'moment';

/**
 * Genera un UUID v4 compatible con React Native / Hermes
 * (crypto.randomUUID() no está disponible en el engine Hermes)
 */
const generateUUID = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

interface LoginCredentials {
  rut: string;
  usuario: string;
  password: string;
}

interface LoginResponse {
  token: string;
  usuario: string;
  nombre: string;
  sistema?: string;
  permite_nota_credito?: boolean;
  empresa?: {
    rut: string;
    razon: string;
    giro: string;
    direccion: string;
    comuna: string;
    provincia: string;
  };
}

export interface CAFData {
  id_ctrl_folio: number;
  id_td: number; // Tipo de documento (33, 39, 41, etc.)
  nom_archivocaf: string; // XML del CAF en base64
  rsask: string; // Llave privada RSA para firmar
  rango_desde: number; // Folio inicial
  rango_hasta: number; // Folio final
  activo: boolean; // Si está activo para uso
}

interface DocumentPayload {
  Sistema: {
    nombre: string;
    rut: string;
    usuario: string;
    clave: string;
  };
  Documento: {
    Encabezado: {
      IdDoc: {
        TipoDTE: string;
        Folio: string;
        FchEmis: string;
        FchVenc: string;
      };
      Emisor: {
        RUTEmisor: string;
        RznSocEmisor: string;
        GiroEmisor: string;
        DirOrigen: string;
        CmnaOrigen: string;
        CiudadOrigen: string;
      };
      Receptor: {
        RUTRecep: string;
        RznSocRecep: string;
        CorreoRecep?: string;
        DirRecep?: string;
        CmnaRecep?: string;
        CiudadRecep?: string;
      };
      Totales: {
        MntNeto: string;
        MntExe: string;
        TasaIVA: string;
        IVA: string;
        MntTotal: string;
      };
    };
    Detalle: Array<{
      NroLinDet: string;
      CdgItem: {
        TpoCodigo: string;
        VlrCodigo: string;
      };
      NmbItem: string;
      QtyItem: string;
      PrcItem: string;
      MontoItem: string;
    }>;
  };
}

export const apiLogin = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await apiClient('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    requiresAuth: false,
  });
  return response.json();
};

// API devuelve productos con campos en español: codigo, nombre, precio, descripcion, stock
export const getProductCatalogue = async (): Promise<any[]> => {
  const response = await apiClient('/producto', {
    method: 'GET',
  });
  return response.json();
};

/** Busca producto(s) por cod_producto (fallback si no está en catálogo local). */
export const searchProductByCode = async (codigo: string): Promise<any[]> => {
  const encoded = encodeURIComponent(codigo.trim());
  const response = await apiClient(`/producto/buscar/${encoded}`, {
    method: 'GET',
  });
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};


export interface AdvancedConfig {
  crea_productos?: boolean | string;
  id_moneda_predeterminada?: number;
  id_moneda?: number;
  moneda_predeterminada?: string;
}

export const getAdvancedConfig = async (): Promise<AdvancedConfig> => {
  const response = await apiClient('/configuraciones/avanzada', {
    method: 'GET',
  });
  return response.json();
};

export interface CreateQuickProductData {
  codigo: string;
  nombre: string;
  descripcion: string;
  precio: number;
  id_moneda?: number;
}

export const createQuickProduct = async (data: CreateQuickProductData): Promise<any> => {
  const response = await apiClient('/producto/rapido', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (result?.code >= 400) {
    throw new Error(result.mensaje || 'Error al crear producto');
  }
  return result?.data ?? result;
};

export const getClients = async (): Promise<Client[]> => {
  const response = await apiClient('/cliente', {
    method: 'GET',
  });
  const rawClients = await response.json();
  
  console.log('[API] Clientes raw del backend (primero):', rawClients[0]);

  // Mapear campos de la BD (direccion, razon, etc.) a los campos del tipo Client
  const mappedClients = rawClients.map((client: any) => ({
    id: client.id || client.id_cliente || `client-${Date.now()}`,
    rut: client.rut || client.rut_entidad || '',
    name: client.name || client.razon || client.razon_social || client.nombre || '',
    email: client.email || client.correo || '',
    phone: client.phone || client.telefono || '',
    address: client.address || client.direccion || '',
    comuna: client.comuna || '',
    ciudad: client.ciudad || '',
    giro: client.giro || '',
    id_region: client.id_region ? Number(client.id_region) : undefined,
    id_provincia: client.id_provincia ? Number(client.id_provincia) : undefined,
    id_comuna: client.id_comuna ? Number(client.id_comuna) : undefined,
    internalCode: client.internalCode || client.codigo_interno || '',
    isActive: client.isActive ?? client.activo ?? true,
    createdAt: client.createdAt || new Date().toISOString(),
    updatedAt: client.updatedAt || new Date().toISOString(),
  }));
  
  console.log('[API] Cliente mapeado (primero):', mappedClients[0]);
  
  return mappedClients;
};

export interface CreateClientData {
  rut: string;
  razon: string;
  giro?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  // Campos INTEGER que deben ser null explícitamente
  id_comuna?: number | null;
  id_provincia?: number | null;
  id_region?: number | null;
  id_clasificacion?: number | null;
  id_vendedor?: number | null;
  id_pais_receptor?: number | null;
  id_cuenta?: number | null;
  id_cuenta_pro?: number | null;
  rut_empresa: string; // RUT de la empresa autenticada
}

export const createClient = async (clientData: CreateClientData): Promise<any> => {
  const response = await apiClient('/dpay/cliente', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
  
  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.mensaje || 'Error al crear cliente');
  }
  
  return result;
};

export interface UpdateClientData {
  rut?: string;
  razon?: string;
  giro?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  id_comuna?: number | null;
  id_provincia?: number | null;
  id_region?: number | null;
  id_clasificacion?: number | null;
  id_vendedor?: number | null;
  id_pais_receptor?: number | null;
  id_cuenta?: number | null;
  id_cuenta_pro?: number | null;
  rut_empresa: string; // RUT de la empresa autenticada (requerido)
}

export const getClientById = async (clientId: string, rutEmpresa: string): Promise<Client> => {
  const response = await apiClient(`/dpay/cliente/${rutEmpresa}/${clientId}`, {
    method: 'GET',
  });
  
  const data = await response.json();
  console.log('[API] Cliente individual recibido:', data);
  
  if (data.error) {
    throw new Error(data.mensaje || 'Error al obtener cliente');
  }
  
  // Mapear campos al tipo Client
  return {
    id: data.id || data.id_cliente,
    rut: data.rut || data.rut_entidad || '',
    name: data.razon || data.razon_social || data.name || '',
    email: data.email || '',
    phone: data.telefono || data.phone || '',
    address: data.direccion || data.address || '',
    comuna: data.comuna || '',
    ciudad: data.ciudad || '',
    giro: data.giro || '',
    id_region: data.id_region ? Number(data.id_region) : undefined,
    id_provincia: data.id_provincia ? Number(data.id_provincia) : undefined,
    id_comuna: data.id_comuna ? Number(data.id_comuna) : undefined,
    internalCode: data.internalCode || data.codigo_interno || '',
    isActive: data.isActive ?? data.activo ?? true,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

export const updateClient = async (clientId: string, clientData: UpdateClientData): Promise<any> => {
  const response = await apiClient(`/dpay/cliente/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(clientData),
  });
  
  const result = await response.json();
  
  if (result.error) {
    throw new Error(result.mensaje || 'Error al actualizar cliente');
  }
  
  return result;
};

// Tipos para datos geográficos
export interface Region {
  id_region?: number;
  id?: number;
  nombre_region?: string;
  nombre?: string;
  region?: string;
}

export interface Provincia {
  id_provincia?: number;
  id?: number;
  nombre_provincia?: string;
  nombre?: string;
  provincia?: string;
  id_region?: number;
}

export interface Comuna {
  id_comuna?: number;
  id?: number;
  nombre_comuna?: string;
  nombre?: string;
  comuna?: string;
  id_provincia?: number;
}

// Funciones para obtener datos geográficos
export const getRegiones = async (): Promise<Region[]> => {
  const response = await apiClient('/cotizador/regiones', {
    method: 'GET',
    requiresAuth: false,
  });
  const data = await response.json();
  console.log('Respuesta de Regiones:', data); // Debug
  
  // El backend puede devolver directamente el array o dentro de una propiedad
  return Array.isArray(data) ? data : (data.data || data.regiones || []);
};

export const getProvinciasPorRegion = async (idRegion: number): Promise<Provincia[]> => {
  const response = await apiClient('/cotizador/provincias', {
    method: 'GET',
    requiresAuth: false,
  });
  const data = await response.json();
  console.log('Respuesta de Provincias:', data); // Debug

  const all: Provincia[] = Array.isArray(data) ? data : (data.data || data.provincias || []);
  // El backend devuelve todas las provincias; filtramos por región en el cliente
  return all.filter(p => p.id_region === idRegion);
};

export const getComunasPorProvincia = async (idProvincia: number): Promise<Comuna[]> => {
  const response = await apiClient('/cotizador/comunas', {
    method: 'GET',
    requiresAuth: false,
  });
  const data = await response.json();
  console.log('Respuesta de Comunas:', data); // Debug

  const all: Comuna[] = Array.isArray(data) ? data : (data.data || data.comunas || []);
  return all.filter(c => c.id_provincia === idProvincia);
};

/**
 * Obtiene región y provincia a partir de una comuna (reverse lookup)
 * Similar a /auxiliares/ProvinciaRegion del portal web
 */
interface ComunaDetail {
  id_comuna: number;
  comuna?: string;
  nombre_comuna?: string;
  id_provincia: number;
  provincia?: string;
  nombre_provincia?: string;
  id_region: number;
  region?: string;
  nombre_region?: string;
}

export const getRegionProvinciaFromComuna = async (idComuna: number): Promise<ComunaDetail | null> => {
  try {
    const response = await apiClient(`/cotizador/regioprovincia/${idComuna}`, {
      method: 'GET',
      requiresAuth: false,
    });
    const data = await response.json();
    console.log('Respuesta de ProvinciaRegion:', data); // Debug
    return data;
  } catch (error) {
    console.error('Error al obtener provincia/región desde comuna:', error);
    return null;
  }
};

export const getCafs = async (): Promise<CAFData[]> => {
  const response = await apiClient('/folios/caf', {
    method: 'GET',
  });
  return response.json();
};

export const calculateTotalsByDocType = (items: { total: number }[], documentType: number): [number, number, number, number] => {
  // El subtotal es la suma de los items (precios CON IVA incluido)
  const subtotal = Math.round(items.map(item => item.total).reduce((prev, curr) => prev + curr, 0));
  let neto = 0;
  let exento = 0;
  let iva = 0;
  let total = subtotal;

  if (documentType === 33) {
    // Factura Electrónica - El precio ya tiene IVA, extraemos el neto
    // Total = Neto + IVA = Neto + (Neto * 0.19) = Neto * 1.19
    // Neto = Total / 1.19
    iva = Math.round(total * (19 / 119));
    neto = total - iva;
    exento = 0;
    // total ya está correcto (es el precio con IVA)
  } else if (documentType === 34) {
    // Factura Exenta - No hay IVA
    exento = total;
    neto = 0;
    iva = 0;
  } else if (documentType === 39) {
    // Boleta Electrónica - IVA incluido en el precio
    iva = Math.round(total * (19 / 119));
    neto = total - iva;
    exento = 0;
  } else if (documentType === 41) {
    // Boleta Exenta - No hay IVA
    iva = 0;
    exento = total;
    neto = 0;
  } else if (documentType === 0) {
    // Comprobante de Pago - No emite DTE, sin IVA diferenciado (todo exento)
    iva = 0;
    exento = total;
    neto = 0;
  }

  return [neto, exento, iva, total];
};

/**
 * Construye el detalle de items según el tipo de documento
 * 
 * REGLAS POR TIPO DE DOCUMENTO:
 * - Factura (33): PrcItem y MontoItem son NETOS (÷1.19), se suma IVA aparte
 * - Factura Exenta (34): PrcItem y MontoItem sin cambio (no hay IVA)
 * - Boleta (39): PrcItem y MontoItem CON IVA incluido (sin modificar)
 * - Boleta Exenta (41): PrcItem y MontoItem sin cambio (no hay IVA)
 */
const buildDetalleByDocType = (
  items: Array<{ code?: string; name: string; count: number; value: number; total: number; nombreBodega?: string }>,
  documentType: number
): Array<{
  NroLinDet: string;
  CdgItem: { TpoCodigo: string; VlrCodigo: string };
  NmbItem: string;
  QtyItem: string;
  PrcItem: string;
  MontoItem: string;
  CodBodega?: string;
}> => {
  return items.map((item, index) => {
    let precioItem: number;
    let montoItem: number;

    switch (documentType) {
      case 33:
        // FACTURA ELECTRÓNICA: Los precios deben ser NETOS (sin IVA)
        // El IVA se calcula y suma en los totales del encabezado
        precioItem = Math.round(item.value / 1.19);
        montoItem = Math.round(item.total / 1.19);
        break;

      case 34:
        // FACTURA EXENTA: No hay IVA, precios se mantienen igual
        precioItem = item.value;
        montoItem = item.total;
        break;

      case 39:
        // BOLETA ELECTRÓNICA: Los precios YA INCLUYEN IVA
        // Se envían tal cual, el IVA está incluido en el precio
        precioItem = item.value;
        montoItem = item.total;
        break;

      case 41:
        // BOLETA EXENTA: No hay IVA, precios se mantienen igual
        precioItem = item.value;
        montoItem = item.total;
        break;

      default:
        // Por defecto, mantener precios sin cambio
        precioItem = item.value;
        montoItem = item.total;
    }

    return {
      NroLinDet: (index + 1).toString(),
      CdgItem: {
        TpoCodigo: 'INT1',
        VlrCodigo: item.code || '0',
      },
      NmbItem: item.name,
      QtyItem: item.count.toString(),
      PrcItem: precioItem.toString(),
      MontoItem: montoItem.toString(),
      // CodBodega: nombre de la bodega por ítem (para descontar stock de la bodega correcta)
      ...(item.nombreBodega ? { CodBodega: item.nombreBodega } : {}),
    };
  });
};

/**
 * Interfaz para el payload de emisión de documentos D-PAY
 */
interface EmissionPayload {
  Sistema: {
    nombre: string;
    rut: string;
    usuario: string;
    clave: string;
    bodega?: string; // Código de bodega/sucursal (01 por defecto)
  };
  Documento: {
    Encabezado: {
      IdDoc: {
        TipoDTE: string;
        Folio: string;
        FchEmis: string;
        FchVenc: string;
        FmaPago?: string; // 1=Contado, 2=Crédito, 3=Sin Costo
        FmaPagEx?: string; // Glosa forma de pago (texto libre)
      };
      Emisor: {
        RUTEmisor: string;
        RznSocEmisor: string;
        GiroEmisor: string;
        DirOrigen: string;
        CmnaOrigen: string;
        CiudadOrigen: string;
      };
      Receptor: {
        RUTRecep: string;
        RznSocRecep: string;
        CorreoRecep?: string;
        DirRecep?: string;
        CmnaRecep?: string;
        CiudadRecep?: string;
      };
      Totales: {
        MntNeto: string;
        MntExe: string;
        TasaIVA: string;
        IVA: string;
        MntTotal: string;
      };
    };
    Detalle: Array<{
      NroLinDet: string;
      CdgItem: {
        TpoCodigo: string;
        VlrCodigo: string;
      };
      NmbItem: string;
      QtyItem: string;
      PrcItem: string;
      MontoItem: string;
      IndExe?: string;
    }>;
    Referencia?: Array<{
      NroLinRef: string;
      TpoDocRef: string;
      FolioRef: string;
      CodRef: string;
      RazonRef: string;
      FchRef?: string;
    }>;
  };
  // Adicional va FUERA de Documento (al mismo nivel que Documento).
  // El PHP backend itera NodosA con foreach y asigna A1, A2... automáticamente.
  // Cada elemento debe tener la propiedad 'valor'.
  Adicional?: {
    NodosA: Array<{ valor: string }>;
  };
  // UUID de la transacción en Base64. Permite correlacionar la venta local con el DTE emitido.
  UUID?: string;
}

/**
 * Respuesta del API de emisión
 */
export interface EmissionResponse {
  status: 'success' | 'error';
  message: string;
  folio?: number;
  trackId?: string;
  id_documento?: number; // ID del documento guardado en el servidor
  pdf?: string;
  xml?: string;
  ted?: string; // Timbre electrónico para PDF417
  error?: string;
  // Información de referencia (Para Notas de Crédito)
  referencia?: {
    tipoDocRef: number;
    nombreDocRef: string;
    folioRef: number;
    fechaRef: string;
    razonRef: string;
    codigoRef: number;
  };
}

/**
 * Emite un documento electrónico al SII a través del API de D-PAY
 * Esta función replica exactamente el comportamiento de saveDocument() del proyecto antiguo
 * 
 * @param sale - Venta con toda la información necesaria
 * @returns Respuesta del servidor con resultado de la emisión
 */
export const emitDocument = async (sale: Sale): Promise<EmissionResponse> => {
  try {
    console.log('[API] Iniciando emisión de documento para venta:', sale.id);

    // Obtener credenciales del usuario autenticado
    const { user, b64pass } = useAuthStore.getState();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    if (!b64pass) {
      throw new Error('No se encontró la contraseña codificada. Por favor, vuelva a iniciar sesión.');
    }

    if (!sale.documentType) {
      throw new Error('La venta no tiene tipo de documento asignado');
    }

    // Calcular totales según el tipo de documento
    const [neto, exento, iva, total] = calculateTotalsByDocType(sale.results, sale.documentType);

    console.log('[API] Totales calculados:', { neto, exento, iva, total });

    // DEBUG: Mostrar credenciales que se van a enviar (sin la clave completa por seguridad)
    console.log('[API] DEBUG Credenciales:', {
      sistema: user.sistema,
      rut: user.empresa?.rut,
      usuario: user.usuario,
      user: user.user,
      b64passLength: b64pass?.length,
      b64passPrefix: b64pass?.substring(0, 10) + '...',
    });

    // Mapear método de pago de la app a formato SII
    let fmaPago: string | undefined;
    let fmaPagEx: string | undefined;
    
    if (sale.paymentMethod) {
      const paymentMethodLower = sale.paymentMethod.toLowerCase();
      
      if (paymentMethodLower.includes('efectivo')) {
        fmaPago = '1'; // Contado
        fmaPagEx = 'Efectivo';
      } else if (paymentMethodLower.includes('crédito') || paymentMethodLower.includes('credito')) {
        fmaPago = '2'; // Crédito
        fmaPagEx = 'Tarjeta de Crédito';
      } else if (paymentMethodLower.includes('débito') || paymentMethodLower.includes('debito')) {
        fmaPago = '1'; // Contado (tarjeta débito es pago inmediato)
        fmaPagEx = 'Tarjeta de Débito';
      } else {
        // Método de pago desconocido, usar el texto tal cual
        fmaPago = '1'; // Por defecto contado
        fmaPagEx = sale.paymentMethod;
      }
    }

    console.log('[API] Método de pago mapeado:', { original: sale.paymentMethod, fmaPago, fmaPagEx });

    // Construir payload - Folio "0" para que el servidor asigne el siguiente disponible
    // CodBodega se envía por ítem en el Detalle (no en Sistema)
    const payload: EmissionPayload = {
      Sistema: {
        nombre: user.sistema || 'D-PAY Mobile',
        rut: user.empresa?.rut || '',
        usuario: user.usuario || user.user || '',
        clave: b64pass,
      },
      Documento: {
        Encabezado: {
          IdDoc: {
            TipoDTE: sale.documentType.toString(),
            Folio: '0', // El servidor asignará el folio correcto
            FchEmis: moment(sale.completedAt || sale.createdAt).format('YYYY-MM-DD'),
            FchVenc: moment(sale.completedAt || sale.createdAt).format('YYYY-MM-DD'),
            ...(fmaPago && { FmaPago: fmaPago }),
            ...(fmaPagEx && { FmaPagEx: fmaPagEx }),
          },
          Emisor: {
            RUTEmisor: user.empresa?.rut || '',
            RznSocEmisor: user.empresa?.razon || '',
            GiroEmisor: user.empresa?.giro || '',
            DirOrigen: user.empresa?.direccion || '',
            CmnaOrigen: user.empresa?.comuna || '',
            CiudadOrigen: user.empresa?.provincia || '',
          },
          Receptor: {
            RUTRecep: sale.client?.rut || '66666666-6',
            RznSocRecep: sale.client?.name || (sale.client as any)?.razon || 'PUBLICO GENERAL',
            CorreoRecep: sale.client?.email || undefined,
            // La BD usa 'direccion', el tipo usa 'address' - intentar ambos
            DirRecep: sale.client?.address || (sale.client as any)?.direccion || 'SIN DIRECCION',
            CmnaRecep: sale.client?.comuna || 'SANTIAGO',
            CiudadRecep: sale.client?.ciudad || 'SANTIAGO',
          },
          Totales: {
            MntNeto: neto >= 0 ? neto.toString() : '0',
            MntExe: exento >= 0 ? exento.toString() : '0',
            TasaIVA: '19',
            IVA: iva >= 0 ? iva.toString() : '0',
            MntTotal: total.toString(),
          },
        },
        // Detalle construido según tipo de documento usando función específica
        Detalle: buildDetalleByDocType(sale.results, sale.documentType),
      },
    };

    // Agregar Adicional con propina si existe.
    // IMPORTANTE: Adicional va al nivel RAÍZ (fuera de Documento), con campos nombrados A1-A10.
    // Se usa request.tip como fuente primaria porque se captura ANTES de TUU (o sin TUU en efectivo).
    // response.transactionTip solo se usa como fallback si TUU devolvió un valor mayor.
    const requestTip = sale.tuuPaymentData?.request?.tip ?? 0;
    const responseTip = sale.tuuPaymentData?.response?.transactionTip ?? 0;
    const propina = requestTip > 0 ? requestTip : responseTip;
    console.log('[API] [PROPINA] requestTip:', requestTip, '| responseTip:', responseTip, '| propina final:', propina);
    if (propina > 0) {
      payload.Adicional = {
        NodosA: [{ valor: `Propina: ${formatCurrency(propina)}` }],
      };
      console.log('[API] [PROPINA] Adicional enviado a DTemite:', JSON.stringify(payload.Adicional));
    } else {
      console.log('[API] [PROPINA] Sin propina — Adicional no se agrega');
    }

    // Agregar UUID en Base64 para correlacionar la venta local con el DTE emitido
    const rawUUID = generateUUID();
    payload.UUID = btoa(rawUUID);
    console.log('[API] UUID emisión:', rawUUID, '→ Base64:', payload.UUID);

    console.log('[API] Payload construido:', JSON.stringify(payload, null, 2));

    // Enviar a API de sincronización de D-PAY
    const response = await fetch(
      // PRODUCCIÓN:
      'https://sistema.dtemite.cl/sistema/Backend/WsMaster/ApiIntegracionController.php/Api/Documento',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    console.log('[API] Respuesta recibida, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error en respuesta:', errorText);

      // Si el documento ya está registrado, lo consideramos como éxito
      // ya que el documento existe en el sistema
      if (errorText.includes('Documento ya registrado')) {
        console.log('[API] Documento ya existía en el sistema, marcando como sincronizado');
        return {
          status: 'success',
          message: 'Documento ya registrado previamente',
          folio: sale.folio,
        };
      }

      throw new Error(`Error en emisión: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[API] Documento emitido exitosamente:', JSON.stringify(result));

    // Extraer el folio de la respuesta del servidor
    // La respuesta puede venir en diferentes formatos
    let folioAsignado = result.folio || result.Folio || result.data?.folio || result.data?.Folio;

    // Si no viene el folio directo, intentar parsearlo del mensaje
    if (!folioAsignado && result.Mensaje) {
      const folioMatch = result.Mensaje.match(/folio[:\s]*(\d+)/i);
      if (folioMatch) {
        folioAsignado = parseInt(folioMatch[1], 10);
      }
    }
    
    // IMPORTANTE: Asegurar que el folio sea siempre NUMBER, no string
    if (folioAsignado) {
      folioAsignado = Number(folioAsignado);
    }

    console.log('[API] Folio asignado por el servidor:', folioAsignado);

    // Extraer el TED de la respuesta (puede venir en diferentes formatos)
    let tedAsignado = result.ted || result.Ted || result.TED ||
      result.data?.ted || result.data?.Ted || result.data?.TED ||
      result.timbre || result.Timbre;

    if (tedAsignado) {
      console.log('[API] TED recibido del servidor, longitud:', tedAsignado.length);
    } else {
      console.log('[API] No se recibió TED en la respuesta');
    }

    return {
      status: 'success',
      message: result.Mensaje || 'Documento emitido correctamente',
      folio: folioAsignado,
      ted: tedAsignado,
      ...result,
      // Normalizar id_documento desde diferentes posibles claves del servidor
      id_documento: result.id_documento || result.id || result.data?.id_documento || undefined,
    } as EmissionResponse;
  } catch (error) {
    console.error('[API] Error al emitir documento:', error);
    throw error;
  }
};

/**
 * Emite una Nota de Crédito para anular o corregir un documento existente
 * @param originalSale - Venta original a referenciar
 * @param reason - Razón de la NC
 * @param codigoRef - Código SII: 1=Anula Total, 3=Corrección de Monto
 * @param customItems - Items personalizados para NC parcial (solo para código 3)
 */
export const emitCreditNote = async (originalSale: Sale, reason: string = 'Anula documento total', codigoRef: 1 | 3 = 1, customItems?: SaleItem[]): Promise<EmissionResponse> => {
  try {
    console.log('[API] Iniciando emisión de Nota de Crédito:', { tipo: codigoRef === 1 ? 'Total' : 'Corrección', saleId: originalSale.id });

    // Obtener credenciales
    const { user, b64pass } = useAuthStore.getState();

    if (!user) throw new Error('Usuario no autenticado');
    if (!b64pass) throw new Error('No se encontró contraseña codificada');
    if (!originalSale.documentType) throw new Error('La venta original no tiene tipo de documento');
    if (!originalSale.folio) throw new Error('La venta original no tiene folio');
    if (codigoRef === 3 && (!customItems || customItems.length === 0)) throw new Error('NC por corrección requiere items personalizados');

    // Determinar items a usar: personalizados (corrección) o todos (anulación total)
    const itemsParaNC = customItems || originalSale.results;

    // Calcular totales basados en los items de la NC
    const [neto, exento, iva, total] = calculateTotalsByDocType(itemsParaNC, originalSale.documentType);

    // Mapear método de pago para la NC (mismo que documento original)
    let fmaPago: string | undefined;
    let fmaPagEx: string | undefined;
    
    if (originalSale.paymentMethod) {
      const paymentMethodLower = originalSale.paymentMethod.toLowerCase();
      
      if (paymentMethodLower.includes('efectivo')) {
        fmaPago = '1'; // Contado
        fmaPagEx = 'Efectivo';
      } else if (paymentMethodLower.includes('crédito') || paymentMethodLower.includes('credito')) {
        fmaPago = '2'; // Crédito
        fmaPagEx = 'Tarjeta de Crédito';
      } else if (paymentMethodLower.includes('débito') || paymentMethodLower.includes('debito')) {
        fmaPago = '1'; // Contado
        fmaPagEx = 'Tarjeta de Débito';
      } else {
        fmaPago = '1';
        fmaPagEx = originalSale.paymentMethod;
      }
    }

    // Construir Detalle de la Nota de Crédito
    // 1. Si el documento original es AFECTO (33, 39), forzamos lógica tipo 33 para obtener valores NETOS
    // 2. Si el documento original es EXENTO (34, 41), usamos la lógica original (ya trae valores completos)
    let detalleNC = buildDetalleByDocType(
      itemsParaNC,
      (originalSale.documentType === 33 || originalSale.documentType === 39) ? 33 : originalSale.documentType
    );

    // 3. ADICIONAL: Si el documento original es EXENTO (34, 41), debemos marcar explícitamente los ítems como exentos
    // en la Nota de Crédito para que el backend sume al Monto Exento y no al Neto.
    if (originalSale.documentType === 34 || originalSale.documentType === 41) {
      detalleNC = detalleNC.map(item => ({
        ...item,
        IndExe: '1'
      }));
    }

    // Construir payload
    // CodBodega se envía por ítem en el Detalle (no en Sistema)
    const payload: EmissionPayload = {
      Sistema: {
        nombre: user.sistema || 'D-PAY Mobile',
        rut: user.empresa?.rut || '',
        usuario: user.usuario || user.user || '',
        clave: b64pass,
      },
      Documento: {
        Encabezado: {
          IdDoc: {
            TipoDTE: '61', // Nota de Crédito
            Folio: '0',
            FchEmis: moment().format('YYYY-MM-DD'),
            FchVenc: moment().format('YYYY-MM-DD'),
            ...(fmaPago && { FmaPago: fmaPago }),
            ...(fmaPagEx && { FmaPagEx: fmaPagEx }),
          },
          Emisor: {
            RUTEmisor: user.empresa?.rut || '',
            RznSocEmisor: user.empresa?.razon || '',
            GiroEmisor: user.empresa?.giro || '',
            DirOrigen: user.empresa?.direccion || '',
            CmnaOrigen: user.empresa?.comuna || '',
            CiudadOrigen: user.empresa?.provincia || '',
          },
          Receptor: {
            // El receptor es el mismo de la venta original o Público General
            RUTRecep: originalSale.client?.rut || '66666666-6',
            RznSocRecep: originalSale.client?.name || (originalSale.client as any)?.razon || 'PUBLICO GENERAL',
            CorreoRecep: originalSale.client?.email || undefined,
            DirRecep: originalSale.client?.address || (originalSale.client as any)?.direccion || 'SIN DIRECCION',
            CmnaRecep: originalSale.client?.comuna || 'SANTIAGO',
            CiudadRecep: originalSale.client?.ciudad || (originalSale.client as any)?.ciudad || 'SANTIAGO',
          },
          Totales: {
            MntNeto: neto >= 0 ? neto.toString() : '0',
            MntExe: exento >= 0 ? exento.toString() : '0',
            TasaIVA: '19',
            IVA: iva >= 0 ? iva.toString() : '0',
            MntTotal: total.toString(),
          },
        },
        Detalle: detalleNC,
        Referencia: [
          {
            NroLinRef: '1',
            TpoDocRef: originalSale.documentType.toString(),
            FolioRef: originalSale.folio.toString(),
            CodRef: codigoRef.toString(), // 1=Anula Total, 3=Corrección de Monto
            RazonRef: reason,
            FchRef: (() => {
              const fechaRef = originalSale.completedAt || originalSale.createdAt;
              if (!fechaRef) {
                console.error('[API] ERROR: originalSale no tiene createdAt ni completedAt');
                return moment().format('YYYY-MM-DD');
              }
              return moment(fechaRef).format('YYYY-MM-DD');
            })(),
          },
        ],
      },
    };

    // Agregar UUID en Base64 para correlacionar la NC con el DTE emitido
    const rawUUID = generateUUID();
    payload.UUID = btoa(rawUUID);
    console.log('[API] UUID emisión NC:', rawUUID, '→ Base64:', payload.UUID);

    console.log('[API] Payload Nota de Crédito:', JSON.stringify(payload, null, 2));

    // Enviar a API
    const response = await fetch(
      'https://sistema.dtemite.cl/sistema/Backend/WsMaster/ApiIntegracionController.php/Api/Documento',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error en emisión NC:', errorText);
      throw new Error(`Error en emisión NC: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[API] NC emitida exitosamente:', JSON.stringify(result));

    // Extraer folio igual que en emitDocument
    let folioAsignado = result.folio || result.Folio || result.data?.folio || result.data?.Folio;
    if (!folioAsignado && result.Mensaje) {
      const folioMatch = result.Mensaje.match(/folio[:\s]*(\d+)/i);
      if (folioMatch) folioAsignado = parseInt(folioMatch[1], 10);
    }
    
    // IMPORTANTE: Asegurar que el folio sea siempre NUMBER, no string
    if (folioAsignado) {
      folioAsignado = Number(folioAsignado);
    }

    return {
      status: 'success',
      message: result.Mensaje || 'Nota de Crédito emitida correctamente',
      folio: folioAsignado,
      ted: result.ted || result.Ted || result.TED,
      // Incluir información de referencia para guardar en la venta local
      referencia: {
        tipoDocRef: originalSale.documentType!,
        nombreDocRef: getDocumentTypeName(originalSale.documentType!),
        folioRef: originalSale.folio!,
        fechaRef: moment(originalSale.completedAt || originalSale.createdAt).format('YYYY-MM-DD'),
        razonRef: reason,
        codigoRef: codigoRef, // 1=Anula, 3=Corrección
      },
      ...result,
      // Normalizar id_documento desde diferentes posibles claves del servidor (igual que emitDocument)
      id_documento: result.id_documento || result.id || result.data?.id_documento || undefined,
    } as EmissionResponse;

  } catch (error) {
    console.error('[API] Error al emitir Nota de Crédito:', error);
    throw error;
  }
};

// Helper para obtener nombre de tipo de documento
const getDocumentTypeName = (type: number): string => {
  switch (type) {
    case 33: return 'Factura Electrónica';
    case 34: return 'Factura Exenta';
    case 39: return 'Boleta Electrónica';
    case 41: return 'Boleta Exenta';
    case 61: return 'Nota de Crédito';
    default: return 'Documento';
  }
};
// =====================================================

/**
 * Interface completa para transacciones TUU/DPay
 * Todos los campos son opcionales excepto 'monto' para máxima flexibilidad
 * El backend guardará lo que se envíe
 */
export interface TuuTransactionData {
  // =====================================================
  // MONTO (requerido)
  // =====================================================
  monto: number;

  // =====================================================
  // DATOS DE LA EMPRESA
  // =====================================================
  rut_empresa?: string;          // RUT de la empresa (requerido por tbl_dpay)

  // =====================================================
  // CLIENTE (opcional - puede ser registrado o natural)
  // =====================================================
  id_cliente?: number;          // FK a tbl_cliente (0 = cliente genérico)
  rut_cliente?: string;         // RUT del cliente
  nombre_cliente?: string;      // Nombre o razón social
  email_cliente?: string;       // Email del cliente
  telefono_cliente?: string;    // Teléfono del cliente
  direccion_cliente?: string;   // Dirección del cliente
  tipo_cliente?: 'registrado' | 'natural'; // Tipo de cliente

  // =====================================================
  // USUARIO QUE EFECTUÓ LA VENTA (requerido)
  // =====================================================
  usuario?: string;             // Usuario que realizó la transacción

  // =====================================================
  // COMISIONES DPAY (configurables por empresa)
  // =====================================================
  tipo_comision?: 'fija' | 'mixta'; // Tipo de comisión aplicada
  comision_porcentaje?: number; // % de comisión aplicada (1.99 para fija, 1.49 para mixta)
  comision_monto_fijo?: number; // Monto fijo base ($0 para fija, $70 para mixta)
  comision_monto?: number;      // Monto TOTAL de comisión calculado

  // =====================================================
  // MEDIO DE PAGO
  // =====================================================
  id_mediopago?: number;        // FK a tbl_medio_pago (101=Crédito, 104=Débito)

  // =====================================================
  // DATOS DE LA TARJETA
  // =====================================================
  tipo_tarjeta?: string;        // VISA, MASTERCARD, AMEX, etc.
  marca_tarjeta?: string;       // Marca de la tarjeta
  ultimos_digitos?: string;     // Últimos 4 dígitos
  codigo_autorizacion?: string; // Código de autorización del banco

  // =====================================================
  // CUOTAS (para crédito)
  // =====================================================
  cuotas?: number;              // Número de cuotas (1 = sin cuotas)

  // =====================================================
  // PROPINA Y CASHBACK
  // =====================================================
  propina?: number;             // Monto de propina
  cashback?: number;            // Monto de cashback/vuelto

  // =====================================================
  // ESTADO Y RESPUESTA DE LA TRANSACCIÓN
  // =====================================================
  transaction_status?: boolean;  // true=aprobada, false=rechazada
  transaction_id?: string;       // ID único de transacción (interno)
  sequence_number?: string;      // Número de secuencia TUU
  response_code?: string;        // Código de respuesta del procesador
  response_message?: string;     // Mensaje de respuesta

  // =====================================================
  // DATOS DE EXTRADATA TUU
  // =====================================================
  tax_idn_validation?: string;   // RUT validado del titular de tarjeta
  exempt_amount?: number;        // Monto exento
  net_amount?: number;           // Monto neto
  source_name?: string;          // Nombre de la app integradora
  source_version?: string;       // Versión de la app
  custom_fields?: string;        // Campos personalizados (JSON string)

  // =====================================================
  // VOUCHER/IMPRESIÓN
  // =====================================================
  printer_voucher_commerce?: boolean; // Si se imprimió voucher en comercio
  voucher_data?: string;         // Datos del voucher (si aplica)

  // =====================================================
  // DTE ASOCIADO
  // =====================================================
  tipo_dte?: number;             // Tipo de DTE (33, 34, 39, 41)
  folio_dte?: number;            // Folio del documento
  id_documento?: number;         // ID del documento en el sistema

  // =====================================================
  // TERMINAL Y DISPOSITIVO
  // =====================================================
  terminal_id?: string;          // ID del terminal POS
  dispositivo?: string;          // Modelo/nombre del dispositivo
  ip_origen?: string;            // IP de origen

  // =====================================================
  // INFORMACIÓN ADICIONAL
  // =====================================================
  detalle?: string;              // Descripción/detalle de la venta
  observaciones?: string;        // Observaciones adicionales
  detalle_error?: string;        // Detalle completo del error cuando transaction_status=false

  // =====================================================
  // RESPUESTA COMPLETA (para auditoría)
  // =====================================================
  request_json?: object;         // Request enviado a TUU
  response_json?: object;        // Response completo de TUU
}

/**
 * Calcula la comisión DPay según el tipo configurado (fija o mixta)
 * - Fija: (monto * 1.99%) + IVA
 * - Mixta: ((monto * 1.49%) + $70) + IVA
 * Nota: el backend persiste comision_monto (neto) y comision_iva por separado.
 * 
 * @param monto - Monto de la transacción
 * @param tipoComision - Tipo de comisión: 'fija' o 'mixta'
 * @param porcentaje - Porcentaje de comisión (1.99 para fija, 1.49 para mixta)
 * @param montoFijo - Monto fijo base ($0 para fija, $70 para mixta)
 * @returns Objeto con porcentaje, monto_fijo, comision_neta y comision_total (con IVA)
 */
export const calcularComisionDpay = (
  monto: number,
  tipoComision: 'fija' | 'mixta',
  porcentaje: number,
  montoFijo: number
): {
  tipo_comision: 'fija' | 'mixta';
  comision_porcentaje: number;
  comision_monto_fijo: number;
  comision_neta: number;
  comision_total: number;
} => {
  // Calcular comisión neta (sin IVA)
  const comisionPorcentual = Math.round((monto * porcentaje) / 100);
  const comisionNeta = comisionPorcentual + montoFijo;

  // Aplicar IVA a la comisión total
  const comisionTotal = Math.round(comisionNeta * 1.19);

  return {
    tipo_comision: tipoComision,
    comision_porcentaje: porcentaje,
    comision_monto_fijo: montoFijo,
    comision_neta: comisionNeta,
    comision_total: comisionTotal,
  };
};

/**
 * Registra una transacción TUU/DPay en el backend
 * Endpoint: POST /Api/pos/transaccion
 * Nota: Usa ruta absoluta porque el endpoint POS tiene base diferente (/Api vs /api)
 */
export const registrarTransaccionTuu = async (data: TuuTransactionData): Promise<{ success: boolean; id?: number; message?: string }> => {
  try {
    const { user } = useAuthStore.getState();

    const payload = {
      ...data,
      rut_empresa: data.rut_empresa || user?.empresa?.rut || '',
      usuario: data.usuario || user?.usuario || '',
      sistema: user?.sistema || 'D-PAY'
    };

    const POS_API_URL = `${API_BASE_URL}/pos/transaccion`;
    const token = getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `bearer ${token}`;
    }

    const response = await fetch(POS_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[API] Respuesta inválida TUU:', responseText.substring(0, 200));
      return {
        success: false,
        message: `Respuesta inválida del servidor`
      };
    }

    if (!response.ok) {
      console.error('[API] Error TUU:', result);
      return { success: false, message: result.message || `Error ${response.status}` };
    }

    return result;
  } catch (error) {
    console.error('[API] Excepción registrando TUU:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

/**
 * Vincula un DTE a una transacción TUU existente
 * Endpoint: PUT /Api/pos/transaccion/{id}/dte
 * Nota: Usa ruta absoluta porque el endpoint POS tiene base diferente (/Api vs /api)
 */
export const vincularDteATransaccion = async (
  transaccionId: string,
  tipoDte: number,
  folioDte: number | string,
  idDocumento?: number
): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log('[API] Vinculando DTE a transacción:', { transaccionId, tipoDte, folioDte, idDocumento });

    // PRODUCCIÓN:
    // const POS_API_URL = `https://sistema.dtemite.cl/sistema/Backend/WsMaster/ApiIntegracionController.php/Api/pos/transaccion/${transaccionId}/dte`;
    // QA/TESTING:
    const POS_API_URL = `${API_BASE_URL}/pos/transaccion/${transaccionId}/dte`;

    // Obtener token de autenticación
    const token = getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `bearer ${token}`;
    }

    const response = await fetch(POS_API_URL, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        tipo_dte: tipoDte,
        folio_dte: folioDte,
        id_documento: idDocumento,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[API] Error respuesta vincular DTE:', result);
      return { success: false, message: result.message || `Error ${response.status}` };
    }

    console.log('[API] DTE vinculado:', result);
    return result;
  } catch (error) {
    console.error('[API] Error vinculando DTE:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

/**
 * Anula una transacción en tbl_dpay (solo para pagos SIN DTE asociado).
 * Si el pago tiene folio_dte, el backend rechaza la solicitud — usar NC en ese caso.
 * Endpoint: PUT /pos/transaccion/{id}/anular
 */
export const anularTransaccionTuu = async (
  id: number,
  motivo: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const { user } = useAuthStore.getState();
    const token = getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `bearer ${token}`;
    }

    const payload = {
      rut_empresa: user?.empresa?.rut || '',
      usuario: user?.usuario || user?.user || '',
      sistema: user?.sistema || 'D-PAY',
      motivo,
    };

    const url = `${API_BASE_URL}/pos/transaccion/${id}/anular`;
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch {
      return { success: false, message: 'Respuesta inválida del servidor' };
    }

    if (!response.ok) {
      return { success: false, message: result.mensaje || result.message || `Error ${response.status}` };
    }

    return result;
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

/**
 * Mapea el método de pago de TUU al ID de medio de pago en BD
 * TUU: 1=Crédito, 2=Débito
 * BD: 101=Crédito, 104=Débito
 */
export const mapTuuMethodToMedioPago = (tuuMethod: number): number => {
  switch (tuuMethod) {
    case 1: return 101; // Crédito
    case 2: return 104; // Débito
    default: return 0;
  }
};

// =====================================================
// API DE COMISIONES DPAY
// =====================================================

/**
 * Interface para la respuesta de comisiones DPay
 */
export interface DpayComisiones {
  habilitado: boolean;
  tipo_comision: 'fija' | 'mixta'; // Tipo de comisión: fija (1.99% + IVA) o mixta (1.49% + $70 + IVA)
  comision_porcentaje: number; // Porcentaje de comisión (1.99 para fija, 1.49 para mixta)
  comision_monto_fijo: number; // Monto fijo base ($0 para fija, $70 para mixta)
  // Legacy fields - deprecated pero mantenidos por compatibilidad
  comision_debito?: number;
  comision_credito?: number;
  comision_credito_cuotas?: number;
}

/**
 * Obtiene la configuración de comisiones DPay para la empresa
 * Endpoint: GET /pos/comisiones?rut_empresa={rut}
 * 
 * Maneja tanto el nuevo formato (tipo_comision) como el formato legacy (comision_debito/credito)
 */
export const fetchDpayComisiones = async (): Promise<DpayComisiones> => {
  const { user } = useAuthStore.getState();

  if (!user?.empresa?.rut) {
    throw new Error('No se encontró el RUT de la empresa');
  }

  const response = await apiClient(`/pos/comisiones?rut_empresa=${user.empresa.rut}`, {
    method: 'GET',
  });

  const data = await response.json();

  // Si el backend retorna el nuevo formato, usarlo directamente
  if (data.tipo_comision) {
    return {
      habilitado: data.habilitado ?? false,
      tipo_comision: data.tipo_comision,
      comision_porcentaje: data.comision_porcentaje ?? (data.tipo_comision === 'fija' ? 1.99 : 1.49),
      comision_monto_fijo: data.comision_monto_fijo ?? (data.tipo_comision === 'mixta' ? 70 : 0),
      // Legacy fields para compatibilidad
      comision_debito: data.comision_debito,
      comision_credito: data.comision_credito,
      comision_credito_cuotas: data.comision_credito_cuotas,
    };
  }

  // Fallback: Convertir formato legacy al nuevo formato
  // Si tiene campos legacy, asumimos comisión fija con el porcentaje de débito
  const porcentajeLegacy = data.comision_debito ?? data.comision_credito ?? 1.99;

  return {
    habilitado: data.habilitado ?? false,
    tipo_comision: 'fija', // Por defecto, el formato legacy usa comisión fija
    comision_porcentaje: porcentajeLegacy,
    comision_monto_fijo: 0, // El formato legacy no tenía monto fijo
    // Legacy fields
    comision_debito: data.comision_debito,
    comision_credito: data.comision_credito,
    comision_credito_cuotas: data.comision_credito_cuotas,
  };
};

// =====================================================
// API DE DOCUMENTOS DPAY
// =====================================================

/**
 * Interface para documentos DPay retornados por el backend (lista)
 */
export interface DpayDocument {
  id_documento: number;
  folio: number;
  tipo_documento: string;
  fecha_creacion: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss
  fecha_emision?: string; // DD-MM-YYYY o ISO; lista DPay cuando el backend la envía
  montototal: number;
  medio_pago: string; // Medio de pago de tbl_documento (fallback)
  comision_monto?: number; // Monto total de comisión DPay (DEPRECATED: usar dpay_comision_monto)
  // Información de anulación
  anulado: boolean;
  tipo_anulacion?: 'total' | 'parcial' | null; // Tipo de anulación desde BD
  folio_nc_anulacion?: number | null;
  fecha_anulacion?: string | null; // DD-MM-YYYY
  razon_anulacion?: string | null;
  // Para NC: qué documento anulan
  folio_documento_anulado?: number | null;
  tipo_documento_anulado?: string | null;
  razon_anulacion_nc?: string | null;
  // Campos de tbl_dpay (transacciones DPay) - cuando existe transacción exitosa
  dpay_id?: number | null;
  dpay_monto?: number | null;
  dpay_cuotas?: number | null;
  dpay_propina?: number | null;
  dpay_cashback?: number | null;
  dpay_transaction_status?: boolean | null;
  dpay_sequence_number?: string | null;
  dpay_codigo_autorizacion?: string | null;
  dpay_tipo_tarjeta?: string | null;
  dpay_ultimos_digitos?: string | null;
  dpay_comision_porcentaje?: number | null;
  dpay_comision_monto?: number | null; // Usar este en lugar de comision_monto
  dpay_tipo_comision?: string | null;
  dpay_comision_monto_fijo?: number | null;
  dpay_response_code?: string | null;
  dpay_tax_idn_validation?: string | null;
  dpay_exempt_amount?: number | null;
  dpay_net_amount?: number | null;
  dpay_usuario?: string | null;
  dpay_sistema?: string | null;
  dpay_fecha_hora?: string | null; // ISO 8601
  dpay_ip_origen?: string | null;
  dpay_dispositivo?: string | null;
  dpay_medio_pago?: string | null; // MEDIO DE PAGO REAL de tbl_dpay (TUU/DPay)
  ted?: string | null; // TED/Timbre electrónico del documento
}

/**
 * Interface para el detalle completo de un documento DPay
 */
export interface DpayDocumentDetail {
  id_documento: number;
  folio: number;
  tipo_documento: string;
  fecha_emision: string;
  fecha_creacion: string;
  rut_cliente: string;
  razon_social: string;
  direccion: string;
  email: string;
  telefono: string;
  medio_pago: string; // Medio de pago de tbl_documento (fallback)
  monto_neto: number;
  monto_exento: number;
  montoiva: number;
  montototal: number;
  observacion_doc: string;
  detalle: DpayDocumentDetailItem[];
  // Información de anulación
  anulado: boolean;
  tipo_anulacion?: 'total' | 'parcial' | null; // Tipo de anulación desde BD
  folio_nc_anulacion?: number | null;
  fecha_anulacion?: string | null; // DD-MM-YYYY
  razon_anulacion?: string | null;
  // Para NC: qué documento anulan
  folio_documento_anulado?: number | null;
  tipo_documento_anulado?: string | null;
  razon_anulacion_nc?: string | null;
  // Campos de tbl_dpay (transacciones DPay) - cuando existe transacción exitosa
  dpay_id?: number | null;
  dpay_monto?: number | null;
  dpay_cuotas?: number | null;
  dpay_propina?: number | null;
  dpay_cashback?: number | null;
  dpay_transaction_status?: boolean | null;
  dpay_sequence_number?: string | null;
  dpay_codigo_autorizacion?: string | null;
  dpay_tipo_tarjeta?: string | null;
  dpay_ultimos_digitos?: string | null;
  dpay_comision_porcentaje?: number | null;
  dpay_comision_monto?: number | null;
  dpay_tipo_comision?: string | null;
  dpay_comision_monto_fijo?: number | null;
  dpay_response_code?: string | null;
  dpay_tax_idn_validation?: string | null;
  dpay_exempt_amount?: number | null;
  dpay_net_amount?: number | null;
  dpay_usuario?: string | null;
  dpay_sistema?: string | null;
  dpay_fecha_hora?: string | null; // ISO 8601
  dpay_ip_origen?: string | null;
  dpay_dispositivo?: string | null;
  dpay_medio_pago?: string | null; // MEDIO DE PAGO REAL de tbl_dpay (TUU/DPay)
  ted?: string | null; // TED/Timbre electrónico del documento
  sistema?: string | null; // Sistema del documento (campo raíz del servidor)
}

/**
 * Interface para items del detalle
 */
export interface DpayDocumentDetailItem {
  numero_linea: number;
  cod_producto: string;
  descripcion_prod: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  recargo: number;
  total: number;
  id_bodega?: number; // ID de la bodega del producto
  bodega?: string; // Nombre de la bodega
  afecto?: number; // 1=Afecto, 0=Exento
  cod_imp?: number; // Código de impuesto
  monto_impuesto?: number;
  tasa_impuesto?: number;
  nombre_impuesto?: string;
  costo?: number; // Precio de compra/costo
  medida?: string; // Unidad de medida
  marca?: string;
  adicional_uno?: string;
  adicional_dos?: string;
  adicional_tres?: string;
}

/**
 * Parámetros para listar documentos DPay
 * Endpoint: POST /dpay/documentos
 */
export interface ListarDocumentosDpayParams {
  fecha_desde: string; // Formato: DD-MM-YYYY
  fecha_hasta: string; // Formato: DD-MM-YYYY
  rut_empresa?: string; // Opcional, se toma del usuario autenticado si no se provee
  usuario?: string; // Opcional, se toma del usuario autenticado si no se provee
}

/**
 * Lista documentos DPay (documentos con xml_integrado) desde el backend
 * Endpoint: POST /dpay/documentos
 * Autenticación: Bearer Token (NO usa API Key)
 * 
 * @param params - Parámetros de filtrado (fechas, empresa, usuario)
 * @returns Array de documentos DPay
 */
export const listarDocumentosDpay = async (params: ListarDocumentosDpayParams): Promise<DpayDocument[]> => {
  try {
    const { user } = useAuthStore.getState();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    if (!user.empresa?.rut) {
      throw new Error('RUT de empresa no disponible');
    }

    // Limpiar fechas: solo permitir números, guiones, espacios y dos puntos (formato: YYYY-MM-DD HH:mm:ss)
    const cleanDate = (date: string): string => {
      return date.replace(/[^\d\-: ]/g, '').trim();
    };

    // Preparar payload según especificación del backend
    const payload = {
      rut_empresa: params.rut_empresa || user.empresa.rut,
      usuario: params.usuario || user.usuario || user.user || '',
      fecha_desde: cleanDate(params.fecha_desde),
      fecha_hasta: cleanDate(params.fecha_hasta),
    };

    console.log('[API] Listando documentos DPay:', payload);
    console.log('[API] Usuario desde store:', { usuario: user.usuario, user: user.user });

    // Usar apiClient que ya maneja Authorization: bearer {token}
    const response = await apiClient('/dpay/documentos', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: true,
    });

    const responseText = await response.text();
    console.log('[API] Respuesta RAW DPay:', responseText);

    const responseData = JSON.parse(responseText);
    console.log('[API] Respuesta parseada:', JSON.stringify(responseData, null, 2));

    // Verificar estructura de la respuesta
    // Puede ser: { data: [...] } o directamente [...]
    let documents: DpayDocument[];
    
    if (Array.isArray(responseData)) {
      documents = responseData;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      documents = responseData.data;
    } else if (responseData.resultado && Array.isArray(responseData.resultado)) {
      documents = responseData.resultado;
    } else {
      console.warn('[API] Estructura de respuesta inesperada:', responseData);
      documents = [];
    }

    console.log('[API] Documentos DPay obtenidos:', documents.length);

    return documents;
  } catch (error) {
    console.error('[API] Error en listarDocumentosDpay:', error);
    throw error;
  }
};

/**
 * Obtiene el detalle completo de un documento DPay
 * Endpoint: POST /dpay/documento
 * Autenticación: Bearer Token
 * 
 * @param id_documento ID del documento a obtener
 * @param rut_empresa RUT de la empresa
 * @returns Detalle completo del documento
 */
export const obtenerDocumentoDpay = async (id_documento: number, rut_empresa?: string): Promise<DpayDocumentDetail> => {
  try {
    const { user } = useAuthStore.getState();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    if (!user.empresa?.rut) {
      throw new Error('RUT de empresa no disponible');
    }

    // Preparar payload
    const payload = {
      id_documento,
      rut_empresa: rut_empresa || user.empresa.rut,
    };

    console.log('[API] Obteniendo detalle documento DPay:', payload);

    const response = await apiClient('/dpay/documento', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: true,
    });

    const documentDetail: DpayDocumentDetail = await response.json();
    console.log('[API] Detalle documento DPay obtenido:', JSON.stringify({
      id_documento: documentDetail.id_documento,
      dpay_sistema: documentDetail.dpay_sistema,
      dpay_usuario: documentDetail.dpay_usuario,
      folio: documentDetail.folio,
      keys: Object.keys(documentDetail),
    }));

    return documentDetail;
  } catch (error) {
    console.error('[API] Error en obtenerDocumentoDpay:', error);
    throw error;
  }
};

/**
 * Elimina una boleta DPay cuando el tenant no tiene NC (soft delete + COFF si aplica).
 * POST /dpay/documento/eliminar
 */
export const eliminarBoletaDpay = async (
  id_documento: number,
  motivo: string = 'Eliminación desde D-PAY'
): Promise<{
  success: boolean;
  message?: string;
  requiere_reenvio_coff?: boolean;
}> => {
  try {
    const { user } = useAuthStore.getState();

    if (!user?.empresa?.rut) {
      return { success: false, message: 'RUT de empresa no disponible' };
    }

    const payload = {
      id_documento,
      rut_empresa: user.empresa.rut,
      usuario: user.usuario || user.user || '',
      motivo,
    };

    const response = await apiClient('/dpay/documento/eliminar', {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: true,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || result.mensaje || `Error ${response.status}`,
      };
    }

    return {
      success: true,
      message: result.message,
      requiere_reenvio_coff: result.requiere_reenvio_coff,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};


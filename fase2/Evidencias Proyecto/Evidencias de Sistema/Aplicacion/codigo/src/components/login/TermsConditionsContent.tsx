import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Contenido de términos y condiciones de DPAY
 */
export const TermsConditionsContent = () => {
  const now = new Date();
  const dia = String(now.getDate()).padStart(2, '0');
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const anio = now.getFullYear();
  const fechaActual = `${dia}/${mes}/${anio}`;

  return (
    <View style={styles.content}>
      <Text style={styles.title}>TÉRMINOS Y CONDICIONES DE USO{'\n'}APLICACIÓN "Dpay"</Text>
      <Text style={styles.fecha}>FECHA DE ÚLTIMA ACTUALIZACIÓN: {fechaActual}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. ACEPTACIÓN DE LOS TÉRMINOS</Text>
        <Text style={styles.paragraph}>
          El presente documento establece los términos y condiciones (en adelante, los "Términos") que rigen el uso de la aplicación móvil Dpay (en adelante, la "Aplicación" o "La App"), desarrollada y operada por Dpay (en adelante, "El Proveedor").
        </Text>
        <Text style={styles.paragraph}>
          Al descargar, instalar, acceder o utilizar Dpay, el Usuario (en adelante, el "Cliente" o "Usuario") acepta estar legalmente vinculado por estos Términos. Si no acepta estos Términos, no debe utilizar la Aplicación.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. DESCRIPCIÓN DEL SERVICIO</Text>
        <Text style={styles.paragraph}>
          Dpay es una solución de software de Punto de Venta (POS) móvil diseñada para facilitar la emisión de documentos tributarios electrónicos y la gestión de ventas en Chile.
        </Text>
        <Text style={styles.paragraph}>
          El Usuario comprende y acepta que Dpay funciona bajo un modelo que integra los siguientes componentes:
        </Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>El Software (Dpay):</Text> La interfaz de venta y gestión proporcionada por El Proveedor.</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>La Plataforma de Backend:</Text> El servicio que provee la lógica de negocio, conexión con el SII (Servicio de Impuestos Internos de Chile) e inventario.</Text>
        <Text style={styles.bulletPoint}>• <Text style={styles.bold}>El Hardware POS:</Text> El dispositivo físico donde se ejecuta la App, proporcionado por terceros fabricantes homologados.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. REQUISITOS DE FUNCIONAMIENTO</Text>
        <Text style={styles.paragraph}>
          Para el correcto funcionamiento de Dpay, el Cliente declara conocer que es indispensable mantener:
        </Text>
        <Text style={styles.bulletPoint}>• Una suscripción activa y vigente al servicio Dpay.</Text>
        <Text style={styles.bulletPoint}>• Un dispositivo POS compatible y funcional.</Text>
        <Text style={styles.bulletPoint}>• Conexión a Internet estable.</Text>
        <Text style={styles.paragraph}>
          El Proveedor no se hace responsable por la imposibilidad de uso de la App derivada de la suspensión o cancelación de servicios, ni por fallas técnicas en el hardware POS proporcionado por terceros fabricantes.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. COMISIONES POR TRANSACCIÓN</Text>
        <Text style={styles.paragraph}>
          El uso del servicio de cobro electrónico a través de Dpay está sujeto a las siguientes tarifas según el plan contratado. Los porcentajes y montos indicados son netos y están sujetos a IVA (19%) sobre la comisión calculada por cada transacción:
        </Text>

        <View style={styles.comisionCard}>
          <Text style={styles.comisionTitulo}>COMISIÓN FIJA</Text>
          <Text style={styles.comisionValor}>1,99% + IVA</Text>
          <Text style={styles.comisionDesc}>por transacción</Text>
        </View>

        <View style={[styles.comisionCard, styles.comisionCardMixta]}>
          <Text style={styles.comisionTitulo}>COMISIÓN MIXTA</Text>
          <Text style={styles.comisionValor}>1,49% + $70 + IVA</Text>
          <Text style={styles.comisionDesc}>por transacción</Text>
        </View>

        <Text style={styles.paragraph}>
          Las tarifas aplican sobre el monto total de cada transacción procesada (incluida propina cuando corresponda). El IVA se calcula sobre la comisión neta resultante. El Proveedor se reserva el derecho de actualizar estas tarifas previo aviso al Cliente.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. USO DE LA APLICACIÓN Y RESPONSABILIDADES DEL USUARIO</Text>
        <Text style={styles.paragraph}>
          El Usuario se compromete a utilizar Dpay exclusivamente para fines comerciales lícitos.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Gestión de Usuarios:</Text> El Cliente es responsable de los usuarios creados dentro de la App (cajeros, supervisores) y de las acciones realizadas por estos.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Seguridad:</Text> El Cliente es responsable de mantener la confidencialidad de sus credenciales de acceso.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Exactitud de la Información:</Text> Al emitir documentos electrónicos (Boletas, Facturas), el Cliente es el único responsable ante el SII de la veracidad de los montos, ítems y receptores ingresados.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. EMISIÓN DE DOCUMENTOS TRIBUTARIOS Y CONEXIÓN CON SII</Text>
        <Text style={styles.paragraph}>
          Dpay facilita la emisión de documentos tributarios electrónicos a través de su plataforma integrada con el SII.
        </Text>
        <View style={styles.clausula}>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Limitación de Responsabilidad:</Text> El Proveedor no garantiza la disponibilidad ininterrumpida de los servicios del SII. En caso de caída de los servidores del SII, la App operará bajo las normativas de contingencia vigentes, siendo responsabilidad del Cliente regularizar los documentos una vez restablecido el servicio.
          </Text>
        </View>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Anulaciones:</Text> Las funciones de anulación (Notas de Crédito) están sujetas a las reglas de validación del SII.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. PROPIEDAD INTELECTUAL</Text>
        <Text style={styles.paragraph}>
          El software Dpay, su código fuente, diseño, interfaz, logotipos y marcas son propiedad exclusiva de El Proveedor. La descarga de la App otorga al Usuario una licencia limitada, no exclusiva, intransferible y revocable para usar el software únicamente en el hardware compatible y durante la vigencia del contrato. Queda prohibida la ingeniería inversa, descompilación o copia del software.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. LIMITACIÓN DE RESPONSABILIDAD</Text>
        <Text style={styles.paragraph}>
          En la máxima medida permitida por la ley chilena:
        </Text>
        <View style={styles.clausula}>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>A. Hardware de Terceros:</Text> El Proveedor NO es responsable por fallas, averías, sobrecalentamiento o incompatibilidades del hardware POS. Cualquier reclamo sobre el dispositivo físico debe dirigirse directamente al fabricante o proveedor del hardware.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>B. Datos:</Text> El Proveedor no será responsable por inconsistencias en el inventario si estas provienen de una mala manipulación de datos o desconexiones de red.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>C. Daños Indirectos:</Text> El Proveedor no será responsable por lucro cesante, pérdida de datos o interrupción del negocio derivada del uso o imposibilidad de uso de la App.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. PRIVACIDAD Y PROTECCIÓN DE DATOS</Text>
        <Text style={styles.paragraph}>
          En cumplimiento con la Ley N° 19.628 sobre Protección de la Vida Privada, Dpay recolecta y procesa datos de ventas y usuarios con el único fin de prestar el servicio. El Cliente autoriza el tratamiento de estos datos para la correcta emisión de documentos tributarios.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. MODIFICACIONES DE LOS TÉRMINOS</Text>
        <Text style={styles.paragraph}>
          El Proveedor se reserva el derecho de modificar estos Términos en cualquier momento. Las actualizaciones críticas serán notificadas a través de la App y requerirán una nueva aceptación para continuar operando.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>11. LEY APLICABLE Y JURISDICCIÓN</Text>
        <Text style={styles.paragraph}>
          Estos Términos se rigen por las leyes de la República de Chile. Para cualquier controversia derivada de este contrato, las partes fijan su domicilio en la ciudad y comuna de Santiago y se someten a la jurisdicción de sus Tribunales Ordinarios de Justicia.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerBrand}>dpay.cl</Text>
        <Text style={styles.footerText}>© {anio} Dpay. Todos los derechos reservados.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E91E8C',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },
  fecha: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E8C',
    marginBottom: 12,
    marginTop: 10,
  },
  paragraph: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    textAlign: 'justify',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 10,
  },
  bold: {
    fontWeight: '700',
    color: '#E91E8C',
  },
  clausula: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#E91E8C',
    marginVertical: 12,
    borderRadius: 4,
  },
  // Comisiones
  comisionCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E91E8C',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  comisionCardMixta: {
    backgroundColor: '#fff5fa',
  },
  comisionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 6,
  },
  comisionValor: {
    fontSize: 38,
    fontWeight: '900',
    color: '#E91E8C',
    lineHeight: 44,
  },
  comisionMas: {
    fontSize: 22,
    fontWeight: '700',
    color: '#999',
    marginVertical: 2,
  },
  comisionExtra: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E91E8C',
    lineHeight: 34,
  },
  comisionDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  // Footer
  footer: {
    backgroundColor: '#212529',
    padding: 25,
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 20,
  },
  footerBrand: {
    color: '#E91E8C',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerText: {
    color: '#adb5bd',
    fontSize: 11,
    textAlign: 'center',
  },
});

TUU Demo
🎯 Objetivos
Permitir a integradores una aplicación que hace uso de la integración entre aplicaciones para invocar la aplicación de Pagos con sus diferentes parámetros, así como la respuesta que la misma emitirá hacia la aplicación de origen.
Posibilitar a integradores la customización total de los parámetros de entrada a la hora de hacer un pago en la aplicación de Pagos.
Posibilitar a integradores la opción de simular errores conocidos que se pueden dar en la aplicación de Pagos según ciertos parámetros de entrada.
Posibilitar a integradores la opción de probar la funcionalidad de impresión del terminal POS a través de la aplicación.

🔨 Recursos
Enlaces directos
A continuación encontrarás los enlaces para descargar las APKs y acceder a los proyectos correspondientes:


Sunmi (Compatible con dispositivo Pro, SE y Mini)

Descargar APK de Sunmi

Acceder al proyecto Sunmi

Kozen (Compatible con dispositivo Pro 2)

Descargar APK de Kozen

Acceder al proyecto Kozen


💰 Sección Pagar
Simular Pago
Permite simular un pago con los siguientes parámetros preestablecidos.

json

{
	"amount": 200,
	"tip": 200,
	"cashback": 0,
	"method": 0,
	"installmentsQuantity": 0,
	"printVoucherOnApp": true,
	"dteType": 48,
	"extraData": {
    	"taxIdnValidation": "76539108-3",
    	"exemptAmount": 0,
    	"netAmount": 400,
    	"sourceName": "Tuu Demo",
    	"sourceVersion": "1.1.1",
    	"customFields": [
      	{
       		"name": "prueba0",
         	"value": "prueba0",
         	"print": true,  
        }
        {
       		"name": "prueba2",
         	"value": "prueba2",
         	"print": true,  
        }
      ]
	}
}
JSON con parámetros de entrada que recibe la aplicación de Pagos mediante Simular Pago.

Al presionar el botón simular pago, se redirige automáticamente a la vista de selección de método de pago, con documento “Comprobante afecto”. Al continuar con el flujo de venta dentro de la App Pagos y completarla, al regresar a TUU Demo se ve un JSON con los parámetros de salida asociados a la venta. En caso de cancelar la venta, o algún error interno en la aplicación, se mostrará también un JSON con la información del error.


Mensaje de confirmación para Pago exitoso


Mensaje de confirmación para transacción cancelada.

Customizar pago
Esta sección permite customizar los parámetros de entrada que se desean enviar a la aplicación de Pagos.

Parámetros customizables:

Monto: Monto de la transacción usado para cobrar al tarjeta habiente. CAMPO REQUERIDO.

Propina: Monto de la propina asociada a la transacción. Posibles selecciones:

“Solicitar en App Pago”. (Selección por defecto).
“Ingresar propina”: Permite ingresar un valor
“No utilizar”: Directamente para no utilizar
NOTA: Campo sujeto a las configuraciones del terminal.
Cashback: Monto del vuelto asociado a la transacción. Posibles selecciones:

“Solicitar en App Pago”. (Selección por defecto).
“Ingresar propina”: Permite ingresar un valor
“No utilizar”: Directamente para no utilizar
NOTA: Campo sujeto a las configuraciones del terminal.
Método de pago: Define el método de pago de la transacción. Posibles selecciones:

“Solicitar en App Pago”. (Selección por defecto).
“Crédito”: Inicia la venta con Tarjeta de Crédito.
“Débito”: Inicia la venta con Tarjeta de Débito.
NOTA: Campo sujeto a métodos de pago habilitados en el terminal.
Cuotas: Cantidad de cuotas de la transacción. Solo disponible para ventas con Crédito. Posibles selecciones:

“Solicitar en App Pago”. (Selección por defecto).
“Ingresar cuotas”: Permite ingresar un valor.
“No utilizar”: Directamente para no utilizar.
NOTA: Campo sujeto a configuraciones del terminal, si tiene habilitadas cuotas.
Voucher: Indica si el voucher será impreso a través de la app de Pago o por la aplicación que hizo la invocación.

Nota: Campo sujeto a la configuración del Terminal; solo se imprime si está habilitada la opción.

Tipo de DTE: Representa el tipo de documento electrónico tributario (DTE) asociado a la transacción. Posibles selecciones: Boleta y factura afecta, documento exento, desconocido y no válido.

Rut Comercio: Representa el RUT del comercio que será validado con el registrado por sistema. El campo puede enviarse vacío, pero si se agrega debe corresponder al RUT del comercio asociado al POS.

Monto Exento: Corresponde al monto exento de la venta que será usado para informar al SII.

Monto Neto: Monto de la transacción(incluyendo IVA) que será informado al SII.

Nombre de app integradora: Representa el nombre de la app integradora.

Versión de app integradora: Representa la versión de la app integradora.

Al presionar “Agregar Campo Personalizado” se despliega la sección de custom fields que permite agregar hasta 5 máximos con los campos: Nombre, valor y selección de si se quiere imprimir en el Voucher estos valores.




Sección customizar pago en TUU DEMO.


Sección de campos personalizados.

Manejo de errores
Esta sección permite simular cuando exista algún error específicamente referente a la validación de los parámetros de entrada.

Al ingresar a la sección “Manejo de errores”, se despliega un menú con botones que permiten replicar todos los errores conocidos que se producen por ingreso de valores en parámetros de entrada.

Los errores posibles de simular son los siguientes:

Valor de método de pago no válido: Se produce cuando el método de pago recibido en la aplicación no tiene un valor válido.
Cuotas no soportadas en Débito: Se produce si se ingresan cuotas al seleccionar Débito como método de pago.
Vuelto no soportado en Crédito: Se produce al ingresar vuelto cuando se selecciona Crédito ****como método de pago.
Monto no válido o vacío: Se produce al ingresar un valor de 0 en el Monto.
Monto excede el máximo permitido: Se produce al ingresar un valor de más de 8 dígitos en Monto.
Atributo faltante en el JSON: Se produce en caso de que algún atributo no haya sido añadido en el JSON.
Valor de DTE no válido: En caso de que Tipo de DTE traiga un valor que no está registrado como un tipo válido.
RUT no coincide con el RUT de comercio: Se produce al enviar un RUT que no coincide con el utilizado para habilitar la aplicación de Pagos
No se declaran los custom fields: Si no declara en CustomFields “name” o “value“.
Custom fields exceden el largo permitido: Si supera el máximo número de caracteres por cada CustomField.
Custom fields tienen caracteres no válidos: Si se incluye los caracteres reservados “&“ y “/“ en algún CustomField.


Menú de errores conocidos posibles de simular.

Al presionar un botón para simular un error se completa automáticamente el formulario con los parámetros que permiten el error y se envía directamente a Pagos mostrando el mensaje con el error, que al cerrarlo permite ver el formulario con los parámetros que se ingresaron para permitir el error. Como se muestra a continuación.


Ejemplo de mensaje de error al simular “Cuotas no soportadas en Débito”.


Customización del pago bajo la simulación “Cuotas no soportadas en Débito”.


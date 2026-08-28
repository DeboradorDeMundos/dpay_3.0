ntegración entre aplicaciones
En el siguiente documento se especifica la integración entre aplicaciones móviles, que permite que una aplicación externa invoque la aplicación TUU Negocio con parámetros específicos. Es imprescindible contar con un terminal POS configurado y habilitado para procesar las transacciones solicitadas por la integración. A continuación, se describe el proceso en detalle según el diagrama:

Diagrama alto nivel de la integración

👍
Antes de comenzar
Para realizar pruebas debes contar con un terminal TUU, ya que la aplicación de Pagos está certificada para operar solo sobre ese modelo en específico.
Consideración importante, el nombre del package en develop es diferente al de producción: com.haulmer.paymentapp.dev y com.haulmer.paymentapp -> separar bien
Recursos necesarios para Integración
Para integrar tu App con TUU Negocio y ejecutar transacciones en un POS, necesitas contar con el hardware y el software adecuados, además de un entorno de prueba correctamente aprovisionado. A continuación encontrarás los instaladores DEV por fabricante (Sunmi / Kozen).

Sunmi (Compatible con dispositivo Pro, SE y Mini)

Descargar última versión DEV compatible para Sunmi

Kozen (Compatible con dispositivo Pro 2)

Descargar última versión DEV compatible para Kozen

Fases del proceso de integración mediante Inter-apps
Fase 1 — Invocación desde la App Integradora
La aplicación externa construye un Intent dirigido explícitamente a la package name de pagos de TUU Negocio. Señalar la package name.

Dentro del Intent se incluye un JSON bajo la clave paymentData que contiene todos los parámetros de la transacción (amount, method, installmentsQuantity, dteType, extraData, etc.).
El lanzamiento de la actividad se hace usando la Activity Result API, de modo que la App Integradora pueda recibir una respuesta estructurada al finalizar el flujo.
En este punto, la App Integradora define un callback que recibirá el resultado cuando TUU Negocio termine de procesar.
Dependiendo la implementación usada, así como librerías y uso de Android nativo, varía la forma de invocación y recepción (Android). A continuación se presenta una forma de hacerlo:

Registrar el "Launcher" y el "Callback":

En la Activity o Fragment, se registra un ActivityResultLauncher. Este launcher se encarga de iniciar la app TUU Negocio y define el callback (la función) que se ejecutará cuando TUU Negocio devuelva un resultado.

Java


// 1. Registrar el "launcher" (hacer esto en la inicialización de la Activity/Fragment)
private final ActivityResultLauncher<Intent> paymentLauncher = registerForActivityResult(
    new ActivityResultContracts.StartActivityForResult(),
    new ActivityResultCallback<ActivityResult>() {
        @Override
        public void onActivityResult(ActivityResult result) {
            // 4. El callback se dispara aquí cuando TUU Negocio retorno
            if (result.getResultCode() == Activity.RESULT_OK) {
                Intent data = result.getData();
                if (data != null && data.hasExtra("transactionResult")) {
                    String resultJson = data.getStringExtra("transactionResult");
                    Log.d("AppIntegradora", "Resultado OK: " + resultJson);
                    // TODO: Procesar JSON de éxito
                }
            } else if (result.getResultCode() == Activity.RESULT_CANCELED) {
                Intent data = result.getData();
                if (data != null && data.hasExtra("transactionResult")) {
                    String errorJson = data.getStringExtra("transactionResult");
                    Log.e("AppIntegradora", "Error: " + errorJson);
                    // TODO: Procesar JSON de error
                } else {
                    Log.w("AppIntegradora", "Operación cancelada por el usuario.");
                }
            }
        }
    });
Construir y lanzar el Intent

Se crea un método para construir el Intent y lanzarlo usando el launcher que acabas de registrar.

Java

/**
 * Inicia el flujo de pago en la app TUU Negocio.
 * @param request Objeto (DTO) que contiene los datos de pago, 
 * serializable a JSON.
 */
public void sendPaymentIntent(Request request) {
    if (isFinishing() || isDestroyed()) {
        Log.d("AppConstants.TAG", "La actividad está finalizando. No se puede enviar el intent.");
        return;
    }

    PackageManager packageManager = getPackageManager();
    if (null == packageManager) {
        Log.d("AppConstants.TAG", "PackageManager no disponible.");
        return;
    }

    // Usar el package name de DEV o PROD según corresponda
    final String TUU_PACKAGE_NAME = "com.haulmer.paymentapp.dev"; // o "com.haulmer.paymentapp"
    Intent sendIntent = packageManager.getLaunchIntentForPackage(TUU_PACKAGE_NAME);
    
    if (null == sendIntent) {
        Log.d("AppConstants.TAG", "App TUU Negocio no encontrada: " + TUU_PACKAGE_NAME);
        // TODO: Informar al usuario (ej. "Por favor, instale la app de pagos")
        return;
    }

    // 1. setAction(Intent.ACTION_SEND): 
    //    Define la acción estándar para "enviar" datos.
    sendIntent.setAction(Intent.ACTION_SEND);

    // 2. setFlags(0): 
    //    Indica que no se usan flags especiales (como FLAG_ACTIVITY_NEW_TASK).
    //    Esto es crucial para que el resultado vuelva correctamente.
    sendIntent.setFlags(0);

    try {
        // 3. putExtra(Intent.EXTRA_TEXT, ...):
        //    Añade el payload de la transacción (tu objeto Request serializado a JSON)
        //    bajo la clave estándar EXTRA_TEXT.
        sendIntent.putExtra(Intent.EXTRA_TEXT, objectMapper.writeValueAsString(request));
    } catch (JsonProcessingException e) {
        Log.d("AppConstants.TAG", "Problemas en la construcción del JSON: " + e.getMessage());
        return;
    }

    // Define el tipo de dato que estás enviando
    sendIntent.setType("text/json");

    // 4. paymentLauncher.launch(sendIntent):
    //    Inicia la app TUU Negocio y le pasa el Intent.
    //    El sistema ahora espera que TUU Negocio retorne un resultado,
    //    que será capturado por el callback del 'paymentLauncher'.
    paymentLauncher.launch(sendIntent);
}
Ejemplo de JSON enviado en el paymentData

JSON

{
   "amount":10000,
   "tip":0,
   "cashback":0,
   "method":2,
   "installmentsQuantity":5,
   "printVoucherOnApp":true,
   "dteType":48,
   "extraData":{
      "taxIdnValidation":"8886274-2",
      "exemptAmount":9000,
      "netAmount":1000,
      "sourceName":"Nombre App Integradora",
      "sourceVersion":"2023.01.20-6",
      "customFields":[
         {
            "name":"nombre",
            "value":"valor",
            "print":true
         }
      ]
   }
}
Parámetro	Descripción	Validación de dato
📌 Parámetros principales
amount	Monto de la transacción que será usado para cobrar al tarjeta habiente en la app de Pago.

amount = netAmount + exemptAmount

Nota: No incluye tip ni cashback.	Entero > 0, máximo 12 dígitos.
tip	Monto de la propina asociada a la transacción.

Opciones:
• -1 → no utilizado
• 0 → solicitar en app de Pago
• >0 → valor definido

Si se usa >0, se procesará ignorando la configuración del dispositivo.	-1, 0 o entero > 0. Máximo 12 dígitos.
cashback	Monto del vuelto de la transacción.
* Solo aplica a ventas en débito *

Opciones:
• -1 → no utilizado
• 0 → solicitar en app de Pago
• >0 → valor definido	-1, 0 o entero > 0. Máximo 12 dígitos.
method	Define el método de pago.

Opciones:
• 0 → Solicitar en APP Pago
• 1 → Credito
• 2 → Débito	0, 1 o 2.
installmentsQuantity	Número de cuotas de la transacción.
* Solo aplica a ventas en débito *	0, 1 o entero > 0.
printVoucherOnApp	Define si el voucher será impreso en la app de Pago o en la app integradora.

Opciones:
• true → app de Pago
• false → app integradora	true o false.
dteType	Tipo de documento tributario electrónico (DTE).

Opciones: 0, 33, 34, 44, 48, 99	Uno de los valores definidos.
📌 Parámetros dentro de extraData
taxIdnValidation	RUT del comercio validado con el POS.
Puede enviarse vacío, pero si se envía debe coincidir con el registrado.	Vacío o formato RUT (11111111-1).
exemptAmount	Monto exento de la venta, usado para informar al SII.	Entero ≥ 0, máx. 12 dígitos.
netAmount	Monto afecto (incluye IVA), usado para informar al SII.	Entero ≥ 0, máx. 12 dígitos.
sourceName	Nombre de la app integradora.	Texto alfanumérico, máx. 50 caracteres.
sourceVersion	Versión de la app integradora.	Texto alfanumérico, máx. 20 caracteres.
customFields	Lista de campos personalizados enviados por la app integradora.

Cada elemento es un objeto con los siguientes atributos:
• name: nombre del campo.
• value: valor asociado.
• print: indica si se imprime en el voucher.	Lista de objetos (ver detalle).
📌 Estructura de customFields
name	Nombre del campo personalizado.	Texto alfanumérico, máx. 50 caracteres.
value	Valor del campo personalizado.	Texto alfanumérico, máx. 200 caracteres.
print	Indica si este campo debe imprimirse en el voucher.	true o false.
Fase 2 — Procesamiento en TUU Negocio y en el POS
Cuando TUU Negocio recibe el Intent:

Lectura de parámetros

Extrae el paymentData y lo deserializa desde JSON.
Validaciones iniciales

Revisa que los atributos cumplan con el contrato, (validación del dato, explicar de otra forma) (ejemplo: amount > 0, method ∈ {0,1,2}, cashback solo permitido si method=2, longitudes de customFields, etc.).
Interacción con el POS

Muestra interfaz al usuario final para seleccionar método de pago, insertar tarjeta, ingresar PIN, etc.
img1img2img3
Comunicación con sistema transaccional
TUU Negocio se conecta al sistema transaccional, enviando los datos validados para que el servidor procese y confirme la transacción.
❌ En caso de errores de validación o de entorno (ejemplo: terminal no configurado, SDK desactualizado, parámetros inválidos), TUU Negocio prepara un JSON de error con errorCode / errorMessage.

Fase 3 — Generación y devolución del resultado
Una vez procesada la transacción:

TUU Negocio construye un Intent de respuesta, donde añade un JSON en el extra transactionResult.

Este JSON contiene los campos de salida principales:

transactionStatus (true/false)
sequenceNumber (identificador único de 12 dígitos)
printerVoucherCommerce (si el voucher se imprimió automáticamente en el POS)
transactionTip, transactionCashback (si aplican)
extraData (eco de lo enviado, para trazabilidad).
JSON

{
   "transactionStatus":true,
   "sequenceNumber":"000000004719",
   "printerVoucherCommerce":true,
   "transactionTip":,
   "extraData":{
      "taxIdnValidation":"8886274-2",
      "exemptAmount":9000,
      "netAmount":1000,
      "sourceName":"Nombre App Integradora",
      "sourceVersion":"2023.01.20-6",
      "customFields":[
         {
            "name":"nombre",
            "value":"valor",
            "print":true
         }
      ]
   }
}
Campo	Descripción
transactionStatus	Informa sobre el estado de la transacción. Sus posibles valores son true si es que la transacción termino correctamente o false en caso contrario.
sequenceNumber	Correspondiente al número único de la transacción el cual sirve como identificador. Su posible valor es una cadena de texto representando un número de 12 dígitos.
printerVoucherCommerce	Indica si la opción de impresión automática del comprobante para el comercio dentro del dispositivo está activa. Sus posible valores son true si esta configurado que se imprima automáticamente el voucher de comercio, false si no está configurado.
extraData	Retorna el objeto completo extraData ingresado como parámetros de entrada.
transactionTip	Retorna la propina
transactionCashback	Retorna el vuelto, esto es dependiente del valor printVoucherOnApp
❌ En caso de que exista un fallo en la transacción, se devuelve el control directamente a la app integradora

Fase 4 — Manejo del resultado en la App Integradora
El control regresa a la aplicación externa. La aplicación TUU Negocio utiliza internamente el método setResult() para finalizar su flujo y devolver los datos.

Uso de setResult()
A través del uso de setResult(), método del ciclo de vida de una Activity en Android. Se permite que una actividad —en este caso, TUU Negocio— envíe un resultado de vuelta a la actividad que la invocó —tu App Integradora.
El método recibe dos parámetros:
Código de resultado:
Activity.RESULT_OK → Indica que el flujo se completó correctamente (transacción procesada).
Activity.RESULT_CANCELED → Indica que el flujo se canceló o se produjo un error.
Intent de respuesta:
Este Intent contiene el String JSON bajo la clave "transactionResult", que encapsula el resultado o el error de la transacción.
Recepción del Callback
El callback del ActivityResultLauncher registrado en la Fase 1 se dispara automáticamente al recibir el resultado. El objeto ActivityResult que recibe tu callback incluye tanto el resultCode (el código de resultado) como el Intent con los datos retornados por TUU Negocio.
Verificación del resultCode
La aplicación integradora debe analizar el código de resultado y procesar el contenido del Intent según corresponda.
RESULT_OK
La transacción fue procesada (exitosa o rechazada por el banco, pero el flujo se completó correctamente).
El Intent contendrá el JSON bajo "transactionResult", con los campos de salida principales:
transactionStatus
sequenceNumber
printerVoucherCommerce
transactionTip
transactionCashback
extraData
Tu aplicación debe leer el JSON, interpretar los valores y registrar la venta o mostrar la confirmación al usuario.
RESULT_CANCELED
El flujo se interrumpió antes de finalizar.
Posibles causas:
El usuario presionó “Atrás”.
Error de validación (por ejemplo, amount inválido).
Error de configuración del terminal o SDK.
En este caso, el Intent contendrá un JSON de error en "transactionResult" con:
errorCode
errorMessage
img1img2
Manejo del Voucher
El comportamiento de impresión depende del valor del parámetro printVoucherOnApp enviado en la Fase 1:
true → El voucher fue impreso directamente por TUU Negocio (en el POS).

false → Tu aplicación integradora debe encargarse de la impresión o presentación del comprobante.

Manejo de errores
Errores pre-transaccionales
Cuando exista algún error, ya sea con la validación de los parámetros de entrada o del lado del servidor, se retornará un JSON con la siguiente estructura a la app.

JSON

{
	"errorCode": 1,
	"errorMessage": "La app de pago no soporta propina de acuerdo a sus configuraciones.",
	"errorCodeOnApp": 500,
	"errorMessageOnApp": "Internal Server Error"
}
Tabla de errores conocidos (errorCode)
Código	Mensaje	Descripción
1	La app de Pago no soporta propina de acuerdo a sus configuraciones.	
2	La app de Pago no soporta vuelto de acuerdo a sus configuraciones.	Si el JSON recibido tiene un valor mayor a 0 en el atributo cashback y el Terminal tiene desactivada la opción de vuelto en su configuración establecida en su espacio de trabajo.
3	El método de pago no esta definido en las configuraciones.	El atributo method del JSON recibido en la aplicación no tiene un valor válido.
4	El dispositivo no admite cuotas en este tipo de transacción.	Si installmentsQuantity tiene un valor superior a -1 cuando el método seleccionado no sea crédito.
5	El dispositivo no admite vuelto en este tipo de transacción.	Cuando cashback tenga un valor superior a -1 y el método de transacción elegido no sea débito.
6	El monto no fue especificado.	En caso que el atributo amount tenga un valor inferior a 0 en el JSON recibido o no viene especificado.
7	El monto excede el máximo permitido.	En caso de que el atributo amount tenga un valor superior al límite establecido en las configuraciones del Terminal.
8	No todos los atributos requeridos están presentes.	En caso de que algún atributo no haya sido añadido en el JSON.
9	Error en proceso de pago.	Error ocurrido durante el proceso de pago en la aplicación.
10	La transacción fue cancelada.	En caso de que durante el proceso de la transacción esta haya sido cancelada por el usuario.
11	El Terminal no esta correctamente configurado.	El Terminal aun no ha sido correctamente configurado, esto puede deberse a que aún no ha sido agregado y activado en el espacio de trabajo del usuario, o que el dispositivo no haya sido aprobado desde Backoffice para su uso, o que el dispositivo haya sido previamente deshabilitado.
12	El dispositivo esta aprobado pero no se han cargado las llaves, favor de abrir la aplicación de pago realizar la inyección de llaves.	El Terminal fue aprobado a través de los ejecutivos de Back Office, sin embargo aún no ha podido descargar y almacenar los certificados y llaves necesarias para su correcto funcionamiento. Es necesario abrir la aplicación para que se lleve a cabo este procedimiento y posteriormente poder hacer uso de la aplicación.
13	El dispositivo no admite un moto de más de 12 dígitos.	El atributo amount que fue enviado excede el límite de 12 dígitos establecido para el correcto funcionamiento de la aplicación.
14	El dispositivo no esta conectado a internet.	El Terminal actualmente no esta conectado a alguna red o la red a la cual esta conectado no presenta salida a internet, por lo tanto no es posible cargar las configuraciones.
15	El dispositivo no pudo obtener la configuración desde su cuenta.	El Terminal está conectado a internet, sin embargo no se pudo establecer conexión con la cuenta de pago correctamente.
16	El rubro esta en espera de asignación, prontamente podrá ser utilizado.	El canal de pago asociado al POS aun espera su asignación.
17	El rubro utilizado tuvo un error durante la asignación.	El canal de pago asociado al Terminal experimentó algún error durante su asignación.
18	El tipo de documento electrónico no esta definido en las configuraciones.	En caso de que el atributo dteType traiga un valor que no esta registrado como un tipo válido.
19	El RUT indicado no coincide con el utilizado.	Ocurre cuando se envía un RUT en el campo de validación y este no coincide con el utilizado para habilitar la aplicación de Pagos.
20	El SDK de Pagos no se encuentra instalado.	Ocurre cuando el SDK “SunmiPayHardwareService“ no esta instalado o en su defecto no cuenta con una versión igual o superior a 3.3.96.
21	La aplicación de Pago necesita ser actualizada.	Ocurre cuando la aplicación de pagos rechaza el intent ya que necesita ser actualizada.
I-01	Problemas al procesar campos requeridos.	Si no declara en cada uno de sus customFields “name” o “value“.
I-02	Los campos superan el máximo de caracteres.	Si supera el máximo numero de caracteres por cada Customfield.
I-03	Formato no valido. Posee carácteres reservados del sistema.	Si se incluye los caracteres reservados “&“ y “/“, en alguno de sus Customfield.
I-04	Los campos ingresados no son validos.	Si se ingresan caracteres en blanco tanto como en el "name" o "value".

Tabla de errores conocidos (errorCodeOnApp (Opcionales))
Código	Mensaje INTERAPP	Causa
ICE-8	No todos los atributos requeridos están presentes.	No todos los atributos requeridos están presente en el JSON recibido para realizar la transacción.
ICE-10	La transacción fue cancelada.	El flujo de pago ha sido cancelado.
ICE-12	El dispositivo esta aprobado pero presenta problemas en las credenciales. Favor vuelve a ingresar a la aplicación de pago.	Las llaves no se encuentran inyectadas en el dispositivo.
ICE-14	El dispositivo no esta conectado a internet.	Dispositivo sin conexión a internet.
ICE-20	El SDK de pagos no se encuentra instalado.	SDK de pagos no instalado.
ICE-21	La app de pago necesita ser actualizada.	La App necesita ser actualizada (no se puede posponer más).
ICE-23	Error personalizado según el caso.	Error en el formato de los campos personalizados.
ICE-25	El dispositivo no puede iniciar la aplicación sin los permisos.	App requiere acceso a los permisos.
ICE-30	El dispositivo está a la espera de verificación. El proceso puede tomar hasta 48 horas hábiles.	Dispositivo en estado de verificación.
ICE-31	El dispositivo está a la espera de asignación de rubro. El proceso puede tomar hasta 24 horas hábiles.	Dispositivo en estado preactivo, a la espera de la asignación de rubro.
ICE-32	El dispositivo ha sido suspendido.	Dispositivo en estado suspendido.
ICE-33	El dispositivo ha sido desactivado, no será posible volver a utilizar.	Dispositivo en estado desactivado.
ICE-34	El dispositivo no está registrado en el stock.	Dispositivo no existe en el stock.
ICE-35	El dispositivo no se encuentra registrado.	Dispositivo no se encuentra registrado.
ICE-37	No se pudo verificar si el dispositivo se encuentra activo.	Problemas al obtener el estado del dispositivo desde el paymentAccount.
ICE-43	No se pudo verificar el estado de inyección del dispositivo.	Problemas al obtener el estado del dispositivo desde el kdh (aprobado e inyectado).
ICE-44	No se pudo recuperar la información del flujo de transacción.	Problemas de memoria en caché en el dispositivo.
ICE-45	Configuración de pagos corrupta. Contáctate con soporte (KEYS).	Las llaves se encuentran corruptas.
ICE-46	Configuración de pagos corrupta (IPEK NULL).	La IPEK se encuentra corrupta.
ICE-47	El dispositivo no esta configurado para procesar pagos (NO PREF).	Dispositivo no posee las configuraciones internas (preferences) para procesar pagos.
ICE-48	Error personalizado según el caso.	Error en el formato del JSON recibido para realizar la transacción.
ICE-49	Problemas en el formato del JSON recibido.	Problemas en el formato del JSON recibido para realizar la transacción.
ICE-50	El dispositivo no se encuentra aprobado para recibir pagos.	Dispositivo no se encuentra aprobado para realizar pagos.
ICE-60	Ha ocurrido un error al iniciar la aplicación, vuelva a intentarlo.	Problemas en al lanzar el launcher.
ICE-61	Ha ocurrido un error al iniciar los servicios de la aplicación, vuelva a intentarlo.	Problemas al inicializar los servicios necesarios para utilizar correctamente el dispositivo.
Errores post-transaccionales
Listado de errores se encuentra disponible en Errores Post-Transaccionales
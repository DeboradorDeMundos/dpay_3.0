package com.dtemitepos;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Log;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Módulo nativo para integración con Tuu Pagos
 * Maneja la comunicación inter-app con TUU Negocio mediante Intents
 */
@ReactModule(name = "TuuPaymentModule")
public class TuuPaymentModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final String TAG = "TuuPaymentModule";
    // Tuu PAGO-DEV para pruebas (com.haulmer.paymentapp.dev - requiere activación DEV)
    private static final String TUU_PACKAGE_DEV = "com.haulmer.paymentapp.dev";
    // Tuu PAGO Producción (com.haulmer.paymentapp - requiere activación PROD)
    private static final String TUU_PACKAGE_PROD = "com.haulmer.paymentapp";
    
    private Promise pendingPromise;
    private static final int TUU_PAYMENT_REQUEST = 9001;

    public TuuPaymentModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
        Log.d(TAG, "🚀 TuuPaymentModule inicializado correctamente");
    }

    @Override
    public String getName() {
        return "TuuPaymentModule";
    }

    /**
     * Verifica si la app Tuu está instalada
     * Método robusto que verifica la existencia del package directamente
     * @param isDev - true para verificar versión DEV, false para PROD
     * @param promise - Promise que resuelve true/false
     */
    @ReactMethod
    public void isTuuAppInstalled(boolean isDev, Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity == null) {
                promise.reject("ERROR", "Activity no disponible");
                return;
            }

            PackageManager pm = activity.getPackageManager();
            if (pm == null) {
                Log.e(TAG, "PackageManager no disponible");
                promise.reject("ERROR", "PackageManager no disponible");
                return;
            }

            String packageName = isDev ? TUU_PACKAGE_DEV : TUU_PACKAGE_PROD;
            
            Log.d(TAG, "🔍 Verificando package: " + packageName + " (isDev=" + isDev + ")");
            
            // Método simple y directo: verificar si el paquete existe
            boolean isInstalled = false;
            try {
                pm.getPackageInfo(packageName, 0);
                isInstalled = true;
                Log.d(TAG, "✅ Package ENCONTRADO: " + packageName);
            } catch (PackageManager.NameNotFoundException e) {
                Log.w(TAG, "❌ Package NO encontrado: " + packageName);
            }
            
            promise.resolve(isInstalled);
        } catch (Exception e) {
            Log.e(TAG, "❌ Error verificando app Tuu", e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Inicia el flujo de pago con Tuu siguiendo documentación Haulmer (Fase 1)
     * @param paymentData - Datos del pago (amount, method, dteType, etc.)
     * @param isDev - true para usar versión DEV, false para PROD
     * @param promise - Promise que resuelve con el resultado de la transacción
     */
    @ReactMethod
    public void startPayment(ReadableMap paymentData, boolean isDev, Promise promise) {
        Log.d(TAG, "🔥🔥🔥 startPayment LLAMADO - isDev=" + isDev);
        Activity activity = getCurrentActivity();
        if (activity == null) {
            Log.e(TAG, "❌ Activity es NULL");
            promise.reject("ERROR", "Activity no disponible");
            return;
        }
        Log.d(TAG, "✅ Activity obtenida: " + activity.getClass().getName());

        if (pendingPromise != null) {
            promise.reject("ERROR", "Ya hay una transacción en proceso");
            return;
        }

        try {
            PackageManager pm = activity.getPackageManager();
            if (pm == null) {
                promise.reject("ERROR", "PackageManager no disponible");
                return;
            }

            String packageName = isDev ? TUU_PACKAGE_DEV : TUU_PACKAGE_PROD;
            
            Log.d(TAG, "🚀 Iniciando pago con package: " + packageName + " (isDev=" + isDev + ")");
            
            // Usar getLaunchIntentForPackage() según documentación oficial Tuu
            Intent sendIntent = pm.getLaunchIntentForPackage(packageName);
            
            if (sendIntent == null) {
                Log.e(TAG, "❌ App Tuu no encontrada: " + packageName);
                promise.reject("TUU_NOT_INSTALLED", "App Tuu no encontrada: " + packageName);
                return;
            }

            // Configurar Intent según documentación Tuu
            // 1. setAction(Intent.ACTION_SEND)
            sendIntent.setAction(Intent.ACTION_SEND);
            
            // 2. setFlags(0) - CRÍTICO para que funcione startActivityForResult
            sendIntent.setFlags(0);
            
            // 3. Convertir ReadableMap a JSON String
            String jsonPayload = convertMapToJson(paymentData);
            
            // 4. putExtra(Intent.EXTRA_TEXT, JSON) - payload bajo EXTRA_TEXT
            sendIntent.putExtra(Intent.EXTRA_TEXT, jsonPayload);
            
            // 5. setType("text/json")
            sendIntent.setType("text/json");

            Log.d(TAG, "📦 Payload enviado: " + jsonPayload);

            pendingPromise = promise;
            Log.d(TAG, "🚀🚀🚀 Llamando startActivityForResult con requestCode=" + TUU_PAYMENT_REQUEST);
            activity.startActivityForResult(sendIntent, TUU_PAYMENT_REQUEST);
            Log.d(TAG, "✅ startActivityForResult ejecutado");

        } catch (Exception e) {
            Log.e(TAG, "❌ Error iniciando pago Tuu", e);
            promise.reject("ERROR", e.getMessage());
            pendingPromise = null;
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        Log.d(TAG, "🔥🔥🔥 onActivityResult LLAMADO - requestCode=" + requestCode + ", resultCode=" + resultCode + ", hasData=" + (data != null));
        
        if (requestCode != TUU_PAYMENT_REQUEST) {
            Log.d(TAG, "❌ RequestCode no coincide: esperado=" + TUU_PAYMENT_REQUEST + ", recibido=" + requestCode);
            return;
        }

        if (pendingPromise == null) {
            Log.w(TAG, "Recibido resultado pero no hay promise pendiente");
            return;
        }

        try {
            // DEBUG: Imprimir TODOS los extras del Intent para saber qué devuelve Tuu
            if (data != null) {
                Log.d(TAG, "📋 Intent data recibido - analizando extras...");
                if (data.getExtras() != null) {
                    for (String key : data.getExtras().keySet()) {
                        Object value = data.getExtras().get(key);
                        Log.d(TAG, "  📌 Extra[" + key + "] = " + (value != null ? value.toString() : "null"));
                    }
                } else {
                    Log.w(TAG, "⚠️ Intent tiene data pero getExtras() es null");
                }
            } else {
                Log.w(TAG, "⚠️ Intent data es NULL");
            }
            
            if (resultCode == Activity.RESULT_OK) {
                // Transacción procesada (exitosa o rechazada)
                String resultJson = null;
                
                // Intentar múltiples claves que Tuu podría usar
                if (data != null) {
                    if (data.hasExtra("transactionResult")) {
                        resultJson = data.getStringExtra("transactionResult");
                        Log.d(TAG, "✅ Resultado encontrado en 'transactionResult': " + resultJson);
                    } else if (data.hasExtra("resultJson")) {
                        resultJson = data.getStringExtra("resultJson");
                        Log.d(TAG, "✅ Resultado encontrado en 'resultJson': " + resultJson);
                    } else if (data.hasExtra("result")) {
                        resultJson = data.getStringExtra("result");
                        Log.d(TAG, "✅ Resultado encontrado en 'result': " + resultJson);
                    } else if (data.hasExtra(Intent.EXTRA_TEXT)) {
                        resultJson = data.getStringExtra(Intent.EXTRA_TEXT);
                        Log.d(TAG, "✅ Resultado encontrado en 'EXTRA_TEXT': " + resultJson);
                    }
                }
                
                if (resultJson != null) {
                    Log.d(TAG, "🎉 Resultado Tuu OK: " + resultJson);
                    WritableMap result = convertJsonToMap(resultJson);
                    pendingPromise.resolve(result);
                } else {
                    Log.e(TAG, "❌ RESULT_OK pero no se encontró JSON en ninguna clave conocida");
                    pendingPromise.reject("ERROR", "No se recibieron datos de la transacción");
                }
            } else if (resultCode == Activity.RESULT_CANCELED) {
                // Transacción cancelada o error
                String errorJson = null;
                
                // Tuu puede enviar el error en 'transactionResult' o 'resultJson'
                if (data != null) {
                    if (data.hasExtra("transactionResult")) {
                        errorJson = data.getStringExtra("transactionResult");
                        Log.e(TAG, "❌ Error Tuu - transactionResult: " + errorJson);
                    } else if (data.hasExtra("resultJson")) {
                        errorJson = data.getStringExtra("resultJson");
                        Log.e(TAG, "❌ Error Tuu - resultJson: " + errorJson);
                    }
                }
                
                if (errorJson != null) {
                    // Pasar el JSON completo del error como string
                    // será parseado en JavaScript por parseTuuError()
                    Log.e(TAG, "❌ Error de Tuu: " + errorJson);
                    pendingPromise.reject("TUU_ERROR", errorJson);
                } else {
                    Log.w(TAG, "⚠️ Operación cancelada sin datos - posible timeout o app cerrada manualmente");
                    pendingPromise.reject("TUU_CANCELLED", "Operación cancelada por el usuario");
                }
            } else {
                pendingPromise.reject("ERROR", "Código de resultado desconocido: " + resultCode);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error procesando resultado Tuu", e);
            pendingPromise.reject("ERROR", e.getMessage());
        } finally {
            pendingPromise = null;
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        // No se requiere implementación
    }

    /**
     * Convierte un ReadableMap a String JSON
     */
    private String convertMapToJson(ReadableMap map) throws JSONException {
        JSONObject json = new JSONObject();
        
        if (map.hasKey("amount")) json.put("amount", map.getInt("amount"));
        if (map.hasKey("tip")) json.put("tip", map.getInt("tip"));
        if (map.hasKey("cashback")) json.put("cashback", map.getInt("cashback"));
        if (map.hasKey("method")) json.put("method", map.getInt("method"));
        if (map.hasKey("installmentsQuantity")) json.put("installmentsQuantity", map.getInt("installmentsQuantity"));
        if (map.hasKey("printVoucherOnApp")) json.put("printVoucherOnApp", map.getBoolean("printVoucherOnApp"));
        if (map.hasKey("dteType")) json.put("dteType", map.getInt("dteType"));
        
        if (map.hasKey("extraData")) {
            ReadableMap extraData = map.getMap("extraData");
            if (extraData != null) {
                JSONObject extraJson = new JSONObject();
                
                if (extraData.hasKey("taxIdnValidation")) 
                    extraJson.put("taxIdnValidation", extraData.getString("taxIdnValidation"));
                if (extraData.hasKey("exemptAmount")) 
                    extraJson.put("exemptAmount", extraData.getInt("exemptAmount"));
                if (extraData.hasKey("netAmount")) 
                    extraJson.put("netAmount", extraData.getInt("netAmount"));
                if (extraData.hasKey("sourceName")) 
                    extraJson.put("sourceName", extraData.getString("sourceName"));
                if (extraData.hasKey("sourceVersion")) 
                    extraJson.put("sourceVersion", extraData.getString("sourceVersion"));
                
                json.put("extraData", extraJson);
            }
        }
        
        return json.toString();
    }

    /**
     * Convierte un String JSON a WritableMap
     */
    private WritableMap convertJsonToMap(String jsonString) throws JSONException {
        JSONObject json = new JSONObject(jsonString);
        WritableMap map = Arguments.createMap();
        
        if (json.has("transactionStatus")) 
            map.putBoolean("transactionStatus", json.getBoolean("transactionStatus"));
        if (json.has("sequenceNumber")) 
            map.putString("sequenceNumber", json.getString("sequenceNumber"));
        if (json.has("printerVoucherCommerce")) 
            map.putBoolean("printerVoucherCommerce", json.getBoolean("printerVoucherCommerce"));
        if (json.has("transactionTip")) 
            map.putInt("transactionTip", json.optInt("transactionTip", 0));
        if (json.has("transactionCashback")) 
            map.putInt("transactionCashback", json.optInt("transactionCashback", 0));
        
        // Datos adicionales de la tarjeta (confirmados por TUU)
        if (json.has("authCode")) 
            map.putString("authCode", json.getString("authCode"));
        if (json.has("last4")) 
            map.putString("last4", json.getString("last4"));
        
        // Errores (errorCodeOnApp puede ser número o string "ICE-48" / "HP-05")
        if (json.has("errorCode")) {
            Object errorCode = json.get("errorCode");
            if (errorCode instanceof Number) {
                map.putInt("errorCode", ((Number) errorCode).intValue());
            } else {
                map.putString("errorCode", String.valueOf(errorCode));
            }
        }
        if (json.has("errorMessage"))
            map.putString("errorMessage", json.getString("errorMessage"));
        if (json.has("errorCodeOnApp")) {
            Object errorCodeOnApp = json.get("errorCodeOnApp");
            if (errorCodeOnApp instanceof Number) {
                map.putInt("errorCodeOnApp", ((Number) errorCodeOnApp).intValue());
            } else {
                map.putString("errorCodeOnApp", String.valueOf(errorCodeOnApp));
            }
        }
        if (json.has("errorMessageOnApp"))
            map.putString("errorMessageOnApp", json.getString("errorMessageOnApp"));
        
        return map;
    }
}

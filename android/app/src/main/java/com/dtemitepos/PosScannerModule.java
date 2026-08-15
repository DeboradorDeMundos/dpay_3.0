package com.dtemitepos;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.nio.charset.StandardCharsets;

/**
 * Escáner hardware POS (Xcheng/Kozen y otros) vía broadcast intent.
 * La cámara ML Kit no sustituye al láser integrado del terminal.
 */
public class PosScannerModule extends ReactContextBaseJavaModule {

    private static final String TAG = "PosScanner";
    private static final String EVENT_BARCODE = "PosScannerBarcode";

    private static final String[] SCAN_ACTIONS = {
        "com.xcheng.scanner.action.BARCODE_DECODING_BROADCAST",
        "com.android.decodewedge.decode_action",
        "com.sunmi.scanner.ACTION_DATA_CODE_RECEIVED",
        "com.zkc.scancode",
        "android.intent.action.DECODE",
        "nlscan.action.SCANNER_RESULT",
    };

    private static final String[] BARCODE_KEYS = {
        "EXTRA_BARCODE_DECODING_SYMBOL",
        "EXTRA_BARCODE_DECODING_DATA",
        "barcode_string",
        "barcode",
        "data",
        "code",
        "com.android.decode.data",
        "SCAN_BARCODE1",
        "scannerdata",
        "value",
    };

    private BroadcastReceiver scanReceiver;
    private boolean listening = false;

    public PosScannerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "PosScanner";
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Requerido por NativeEventEmitter en RN
    }

    @ReactMethod
    public void removeListeners(double count) {
        // Requerido por NativeEventEmitter en RN
    }

    @ReactMethod
    public void startListening() {
        if (listening) {
            return;
        }
        ReactApplicationContext ctx = getReactApplicationContext();
        scanReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent == null) {
                    return;
                }
                String code = extractBarcode(intent);
                if (code == null || code.isEmpty()) {
                    Log.w(TAG, "Broadcast sin código: " + intent.getAction());
                    return;
                }
                Log.d(TAG, "Código hardware: " + code + " action=" + intent.getAction());
                emitBarcode(code, intent.getAction() != null ? intent.getAction() : "unknown");
            }
        };

        IntentFilter filter = new IntentFilter();
        for (String action : SCAN_ACTIONS) {
            filter.addAction(action);
        }
        filter.addCategory(Intent.CATEGORY_DEFAULT);

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ctx.registerReceiver(scanReceiver, filter, Context.RECEIVER_EXPORTED);
            } else {
                ctx.registerReceiver(scanReceiver, filter);
            }
            listening = true;
            Log.d(TAG, "Escuchando broadcasts de escáner POS");
        } catch (Exception e) {
            Log.e(TAG, "No se pudo registrar receiver", e);
            scanReceiver = null;
            listening = false;
        }
    }

    @ReactMethod
    public void stopListening() {
        if (!listening || scanReceiver == null) {
            return;
        }
        try {
            getReactApplicationContext().unregisterReceiver(scanReceiver);
        } catch (Exception e) {
            Log.w(TAG, "unregisterReceiver", e);
        }
        scanReceiver = null;
        listening = false;
    }

    private void emitBarcode(String code, String action) {
        ReactApplicationContext ctx = getReactApplicationContext();
        if (!ctx.hasActiveCatalystInstance()) {
            return;
        }
        WritableMap params = Arguments.createMap();
        params.putString("code", code);
        params.putString("action", action);
        ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(EVENT_BARCODE, params);
    }

    private String extractBarcode(Intent intent) {
        if (intent.getExtras() == null) {
            return null;
        }

        for (String key : BARCODE_KEYS) {
            Object value = intent.getExtras().get(key);
            String parsed = stringifyExtra(value);
            if (parsed != null && !parsed.isEmpty()) {
                return parsed;
            }
        }

        // Fallback: primer extra string no vacío
        for (String key : intent.getExtras().keySet()) {
            Object value = intent.getExtras().get(key);
            String parsed = stringifyExtra(value);
            if (parsed != null && parsed.length() >= 2) {
                return parsed;
            }
        }
        return null;
    }

    private String stringifyExtra(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String) {
            return ((String) value).trim();
        }
        if (value instanceof byte[]) {
            return new String((byte[]) value, StandardCharsets.UTF_8).trim();
        }
        return String.valueOf(value).trim();
    }

    @Override
    public void invalidate() {
        stopListening();
        super.invalidate();
    }
}

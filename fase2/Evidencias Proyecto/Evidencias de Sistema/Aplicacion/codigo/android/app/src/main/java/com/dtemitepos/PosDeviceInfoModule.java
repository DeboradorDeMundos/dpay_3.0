package com.dtemitepos;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;

/**
 * Serial de hardware POS (Kozen/Xcheng/etc.).
 * Android 10+ bloquea getprop/Build.getSerial a apps normales; en Kozen se usa com.pos.sdk.
 */
public class PosDeviceInfoModule extends ReactContextBaseJavaModule {

    private static final String TAG = "PosDeviceInfo";
    private static final String[] SERIAL_PROPERTY_KEYS = {
        "ro.serialno",
        "ro.boot.serialno",
        "persist.sys.serialno",
        "ril.serialnumber",
        "sys.serialnumber",
        "gsm.serial",
        "gsm.sn1",
    };

    public PosDeviceInfoModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "PosDeviceInfo";
    }

    @ReactMethod
    public void getHardwareSerial(Promise promise) {
        try {
            WritableMap result = Arguments.createMap();
            String serial = resolveHardwareSerial();
            result.putString("serial", serial != null ? serial : "");
            result.putString("source", serial != null ? lastSource : "");
            Log.i(TAG, "getHardwareSerial => " + (serial != null ? serial : "(empty)") + " source=" + lastSource);
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "getHardwareSerial failed", e);
            promise.reject("POS_SERIAL_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Abre la tienda TUU/Xcheng en la ficha de la app.
     * MainActivity lee el query {@code linkAppPackage} (com.xcheng.store).
     */
    private static final String TUU_STORE_PACKAGE = "com.xcheng.store";
    private static final String TUU_MAIN_ACTIVITY = "com.xcheng.store.ui.MainActivity";
    private static final String TUU_STORE_DETAILS_URI_PREFIX =
        "tms://xcheng.appstore.app/details?linkAppPackage=";
    private static final int TUU_STORE_FLAGS =
        Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP;

    @ReactMethod
    public void openTuuAppStore(String appPackage, Promise promise) {
        ReactApplicationContext ctx = getReactApplicationContext();
        String pkg = (appPackage == null || appPackage.trim().isEmpty())
            ? "com.dtemitepos"
            : appPackage.trim();

        try {
            String uriStr = TUU_STORE_DETAILS_URI_PREFIX + pkg;

            if (tryStartStoreDetails(ctx, uriStr, "details")) {
                scheduleStoreDetailsRetry(ctx, uriStr);
                resolveStoreOk(promise, "details", uriStr);
                return;
            }

            Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(TUU_STORE_PACKAGE);
            if (launch != null) {
                launch.addFlags(TUU_STORE_FLAGS);
                ctx.startActivity(launch);
                resolveStoreOk(promise, "launcher", null);
                return;
            }

            Intent main = new Intent();
            main.setComponent(new ComponentName(TUU_STORE_PACKAGE, TUU_MAIN_ACTIVITY));
            main.addFlags(TUU_STORE_FLAGS);
            ctx.startActivity(main);
            resolveStoreOk(promise, "main_activity", null);
        } catch (ActivityNotFoundException e) {
            Log.e(TAG, "openTuuAppStore: store not found", e);
            promise.reject("STORE_NOT_FOUND", "No se encontró la tienda TUU en este equipo", e);
        } catch (Exception e) {
            Log.e(TAG, "openTuuAppStore failed", e);
            promise.reject("STORE_OPEN_ERROR", e.getMessage(), e);
        }
    }

    private static void scheduleStoreDetailsRetry(ReactApplicationContext ctx, String uriStr) {
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                tryStartStoreDetails(ctx, uriStr, "details_retry");
            } catch (Exception e) {
                Log.w(TAG, "openTuuAppStore retry failed: " + e.getMessage());
            }
        }, 2800);
    }

    private static boolean tryStartStoreDetails(
        ReactApplicationContext ctx,
        String uriStr,
        String logTag
    ) {
        Uri uri = Uri.parse(uriStr);
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.setComponent(new ComponentName(TUU_STORE_PACKAGE, TUU_MAIN_ACTIVITY));
        intent.addFlags(TUU_STORE_FLAGS);
        return tryStartActivity(ctx, intent, logTag + " uri=" + uriStr);
    }

    private static boolean tryStartActivity(ReactApplicationContext ctx, Intent intent, String logTag) {
        try {
            ctx.startActivity(intent);
            Log.i(TAG, "openTuuAppStore " + logTag + " OK");
            return true;
        } catch (ActivityNotFoundException e) {
            Log.w(TAG, "openTuuAppStore " + logTag + " not found");
            return false;
        } catch (Exception e) {
            Log.w(TAG, "openTuuAppStore " + logTag + " failed: " + e.getMessage());
            return false;
        }
    }

    private static void resolveStoreOk(Promise promise, String method, String uri) {
        WritableMap ok = Arguments.createMap();
        ok.putString("method", method);
        if (uri != null) {
            ok.putString("uri", uri);
        }
        promise.resolve(ok);
    }

    private String lastSource = "";

    private String resolveHardwareSerial() {
        lastSource = "";
        ReactApplicationContext ctx = getReactApplicationContext();

        // 1) SDK Kozen/Xcheng (com.pos.sdk.jar en /system/framework)
        String posSdkSerial = tryPosSdkSerial(ctx);
        if (isValidHardwareSerial(posSdkSerial)) {
            return posSdkSerial;
        }

        // 2) getprop shell
        for (String key : SERIAL_PROPERTY_KEYS) {
            String value = sanitizeSerial(getPropViaShell(key));
            logAttempt("shell:" + key, value);
            if (isValidHardwareSerial(value)) {
                lastSource = "shell:" + key;
                return value;
            }
        }

        // 3) SystemProperties
        for (String key : SERIAL_PROPERTY_KEYS) {
            String value = sanitizeSerial(getSystemProperty(key));
            logAttempt("sysprop:" + key, value);
            if (isValidHardwareSerial(value)) {
                lastSource = "sysprop:" + key;
                return value;
            }
        }

        // 4) Build.getSerial() con permiso
        boolean hasPhoneState = ContextCompat.checkSelfPermission(
            ctx, Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED;

        if (hasPhoneState && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                String buildSerial = sanitizeSerial(Build.getSerial());
                logAttempt("Build.getSerial()", buildSerial);
                if (isValidHardwareSerial(buildSerial)) {
                    lastSource = "Build.getSerial()";
                    return buildSerial;
                }
            } catch (SecurityException e) {
                Log.w(TAG, "Build.getSerial() denied: " + e.getMessage());
            }
        }

        String legacySerial = sanitizeSerial(Build.SERIAL);
        logAttempt("Build.SERIAL", legacySerial);
        if (isValidHardwareSerial(legacySerial)) {
            lastSource = "Build.SERIAL";
            return legacySerial;
        }

        Log.w(TAG, "No hardware serial found after all strategies");
        return null;
    }

    private String tryPosSdkSerial(Context context) {
        try {
            Class<?> mgrClz = Class.forName("com.pos.sdk.servicemanager.POIServiceManager");
            Object mgr = invokeFactory(mgrClz, context, "getDefault", "getInstance");
            if (mgr == null) {
                Log.w(TAG, "POIServiceManager instance is null");
                return null;
            }
            Log.i(TAG, "POIServiceManager OK: " + mgr.getClass().getName());

            Object security = invokeNoArg(mgr, "getSecurity");
            if (security != null) {
                String serial = extractSerialFromObject(security, "security");
                if (isValidHardwareSerial(serial)) {
                    return serial;
                }
            }

            return extractSerialFromObject(mgr, "manager");
        } catch (ClassNotFoundException e) {
            Log.w(TAG, "com.pos.sdk not available: " + e.getMessage());
        } catch (Throwable e) {
            Log.w(TAG, "POS SDK serial error: " + e.getMessage(), e);
        }
        return null;
    }

    private Object invokeFactory(Class<?> clz, Context context, String... names) {
        for (String name : names) {
            try {
                Method withCtx = clz.getMethod(name, Context.class);
                Object result = withCtx.invoke(null, context);
                if (result != null) {
                    return result;
                }
            } catch (NoSuchMethodException ignored) {
                // try next
            } catch (Throwable e) {
                Log.w(TAG, clz.getSimpleName() + "." + name + "(Context) failed: " + e.getMessage());
            }
            try {
                Method noArg = clz.getMethod(name);
                Object result = noArg.invoke(null);
                if (result != null) {
                    return result;
                }
            } catch (NoSuchMethodException ignored) {
                // try next
            } catch (Throwable e) {
                Log.w(TAG, clz.getSimpleName() + "." + name + "() failed: " + e.getMessage());
            }
        }
        return null;
    }

    private Object invokeNoArg(Object target, String... names) {
        for (String name : names) {
            try {
                Method m = target.getClass().getMethod(name);
                Object result = m.invoke(target);
                if (result != null) {
                    return result;
                }
            } catch (NoSuchMethodException ignored) {
                // try next
            } catch (Throwable e) {
                Log.w(TAG, target.getClass().getSimpleName() + "." + name + " failed: " + e.getMessage());
            }
        }
        return null;
    }

    private String extractSerialFromObject(Object obj, String prefix) {
        String[] methods = {
            "getTUSN", "getSerialNo", "getSerialNumber", "getEncTUSN", "getSystemInfo", "getSN", "getSn"
        };
        for (String method : methods) {
            try {
                Method m = obj.getClass().getMethod(method);
                Object result = m.invoke(obj);
                String parsed = stringifySerialResult(result);
                logAttempt("pos-sdk:" + prefix + "." + method, parsed != null ? parsed : "(empty)");
                if (isValidHardwareSerial(parsed)) {
                    lastSource = "pos-sdk:" + prefix + "." + method;
                    return parsed;
                }
            } catch (NoSuchMethodException ignored) {
                // continue
            } catch (Throwable e) {
                logAttempt("pos-sdk:" + prefix + "." + method, "err:" + e.getMessage());
            }
        }

        try {
            Method m = obj.getClass().getMethod("getTUSN", int.class, byte[].class);
            Object result = m.invoke(obj, 0, new byte[8]);
            String parsed = stringifySerialResult(result);
            logAttempt("pos-sdk:" + prefix + ".getTUSN(mode,bytes)", parsed != null ? parsed : "(empty)");
            if (isValidHardwareSerial(parsed)) {
                lastSource = "pos-sdk:" + prefix + ".getTUSN";
                return parsed;
            }
        } catch (NoSuchMethodException ignored) {
            // continue
        } catch (Throwable e) {
            logAttempt("pos-sdk:" + prefix + ".getTUSN(mode,bytes)", "err:" + e.getMessage());
        }

        return null;
    }

    private String stringifySerialResult(Object result) {
        if (result == null) {
            return null;
        }
        if (result instanceof String) {
            return ((String) result).trim();
        }
        if (result instanceof byte[]) {
            return new String((byte[]) result, StandardCharsets.UTF_8).trim();
        }

        String[] nested = {"getTUSN", "getSn", "getSerialNo", "getTerminalSn", "getTermSN", "getSerial"};
        for (String method : nested) {
            try {
                Method m = result.getClass().getMethod(method);
                Object inner = m.invoke(result);
                if (inner instanceof String) {
                    String s = ((String) inner).trim();
                    if (isValidHardwareSerial(s)) {
                        return s;
                    }
                }
            } catch (Throwable ignored) {
                // continue
            }
        }

        String asString = result.toString().trim();
        return asString.isEmpty() ? null : asString;
    }

    private void logAttempt(String strategy, String value) {
        String shown = value == null || value.isEmpty() ? "(empty)" : value;
        Log.i(TAG, "try " + strategy + " => " + shown);
    }

    private static String getPropViaShell(String key) {
        Process process = null;
        try {
            process = new ProcessBuilder("/system/bin/getprop", key)
                .redirectErrorStream(true)
                .start();
            try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8)
            )) {
                String line = reader.readLine();
                int code = process.waitFor();
                if (code == 0 && line != null) {
                    return line.trim();
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "getprop " + key + " failed: " + e.getMessage());
        } finally {
            if (process != null) {
                process.destroy();
            }
        }
        return "";
    }

    private static String getSystemProperty(String key) {
        try {
            Class<?> sp = Class.forName("android.os.SystemProperties");
            try {
                Method getOne = sp.getMethod("get", String.class);
                Object value = getOne.invoke(null, key);
                if (value != null) {
                    String s = String.valueOf(value).trim();
                    if (!s.isEmpty()) {
                        return s;
                    }
                }
            } catch (NoSuchMethodException ignored) {
                // fallback two-arg
            }
            Method getTwo = sp.getMethod("get", String.class, String.class);
            Object value = getTwo.invoke(null, key, "");
            return value != null ? String.valueOf(value).trim() : "";
        } catch (Exception e) {
            return "";
        }
    }

    private static String sanitizeSerial(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private static boolean isValidHardwareSerial(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        String lower = value.toLowerCase();
        if ("unknown".equals(lower) || "null".equals(lower) || "0".equals(value)) {
            return false;
        }
        if (value.matches("(?i)^[0-9a-f]{16}$")) {
            return false;
        }
        return true;
    }
}

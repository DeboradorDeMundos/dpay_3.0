package com.dtemitepos;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.util.Base64;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.pdf417.PDF417Writer;
import com.google.zxing.pdf417.encoder.Compaction;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Módulo nativo para generar códigos PDF417
 * Usado para imprimir timbres electrónicos del SII
 */
public class PDF417Module extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "PDF417Generator";
    private static final int DEFAULT_WIDTH = 384;
    private static final int DEFAULT_MAX_HEIGHT = 96;

    public PDF417Module(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Genera un código PDF417 como imagen base64.
     *
     * @param data   Datos a codificar (XML del TED)
     * @param width  Ancho máximo en píxeles (default 384)
     * @param height Altura máxima en píxeles (default 96); no fuerza estiramiento vertical
     */
    @ReactMethod
    public void generate(String data, int width, int height, Promise promise) {
        try {
            if (data == null || data.isEmpty()) {
                promise.reject("INVALID_DATA", "Los datos no pueden estar vacíos");
                return;
            }

            int printWidth = width > 0 ? width : DEFAULT_WIDTH;
            int maxHeight = height > 0 ? height : DEFAULT_MAX_HEIGHT;

            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, 2);
            hints.put(EncodeHintType.PDF417_COMPACT, false);
            hints.put(EncodeHintType.PDF417_COMPACTION, Compaction.AUTO);
            hints.put(EncodeHintType.MARGIN, 2);

            // Altura inicial baja: ZXing ajusta filas/columnas sin estirar en exceso.
            PDF417Writer writer = new PDF417Writer();
            int encodeHeight = Math.max(24, maxHeight / 2);
            BitMatrix bitMatrix = writer.encode(
                data,
                BarcodeFormat.PDF_417,
                printWidth,
                encodeHeight,
                hints
            );

            int matrixWidth = bitMatrix.getWidth();
            int matrixHeight = bitMatrix.getHeight();
            Bitmap originalBitmap = Bitmap.createBitmap(matrixWidth, matrixHeight, Bitmap.Config.RGB_565);

            for (int x = 0; x < matrixWidth; x++) {
                for (int y = 0; y < matrixHeight; y++) {
                    originalBitmap.setPixel(x, y, bitMatrix.get(x, y) ? Color.BLACK : Color.WHITE);
                }
            }

            // Escalar solo el ancho; mantener proporción real del PDF417 (sin estirar verticalmente).
            int printHeight = Math.max(1, Math.round((float) matrixHeight * printWidth / matrixWidth));
            if (printHeight > maxHeight) {
                printHeight = maxHeight;
                printWidth = Math.max(1, Math.round((float) matrixWidth * printHeight / matrixHeight));
            }

            Bitmap scaledBitmap = Bitmap.createScaledBitmap(originalBitmap, printWidth, printHeight, false);
            originalBitmap.recycle();

            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            scaledBitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
            byte[] byteArray = byteArrayOutputStream.toByteArray();
            String base64Image = Base64.encodeToString(byteArray, Base64.NO_WRAP);

            scaledBitmap.recycle();
            byteArrayOutputStream.close();

            promise.resolve(base64Image);

        } catch (WriterException e) {
            promise.reject("ENCODE_ERROR", "Error al codificar PDF417: " + e.getMessage(), e);
        } catch (Exception e) {
            promise.reject("GENERATION_ERROR", "Error al generar PDF417: " + e.getMessage(), e);
        }
    }
}

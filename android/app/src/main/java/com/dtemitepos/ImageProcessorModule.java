package com.dtemitepos;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.util.Base64;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.ByteArrayOutputStream;

/**
 * Módulo nativo para procesar imágenes para impresión térmica.
 * Produce blanco y negro óptimo para cualquier logo usando Otsu + auto-inversión.
 */
public class ImageProcessorModule extends ReactContextBaseJavaModule {

    public ImageProcessorModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ImageProcessor";
    }

    @ReactMethod
    public void processForPrinting(String base64Image, int maxWidth, Promise promise) {
        try {
            // Limpiar prefijo data:image/.../base64, si lo trae
            String cleanBase64 = base64Image;
            if (cleanBase64.contains(",")) {
                cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
            }

            byte[] imageBytes = Base64.decode(cleanBase64, Base64.DEFAULT);
            Bitmap originalBitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);

            if (originalBitmap == null) {
                promise.reject("DECODE_ERROR", "No se pudo decodificar la imagen");
                return;
            }

            // Escalar manteniendo proporción
            int origW = originalBitmap.getWidth();
            int origH = originalBitmap.getHeight();
            int newW = Math.min(origW, maxWidth);
            int newH = (int) ((float) origH / origW * newW);

            // Compositar sobre fondo blanco (elimina transparencia PNG)
            Bitmap whiteBg = Bitmap.createBitmap(newW, newH, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(whiteBg);
            canvas.drawColor(Color.WHITE);
            Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
            Bitmap scaled = Bitmap.createScaledBitmap(originalBitmap, newW, newH, true);
            canvas.drawBitmap(scaled, 0, 0, paint);
            if (scaled != originalBitmap) scaled.recycle();
            originalBitmap.recycle();

            // Convertir a luminancia
            int total = newW * newH;
            int[] pixels = new int[total];
            whiteBg.getPixels(pixels, 0, newW, 0, 0, newW, newH);
            whiteBg.recycle();

            int[] gray = new int[total];
            int[] histogram = new int[256];
            for (int i = 0; i < total; i++) {
                int r = (pixels[i] >> 16) & 0xFF;
                int g = (pixels[i] >> 8) & 0xFF;
                int b = pixels[i] & 0xFF;
                int luma = (int)(0.299f * r + 0.587f * g + 0.114f * b);
                gray[i] = luma;
                histogram[luma]++;
            }

            // Umbral adaptativo de Otsu
            int threshold = computeOtsuThreshold(histogram, total);

            // Aplicar umbral y contar píxeles negros
            int blackCount = 0;
            for (int i = 0; i < total; i++) {
                if (gray[i] <= threshold) {
                    pixels[i] = Color.BLACK;
                    blackCount++;
                } else {
                    pixels[i] = Color.WHITE;
                }
            }

            // Auto-inversión: si más del 65% de píxeles son negros, el logo tiene
            // fondo oscuro/coloreado → invertir para que el fondo quede blanco (no se imprime)
            // y el contenido quede negro (se imprime).
            if (blackCount > total * 0.65f) {
                for (int i = 0; i < total; i++) {
                    pixels[i] = (pixels[i] == Color.BLACK) ? Color.WHITE : Color.BLACK;
                }
            }

            Bitmap result = Bitmap.createBitmap(newW, newH, Bitmap.Config.ARGB_8888);
            result.setPixels(pixels, 0, newW, 0, 0, newW, newH);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            result.compress(Bitmap.CompressFormat.PNG, 100, out);
            String resultBase64 = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
            result.recycle();
            out.close();

            promise.resolve(resultBase64);
        } catch (Exception e) {
            promise.reject("PROCESS_ERROR", "Error procesando imagen: " + e.getMessage());
        }
    }

    /**
     * Algoritmo de Otsu: calcula el umbral óptimo según el histograma de la imagen.
     * Funciona bien para imágenes bimodales (contenido + fondo).
     */
    private int computeOtsuThreshold(int[] histogram, int total) {
        double sum = 0;
        for (int i = 0; i < 256; i++) sum += i * histogram[i];

        double sumB = 0;
        int wB = 0;
        double maxVariance = 0;
        int threshold = 128;

        for (int t = 0; t < 256; t++) {
            wB += histogram[t];
            if (wB == 0) continue;
            int wF = total - wB;
            if (wF == 0) break;

            sumB += (double) t * histogram[t];
            double mB = sumB / wB;
            double mF = (sum - sumB) / wF;
            double variance = (double) wB * wF * (mB - mF) * (mB - mF);

            if (variance > maxVariance) {
                maxVariance = variance;
                threshold = t;
            }
        }
        return threshold;
    }
}


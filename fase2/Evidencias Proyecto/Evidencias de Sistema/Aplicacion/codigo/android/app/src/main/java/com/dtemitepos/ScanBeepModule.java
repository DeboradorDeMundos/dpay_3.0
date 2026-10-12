package com.dtemitepos;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.SoundPool;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;

import java.io.IOException;

/**
 * Beep al escanear producto. Intenta MP3 en res/raw; si falla usa tono del sistema.
 */
public class ScanBeepModule extends ReactContextBaseJavaModule {

    private static final String TAG = "ScanBeep";
    private static final int TONE_DURATION_MS = 120;
    /** Volumen del beep (0.0–1.0). SoundPool no permite > 1.0. */
    private static final float BEEP_VOLUME = 1.0f;

    private SoundPool soundPool;
    private int soundPoolId = 0;
    private volatile boolean soundPoolReady = false;
    private MediaPlayer mediaPlayer;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public ScanBeepModule(ReactApplicationContext reactContext) {
        super(reactContext);
        initSoundPool();
    }

    @Override
    public String getName() {
        return "ScanBeep";
    }

    private void initSoundPool() {
        try {
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();

            soundPool = new SoundPool.Builder()
                .setMaxStreams(2)
                .setAudioAttributes(attrs)
                .build();

            soundPool.setOnLoadCompleteListener((pool, sampleId, status) -> {
                if (status == 0 && sampleId == soundPoolId) {
                    soundPoolReady = true;
                    Log.d(TAG, "SoundPool: sonido_scaner cargado");
                } else {
                    Log.w(TAG, "SoundPool: fallo carga status=" + status);
                }
            });

            soundPoolId = soundPool.load(getReactApplicationContext(), R.raw.sonido_scaner, 1);
            Log.d(TAG, "SoundPool: cargando id=" + soundPoolId);
        } catch (Exception e) {
            Log.e(TAG, "SoundPool init error", e);
        }
    }

    private void ensureAudibleStream() {
        try {
            ReactApplicationContext ctx = getReactApplicationContext();
            AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            if (am == null) {
                return;
            }
            int maxMusic = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int maxAlarm = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
            int musicVol = am.getStreamVolume(AudioManager.STREAM_MUSIC);
            int alarmVol = am.getStreamVolume(AudioManager.STREAM_ALARM);

            // Subir al máximo si está bajo (POS suele tener media/alarma bajos)
            int musicTarget = Math.max(musicVol, (int) (maxMusic * 0.9f));
            int alarmTarget = Math.max(alarmVol, (int) (maxAlarm * 0.95f));

            if (musicTarget > musicVol) {
                am.setStreamVolume(AudioManager.STREAM_MUSIC, musicTarget, 0);
                Log.d(TAG, "Volumen media: " + musicVol + " -> " + musicTarget);
            }
            if (alarmTarget > alarmVol) {
                am.setStreamVolume(AudioManager.STREAM_ALARM, alarmTarget, 0);
                Log.d(TAG, "Volumen alarma: " + alarmVol + " -> " + alarmTarget);
            }

            am.setSpeakerphoneOn(true);
        } catch (Exception e) {
            Log.w(TAG, "No se pudo ajustar volumen", e);
        }
    }

    private boolean playFromSoundPool() {
        if (soundPool == null || !soundPoolReady || soundPoolId <= 0) {
            return false;
        }
        int result = soundPool.play(soundPoolId, BEEP_VOLUME, BEEP_VOLUME, 1, 0, 1f);
        Log.d(TAG, "SoundPool.play result=" + result);
        return result != 0;
    }

    private boolean playFromMediaPlayer() {
        try {
            ReactApplicationContext ctx = getReactApplicationContext();
            if (mediaPlayer == null) {
                mediaPlayer = new MediaPlayer();
                mediaPlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                );
                mediaPlayer.setDataSource(ctx, Uri.parse(
                    "android.resource://" + ctx.getPackageName() + "/" + R.raw.sonido_scaner
                ));
                mediaPlayer.setVolume(1f, 1f);
                mediaPlayer.prepare();
            }

            if (mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
            }
            mediaPlayer.seekTo(0);
            mediaPlayer.start();
            Log.d(TAG, "MediaPlayer: reproduciendo");
            return true;
        } catch (IOException | IllegalStateException e) {
            Log.w(TAG, "MediaPlayer falló", e);
            releaseMediaPlayer();
            return false;
        }
    }

    private void playSystemTone() {
        try {
            ToneGenerator tone = new ToneGenerator(AudioManager.STREAM_MUSIC, 100);
            tone.startTone(ToneGenerator.TONE_PROP_BEEP, TONE_DURATION_MS);
            mainHandler.postDelayed(tone::release, TONE_DURATION_MS + 80L);
            Log.d(TAG, "ToneGenerator: beep sistema");
        } catch (Exception e) {
            Log.e(TAG, "ToneGenerator falló", e);
        }
    }

    private void playInternal() {
        ensureAudibleStream();

        if (playFromSoundPool()) {
            return;
        }
        if (playFromMediaPlayer()) {
            return;
        }

        // Solo si el MP3 falló
        playSystemTone();
        playAlarmTone();
        Log.w(TAG, "MP3 no reprodujo; se usó tono sistema");
    }

    private void playAlarmTone() {
        try {
            ToneGenerator alarm = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
            alarm.startTone(ToneGenerator.TONE_PROP_BEEP2, TONE_DURATION_MS);
            mainHandler.postDelayed(alarm::release, TONE_DURATION_MS + 80L);
            Log.d(TAG, "ToneGenerator ALARM: beep");
        } catch (Exception e) {
            Log.w(TAG, "ToneGenerator ALARM falló", e);
        }
    }

    @ReactMethod
    public void preload(Promise promise) {
        UiThreadUtil.runOnUiThread(() -> {
            mainHandler.postDelayed(() -> {
                if (soundPoolReady) {
                    promise.resolve("soundpool");
                } else {
                    promise.resolve("fallback");
                }
            }, 350);
        });
    }

    @ReactMethod
    public void play(Promise promise) {
        UiThreadUtil.runOnUiThread(() -> {
            try {
                playInternal();
                promise.resolve(true);
            } catch (Exception e) {
                Log.e(TAG, "play error", e);
                playSystemTone();
                promise.resolve(true);
            }
        });
    }

    /** Para probar desde consola / debug: adb shell am broadcast ... o desde JS. */
    @ReactMethod
    public void test(Promise promise) {
        UiThreadUtil.runOnUiThread(() -> {
            playInternal();
            promise.resolve(true);
        });
    }

    private void releaseMediaPlayer() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception ignored) {
                // noop
            }
            mediaPlayer = null;
        }
    }

    @Override
    public void invalidate() {
        if (soundPool != null) {
            soundPool.release();
            soundPool = null;
        }
        releaseMediaPlayer();
        super.invalidate();
    }
}

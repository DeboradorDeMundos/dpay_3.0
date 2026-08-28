package com.dtemitepos;

import android.app.Activity;
import android.os.Build;
import android.view.View;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;

public class ImmersiveModeModule extends ReactContextBaseJavaModule {

    public ImmersiveModeModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ImmersiveMode";
    }

    @ReactMethod
    public void setImmersive(final boolean immersive) {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Activity activity = getCurrentActivity();
                if (activity != null) {
                    View decorView = activity.getWindow().getDecorView();
                    
                    if (immersive) {
                        // Modo inmersivo sticky - las barras vuelven a ocultarse automáticamente
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                            decorView.setSystemUiVisibility(
                                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                                | View.SYSTEM_UI_FLAG_FULLSCREEN
                            );
                        }
                    } else {
                        // Restaurar modo normal
                        decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
                    }
                }
            }
        });
    }
}

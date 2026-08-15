package com.dtemitepos;

import android.app.Dialog;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;

public class ImmersiveModalModule extends ReactContextBaseJavaModule {
    
    private static Dialog currentDialog;

    public ImmersiveModalModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ImmersiveModal";
    }

    @ReactMethod
    public void setModalImmersive(final boolean enable) {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (getCurrentActivity() != null) {
                    Window window = getCurrentActivity().getWindow();
                    View decorView = window.getDecorView();
                    
                    if (enable) {
                        // Aplicar modo inmersivo sticky
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
                        
                        // Forzar que el window mantenga las flags
                        window.setFlags(
                            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                        );
                    }
                }
            }
        });
    }

    @ReactMethod
    public void forceImmersive() {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (getCurrentActivity() != null) {
                    Window window = getCurrentActivity().getWindow();
                    View decorView = window.getDecorView();
                    
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
                }
            }
        });
    }
}

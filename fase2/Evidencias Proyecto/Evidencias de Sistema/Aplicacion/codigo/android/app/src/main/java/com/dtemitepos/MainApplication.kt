package com.dtemitepos

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.dtemitepos.BuildConfig

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost by lazy {
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): MutableList<ReactPackage> =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(ImmersiveModePackage())
          add(PDF417Package())
          add(TuuPaymentPackage())
          add(ImageProcessorPackage())
          add(ScanBeepPackage())
          add(PosDeviceInfoPackage())
        }

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override fun getJSMainModuleName(): String = "index"
    }
  }

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, /* native exopackage */ false)
  }
}

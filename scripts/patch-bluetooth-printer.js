const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-bluetooth-escpos-printer',
  'android',
  'build.gradle'
);

console.log('🔧 Parcheando react-native-bluetooth-escpos-printer...');

if (!fs.existsSync(buildGradlePath)) {
  console.log('⚠️  Archivo build.gradle no encontrado, saltando parche');
  process.exit(0);
}

let content = fs.readFileSync(buildGradlePath, 'utf8');

// Reemplazar jcenter inseguro con mavenCentral
content = content.replace(
  /jcenter\s*\{\s*url\s+"http:\/\/jcenter\.bintray\.com\/"\s*\}/g,
  'mavenCentral() // Parche: reemplazado jcenter por mavenCentral'
);

// Reemplazar repo.spring.io inseguro
content = content.replace(
  /maven\s*\{\s*url\s+"http:\/\/repo\.spring\.io\/plugins-release\/"\s*\}/g,
  '// maven { url "http://repo.spring.io/plugins-release/" } // Parche: removido repo inseguro'
);

// Reemplazar 'compile' deprecado con 'implementation'
content = content.replace(/compile fileTree/g, 'implementation fileTree');

// Actualizar versiones de Android
content = content.replace(/compileSdkVersion 27/g, 'compileSdkVersion 35');
content = content.replace(/buildToolsVersion "27\.0\.3"/g, 'buildToolsVersion "35.0.0"');
content = content.replace(/targetSdkVersion 24/g, 'targetSdkVersion 35');

// Reemplazar support-v4 con androidx
content = content.replace(
  /implementation group: 'com\.android\.support', name: 'support-v4', version: '27\.0\.0'/g,
  "implementation 'androidx.legacy:legacy-support-v4:1.0.0'"
);

fs.writeFileSync(buildGradlePath, content, 'utf8');

// Parchear archivo Java para androidx
const javaFilePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-bluetooth-escpos-printer',
  'android',
  'src',
  'main',
  'java',
  'cn',
  'jystudio',
  'bluetooth',
  'RNBluetoothManagerModule.java'
);

if (fs.existsSync(javaFilePath)) {
  let javaContent = fs.readFileSync(javaFilePath, 'utf8');
  
  // Reemplazar imports de support.v4 con androidx
  javaContent = javaContent.replace(
    /import android\.support\.v4\.app\.ActivityCompat;/g,
    'import androidx.core.app.ActivityCompat;'
  );
  
  javaContent = javaContent.replace(
    /import android\.support\.v4\.content\.ContextCompat;/g,
    'import androidx.core.content.ContextCompat;'
  );
  
  fs.writeFileSync(javaFilePath, javaContent, 'utf8');
  console.log('✅ Parche Java aplicado exitosamente (androidx migration)');
}

// Parchear RNBluetoothEscposPrinterModule.java para agregar printPicNoCut
const printerModulePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-bluetooth-escpos-printer',
  'android',
  'src',
  'main',
  'java',
  'cn',
  'jystudio',
  'bluetooth',
  'escpos',
  'RNBluetoothEscposPrinterModule.java'
);

if (fs.existsSync(printerModulePath)) {
  let printerContent = fs.readFileSync(printerModulePath, 'utf8');
  
  // Siempre aplicar el parche (reemplazar versión anterior si existe)
  // Buscar el método printPic y agregar/reemplazar printPicNoCut después
  const printPicMethod = `    @ReactMethod
    public void printPic(String base64encodeStr, @Nullable  ReadableMap options) {
        int width = 0;
        int leftPadding = 0;
        if(options!=null){
            width = options.hasKey("width") ? options.getInt("width") : 0;
            leftPadding = options.hasKey("left")?options.getInt("left") : 0;
        }

        //cannot larger then devicesWith;
        if(width > deviceWidth || width == 0){
            width = deviceWidth;
        }

        byte[] bytes = Base64.decode(base64encodeStr, Base64.DEFAULT);
        Bitmap mBitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        int nMode = 0;
        if (mBitmap != null) {
            /**
             * Parameters:
             * mBitmap  要打印的图片
             * nWidth   打印宽度（58和80）
             * nMode    打印模式
             * Returns: byte[]
             */
            byte[] data = PrintPicture.POS_PrintBMP(mBitmap, width, nMode, leftPadding);
            //	SendDataByte(buffer);
            sendDataByte(Command.ESC_Init);
            sendDataByte(Command.LF);
            sendDataByte(data);
            sendDataByte(PrinterCommand.POS_Set_PrtAndFeedPaper(30));
            sendDataByte(PrinterCommand.POS_Set_Cut(1));
            sendDataByte(PrinterCommand.POS_Set_PrtInit());
        }
    }`;

    const printPicNoCutMethod = `    @ReactMethod
    public void printPic(String base64encodeStr, @Nullable  ReadableMap options) {
        int width = 0;
        int leftPadding = 0;
        if(options!=null){
            width = options.hasKey("width") ? options.getInt("width") : 0;
            leftPadding = options.hasKey("left")?options.getInt("left") : 0;
        }

        //cannot larger then devicesWith;
        if(width > deviceWidth || width == 0){
            width = deviceWidth;
        }

        byte[] bytes = Base64.decode(base64encodeStr, Base64.DEFAULT);
        Bitmap mBitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        int nMode = 0;
        if (mBitmap != null) {
            /**
             * Parameters:
             * mBitmap  要打印的图片
             * nWidth   打印宽度（58和80）
             * nMode    打印模式
             * Returns: byte[]
             */
            byte[] data = PrintPicture.POS_PrintBMP(mBitmap, width, nMode, leftPadding);
            //	SendDataByte(buffer);
            sendDataByte(Command.ESC_Init);
            sendDataByte(Command.LF);
            sendDataByte(data);
            sendDataByte(PrinterCommand.POS_Set_PrtAndFeedPaper(30));
            sendDataByte(PrinterCommand.POS_Set_Cut(1));
            sendDataByte(PrinterCommand.POS_Set_PrtInit());
        }
    }

    /**
     * Imprime una imagen sin cortar el papel ni reiniciar la impresora.
     * No envía ESC_Init para no resetear el buffer mid-recibo (logo, TED, etc.).
     */
    @ReactMethod
    public void printPicNoCut(String base64encodeStr, @Nullable ReadableMap options, final Promise promise) {
        try {
            int width = 0;
            int leftPadding = 0;
            if(options!=null){
                width = options.hasKey("width") ? options.getInt("width") : 0;
                leftPadding = options.hasKey("left")?options.getInt("left") : 0;
            }

            if(width > deviceWidth || width == 0){
                width = deviceWidth;
            }

            byte[] bytes = Base64.decode(base64encodeStr, Base64.DEFAULT);
            Bitmap mBitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
            int nMode = 0;
            if (mBitmap != null) {
                byte[] data = PrintPicture.POS_PrintBMP(mBitmap, width, nMode, leftPadding);
                sendDataByte(Command.LF);
                sendDataByte(data);
                sendDataByte(PrinterCommand.POS_Set_PrtAndFeedPaper(10));
                promise.resolve(null);
            } else {
                promise.reject("DECODE_ERROR", "No se pudo decodificar la imagen");
            }
        } catch (Exception e) {
            promise.reject("PRINT_ERROR", e.getMessage());
        }
    }`;

    // Re-aplicar: solo insertar printPicNoCut si aún no existe (evita regex que borra el archivo)
    if (printerContent.includes('printPicNoCut')) {
      console.log('ℹ️  printPicNoCut ya presente, omitiendo parche duplicado');
    } else if (printerContent.includes(printPicMethod)) {
      printerContent = printerContent.replace(printPicMethod, printPicNoCutMethod);
      fs.writeFileSync(printerModulePath, printerContent, 'utf8');
      console.log('✅ Parche printPicNoCut aplicado exitosamente');
    } else {
      console.log('⚠️  No se encontró printPic original; omitiendo printPicNoCut');
    }

    // Reducir avance de papel tras imágenes embebidas (TED/logo)
    let printerContentForFeed = fs.readFileSync(printerModulePath, 'utf8');
    if (printerContentForFeed.includes('POS_Set_PrtAndFeedPaper(10)') && printerContentForFeed.includes('printPicNoCut')) {
      printerContentForFeed = printerContentForFeed.replace(
        'sendDataByte(PrinterCommand.POS_Set_PrtAndFeedPaper(10));',
        'sendDataByte(PrinterCommand.POS_Set_PrtAndFeedPaper(2));'
      );
      fs.writeFileSync(printerModulePath, printerContentForFeed, 'utf8');
      console.log('✅ Parche feed TED aplicado (2 dots post-imagen)');
    }
  }

// Parchear PrintPicture.java: enviar raster TED en un solo bloque GS v 0 (evita franjas separadas)
const printPicturePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-bluetooth-escpos-printer',
  'android',
  'src',
  'main',
  'java',
  'cn',
  'jystudio',
  'bluetooth',
  'escpos',
  'command',
  'sdk',
  'PrintPicture.java'
);

const eachLinePixToCmdOld = `    public static byte[] eachLinePixToCmd(byte[] src, int nWidth, int nMode) {
        int nHeight = src.length / nWidth;
        int nBytesPerLine = nWidth / 8;
        byte[] data = new byte[nHeight * (8 + nBytesPerLine)];
        boolean offset = false;
        int k = 0;

        for (int i = 0; i < nHeight; ++i) {
            int var10 = i * (8 + nBytesPerLine);
            //GS v 0 m xL xH yL yH d1....dk 打印光栅位图
            data[var10 + 0] = 29;//GS
            data[var10 + 1] = 118;//v
            data[var10 + 2] = 48;//0
            data[var10 + 3] = (byte) (nMode & 1);
            data[var10 + 4] = (byte) (nBytesPerLine % 256);//xL
            data[var10 + 5] = (byte) (nBytesPerLine / 256);//xH
            data[var10 + 6] = 1;//yL
            data[var10 + 7] = 0;//yH

            for (int j = 0; j < nBytesPerLine; ++j) {
                data[var10 + 8 + j] = (byte) (p0[src[k]] + p1[src[k + 1]] + p2[src[k + 2]] + p3[src[k + 3]] + p4[src[k + 4]] + p5[src[k + 5]] + p6[src[k + 6]] + src[k + 7]);
                k += 8;
            }
        }

        return data;
    }`;

const eachLinePixToCmdNew = `    public static byte[] eachLinePixToCmd(byte[] src, int nWidth, int nMode) {
        int nHeight = src.length / nWidth;
        int nBytesPerLine = nWidth / 8;
        // Un solo comando GS v 0 con toda la altura (evita espacios entre filas en impresoras ESC/POS)
        byte[] data = new byte[8 + nBytesPerLine * nHeight];
        int k = 0;

        data[0] = 29;//GS
        data[1] = 118;//v
        data[2] = 48;//0
        data[3] = (byte) (nMode & 1);
        data[4] = (byte) (nBytesPerLine % 256);//xL
        data[5] = (byte) (nBytesPerLine / 256);//xH
        data[6] = (byte) (nHeight % 256);//yL
        data[7] = (byte) (nHeight / 256);//yH

        int pos = 8;
        for (int i = 0; i < nHeight; ++i) {
            for (int j = 0; j < nBytesPerLine; ++j) {
                data[pos++] = (byte) (p0[src[k]] + p1[src[k + 1]] + p2[src[k + 2]] + p3[src[k + 3]] + p4[src[k + 4]] + p5[src[k + 5]] + p6[src[k + 6]] + src[k + 7]);
                k += 8;
            }
        }

        return data;
    }`;

if (fs.existsSync(printPicturePath)) {
  let printPictureContent = fs.readFileSync(printPicturePath, 'utf8');
  if (printPictureContent.includes('data[var10 + 6] = 1;//yL')) {
    printPictureContent = printPictureContent.replace(eachLinePixToCmdOld, eachLinePixToCmdNew);
    fs.writeFileSync(printPicturePath, printPictureContent, 'utf8');
    console.log('✅ Parche eachLinePixToCmd aplicado (raster TED en bloque único)');
  } else if (printPictureContent.includes('Un solo comando GS v 0')) {
    console.log('ℹ️  eachLinePixToCmd ya parcheado');
  } else {
    console.log('⚠️  No se encontró eachLinePixToCmd original; omitiendo parche raster');
  }
}

console.log('✅ Parche aplicado exitosamente a react-native-bluetooth-escpos-printer');

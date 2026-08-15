/**
 * @format
 */

// Polyfills para React Native / Hermes (no expone btoa/atob globalmente)
if (typeof global.btoa === 'undefined') {
  global.btoa = (str) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;
      result += chars[a >> 2];
      result += chars[((a & 3) << 4) | (b >> 4)];
      result += i - 2 < str.length ? chars[((b & 15) << 2) | (c >> 6)] : '=';
      result += i - 1 < str.length ? chars[c & 63] : '=';
    }
    return result;
  };
}

if (typeof global.atob === 'undefined') {
  global.atob = (str) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const cleanStr = str.replace(/=+$/, '');
    let result = '';
    let i = 0;
    while (i < cleanStr.length) {
      const a = chars.indexOf(cleanStr[i++]);
      const b = chars.indexOf(cleanStr[i++]);
      const c = i <= cleanStr.length ? chars.indexOf(cleanStr[i++]) : 64;
      const d = i <= cleanStr.length ? chars.indexOf(cleanStr[i++]) : 64;
      result += String.fromCharCode((a << 2) | (b >> 4));
      if (c !== 64) result += String.fromCharCode(((b & 15) << 4) | (c >> 2));
      if (d !== 64) result += String.fromCharCode(((c & 3) << 6) | d);
    }
    return result;
  };
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

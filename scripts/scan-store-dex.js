const fs = require('fs');
const t = fs.readFileSync('C:/Users/mauro/AppData/Local/Temp/classes.dex').toString('latin1');
const needles = [
  'xcheng.appstore',
  'packageName',
  'details?id',
  'details?package',
  'getQueryParameter',
  'queryParameter',
  'D-PAY',
  'dtemitepos',
];
for (const n of needles) {
  let i = 0;
  let c = 0;
  while ((i = t.indexOf(n, i)) >= 0 && c < 8) {
    const slice = t.slice(Math.max(0, i - 30), i + 80).replace(/[^\x20-\x7e]/g, '.');
    console.log(n, '=>', slice);
    i += n.length;
    c++;
  }
}

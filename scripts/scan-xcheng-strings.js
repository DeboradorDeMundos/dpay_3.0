const fs = require('fs');
const t = fs.readFileSync('C:/Users/mauro/AppData/Local/Temp/classes.dex').toString('latin1');
const needle = 'Lcom/xcheng/store/';
let i = 0;
const found = new Set();
while ((i = t.indexOf(needle, i)) >= 0) {
  let j = i;
  while (j < t.length && t.charCodeAt(j) >= 32 && t.charCodeAt(j) < 127) j++;
  found.add(t.slice(i, j));
  i++;
}
[...found].sort().forEach((s) => console.log(s));

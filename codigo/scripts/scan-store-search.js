const fs = require('fs');
const t = fs.readFileSync('C:/Users/mauro/AppData/Local/Temp/classes.dex').toString('latin1');

function contexts(needle, before = 60, after = 80) {
  let i = 0;
  let c = 0;
  while ((i = t.indexOf(needle, i)) >= 0 && c < 12) {
    console.log('---', needle, '---');
    console.log(t.slice(Math.max(0, i - before), i + after).replace(/[^\x20-\x7e\n]/g, '.'));
    i += needle.length;
    c++;
  }
}

[
  'searchguide',
  'application_search',
  'SearchView',
  'onQueryTextSubmit',
  'onQueryTextChange',
  'setQuery',
  'edit_query',
  'searchguide',
  'startSearch',
  'doSearch',
  'searchApp',
  'searchContent',
  'searchWord',
  'searchKey',
  'fromDeepLinkAction',
  'fromDeepLink',
  'gotoDetailApp',
  'MainActivity',
  'IndexFragment',
  'search/',
  '/search',
  'keyword',
  'keyWord',
  'app_name',
  'appName',
  'user_query',
  'searchguide',
  'searchguide',
].forEach(contexts);

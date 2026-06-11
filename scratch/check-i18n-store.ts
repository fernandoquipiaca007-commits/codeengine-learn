import i18n from '../src/lib/i18n';

async function run() {
  console.log('i18n languages:', i18n.languages);
  console.log('i18n options namespaces:', i18n.options.ns);
  
  // Inspect loaded translations for 'pages' namespace
  console.log('\n--- EN pages namespace ---');
  console.log(JSON.stringify(i18n.getResourceBundle('en', 'pages'), null, 2));

  console.log('\n--- PT pages namespace ---');
  console.log(JSON.stringify(i18n.getResourceBundle('pt', 'pages'), null, 2));
}

run();

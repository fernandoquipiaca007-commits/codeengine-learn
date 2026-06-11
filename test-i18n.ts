import i18n from 'i18next';
import { initReactI18next } from 'react-react-i18next'; // não precisamos de react-i18next no node puro para testar o core do i18next

import ptCommon from './src/locales/pt/common.json';
import ptPages from './src/locales/pt/pages.json';
import enCommon from './src/locales/en/common.json';
import enPages from './src/locales/en/pages.json';
import frCommon from './src/locales/fr/common.json';
import frPages from './src/locales/fr/pages.json';

async function test() {
  await i18n.init({
    resources: {
      pt: { common: ptCommon, pages: ptPages },
      en: { common: enCommon, pages: enPages },
      fr: { common: frCommon, pages: frPages },
    },
    lng: 'pt',
    fallbackLng: 'pt',
    defaultNS: 'common',
    ns: ['common', 'pages'],
    interpolation: { escapeValue: false },
  });

  console.log('--- TEST PT ---');
  console.log('Language:', i18n.language);
  console.log('product.readNow:', i18n.t('product.readNow'));
  console.log('product.lifetimeAccess:', i18n.t('product.lifetimeAccess'));
  console.log('product.seeInAction (pages):', i18n.t('product.seeInAction', { ns: 'pages' }));

  await i18n.changeLanguage('en');
  console.log('\n--- TEST EN ---');
  console.log('Language:', i18n.language);
  console.log('product.readNow:', i18n.t('product.readNow'));
  console.log('product.lifetimeAccess:', i18n.t('product.lifetimeAccess'));
  console.log('product.seeInAction (pages):', i18n.t('product.seeInAction', { ns: 'pages' }));

  await i18n.changeLanguage('fr');
  console.log('\n--- TEST FR ---');
  console.log('Language:', i18n.language);
  console.log('product.readNow:', i18n.t('product.readNow'));
  console.log('product.lifetimeAccess:', i18n.t('product.lifetimeAccess'));
  console.log('product.seeInAction (pages):', i18n.t('product.seeInAction', { ns: 'pages' }));
}

test();

import i18n from 'i18next';
import ptCommon from '../src/locales/pt/common.json';
import ptPages from '../src/locales/pt/pages.json';
import enCommon from '../src/locales/en/common.json';
import enPages from '../src/locales/en/pages.json';
import frCommon from '../src/locales/fr/common.json';
import frPages from '../src/locales/fr/pages.json';

async function run() {
  await i18n.init({
    resources: {
      pt: { common: ptCommon, pages: ptPages },
      en: { common: enCommon, pages: enPages },
      fr: { common: frCommon, pages: frPages },
    },
    lng: 'en',
    fallbackLng: 'pt',
    defaultNS: 'common',
    ns: ['common', 'pages'],
  });

  console.log('Language:', i18n.language);
  console.log('pages:product.readFullDescription ->', i18n.t('product.readFullDescription', { ns: 'pages' }));
  console.log('pages:product.seeInAction ->', i18n.t('product.seeInAction', { ns: 'pages' }));
  console.log('common:product.readNow ->', i18n.t('product.readNow', { ns: 'common' }));
  console.log('common:product.lifetimeAccess ->', i18n.t('product.lifetimeAccess', { ns: 'common' }));

  await i18n.changeLanguage('fr');
  console.log('\nLanguage:', i18n.language);
  console.log('pages:product.readFullDescription ->', i18n.t('product.readFullDescription', { ns: 'pages' }));
  console.log('pages:product.seeInAction ->', i18n.t('product.seeInAction', { ns: 'pages' }));
  console.log('common:product.readNow ->', i18n.t('product.readNow', { ns: 'common' }));
  console.log('common:product.lifetimeAccess ->', i18n.t('product.lifetimeAccess', { ns: 'common' }));
}

run();

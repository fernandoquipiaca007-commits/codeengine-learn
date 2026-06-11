import i18n from 'i18next';
import ptCommon from '../src/locales/pt/common.json';
import enCommon from '../src/locales/en/common.json';

async function run() {
  await i18n.init({
    resources: {
      pt: { common: ptCommon },
      en: { common: enCommon },
    },
    lng: 'en-US',
    fallbackLng: 'pt',
    defaultNS: 'common',
    ns: ['common'],
  });

  console.log('Language:', i18n.language);
  console.log('common:product.readNow ->', i18n.t('product.readNow'));
}

run();

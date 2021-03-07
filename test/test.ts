import { LocaleMap, Gender, parseLocale } from '../src/lib';
import { expect } from 'chai';
import { describe } from 'mocha';

describe('LocaleMap', () => {
    const localeMap = new LocaleMap({
        // Set of supported Locales.
        // NOTE that the strings here indicate where
        // the assets are located.
        supportedLocales: ['en-US'],
        defaultLocale: 'en-US',
        assets: {
            src: 'test/res/lang',
            baseFileNames: ['common'],
            autoClean: true,
            loaderType: 'fileSystem',
        },
    });

    (async () => {
        await localeMap.load(parseLocale('en-US'));
        const t = localeMap.get.bind(localeMap);
        console.log(t('common.messageId'));
        console.log(t('common.parameterized', { x: 'foo' }));
        console.log(t('common.contextual', Gender.FEMALE));
        console.log(t('common.qty', 10));
    })();
});
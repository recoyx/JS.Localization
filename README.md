# Localization

String localization in JavaScript.

Features:
- Supports loading text resources from HTTP (Web Browser and Node.js) and File System (Node.js).
- Basic language information and settings

## Examples

```javascript
import { LocaleMap, Gender, parseLocale } from 'com.recoyxgroup.localization';

const localeMap = new LocaleMap({
    // Set of supported Locales.
    // NOTE that the strings here indicate where
    // the assets are located.
    supportedLocales: ['en-US', 'en-GB', 'ja', 'pt-BR'],
    defaultLocale: 'en-US',
    fallbacks: {
        'pt-BR': 'en-US',
        'en-GB': ['ja', 'pt-BR']
    },
    assets: {
        // assets URL or path
        src: 'path/to/res/lang',
        // asset JSON files
        // - NOTE: slash works here
        baseFileNames: ['common'],
        // whether to clean assets automatically on locale switch
        autoClean: true,
        // 'fileSystem', 'http'
        loaderType: 'fileSystem',
    },
});

(async () => {
    await localeMap.load();
    const t = localeMap.get.bind(localeMap);
    console.log(t('common.messageId'));
    console.log(t('common.parameterized', { x: 'foo' }));
    console.log(t('common.contextual', Gender.MALE));
    console.log(t('common.qty', 10));
})();
```

Example assets:

```json
{
    "messageId": "Some message",
    "parameterized": "Here: $x",
    "contextualMale": "Male message",
    "contextualFemale": "Female message",
    "qtyEmpty": "$amount: empty",
    "qtySingle": "$amount: single",
    "qtyPlural": "$amount: plural"
}
```
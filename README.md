# Localization

String localization in JavaScript.

Features:
- Supports loading text resources from HTTP (Web Browser and Node.js) and file system (Node.js).
- Basic language information and settings

Lacking:
- Not all Locales have a Region associated. You can contribute to this by simply adding a second argument to the data entries at [Locale.js](https://github.com/recoyx/Localization/blob/master/src/Locale.js).

## Examples

```javascript
import Intl from 'com.recoyxgroup.localization';

const localeDictionary = new Intl.Dictionary({
    // Set of supported Locales.
    // NOTE that the strings here indicate where
    // the assets are located.
    localeSet: ['en-US', 'en-GB', 'ja', 'pt-BR'],
    defaultLocale: 'en-US',
    fallbacks: {
        'pt-BR': 'en-US',
        'en-GB': ['ja', 'pt-BR']
    },
    assets: {
        // assets URL or path
        path: 'path/to/res/lang',
        // asset JSON files
        // - NOTE: dot is accepted and maps to a slash in the asset URL
        topLevelNames: ['common', 'validation'],
        // whether to clean assets automatically on language switch
        autoClean: true,
        // 'fileSystem', 'http'
        loaderType: 'fileSystem',
    },
});

const { Gender } = Intl;

(async () => {
    await localeDictionary.setLocale('en-US');

    const t = localeDictionary.t.bind(localeDictionary);

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

## API

###### `Locale`

Identifies language codes and provides basic language properties. Only language followed by region scripts are identified in general.

> **NOTE**
> <br>
> Instead of the `new` operator, use:
>
> ```
> Locale(localeCode)
> ```

###### `[object Locale].name`

Returns the Locale native name. The result includes the region name.

###### `[object Locale].side`

Returns the side from which the Locale starts being read.

- Type: [`LocaleDirection`](#languageside)

###### `[object Locale].region`

Returns the Locale region, possibly null currently.

- Type: [`Region`](#region)

###### `[object Locale].toString()`

Returns the [BCP 47](https://tools.ietf.org/html/bcp47) Locale code.

###### `LocaleDirection`

Represents whether a Locale is read from left or right.

###### `LocaleDirection.LTR`

- String: `'ltr'`

###### `LocaleDirection.RTL`

- String: `'rtl'`

###### `Region`

Identifies ISO 3166-1 country codes and provides basic region properties.

###### `[object Region].getName()`

Returns the Region name in the given Locale.

###### `[object Region].toString()`

Returns the Region code.

###### `Gender`

Represents gender formatting option.

###### `Gender.MALE`

- String: `'male'`

###### `Gender.FEMALE`

- String: `'female'`

###### `Dictionary`

Provides String mapping for a current language from a language set. The constructor can be seen at [Examples](#examples) on this page.

Dictionary implements the EventTarget interface.

###### `[object Dictionary] [event localeupdate]`

Dispatched when Dictionary.setLocale() is called.

###### `[object Dictionary].localeSet`

Indicates the supported languages.

###### `[object Dictionary].defaultLocale`

Indicates the default language.

###### `[object Dictionary].getLocale()`

Returns the current Locale object.

###### `[object Dictionary].setLocale()`

Asynchronously sets the current Locale object, loading its assets.

###### `[object Dictionary].loadAssets()`

Asynchronously loads current Locale assets.

###### `[object Dictionary].supportsLocale()`

Verifies whether the given Locale is supported.

###### `[object Dictionary].t()`

Recognizes current Locale asset, applying additional formatting options (`Gender`, `Number`, `BigInt` and `Object` variables).

- Signature: `function(stringId:String, ...options):String`

###### `[object Dictionary].clone()`

Clones the Dictionary. It is recommended to have constructed the original Dictionary with the option `assets.autoClean` set to `false`.

```javascript
var clonedLocaleDictionary = localeDictionary.clone();
```
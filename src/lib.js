import getCountryName from 'country-name';
import countryISO2To3 from 'country-iso-2-to-3';
import LanguageTags from 'language-tags';
import LanguageNameMap from 'language-name-map';
import HttpRequest from 'axios';
import { EventTarget } from 'event-target-shim';
import fsLoader from './FSLoader4NodeJS.js';

const { getLangNameFromCode } = LanguageNameMap;

const constructorPrivateKey = {};

export class Locale {
    constructor(id, key = undefined) {
        if (key != constructorPrivateKey)
            throw new Error('Illegal constructor for Locale.');
        let tag = LanguageTags(id);
        if (tag && tag.subtags().length == 1) {
            switch (tag.subtags()[0].format().toLowerCase()) {
                case 'br': tag = LanguageTags('pt-BR'); break;
                case 'us':
                case 'usa': tag = LanguageTags('en-US'); break;
                case 'jp': tag = LanguageTags('ja'); break;
            }
        }
        if (!tag || !tag.language() || !getLangNameFromCode(tag.language().format()))
            throw new Error("Invalid or unknown language identifier.");
        this._tag = tag;
    }

    get standardTag() {
        return this._tag;
    }

    _getBasicInfo() {
        return getLangNameFromCode(this._tag.language().format());
    }

    get direction() {
        let info = this._getBasicInfo();
        return info.dir == 1 ? 'leftToRight' : 'rightToLeft';
    }

    get internationalName() {
        return this._getBasicInfo().name;
    }

    get nativeName() {
        let { country } = this;
        return this._getBasicInfo().native + (country ? ` (${ country.getName(this) })` : '');
    }

    get country() {
        let r = this._tag.region();
        if (r) {
            try {
                return new Country(r.format().toUpperCase());
            } catch (e) {
            }
        }
        switch (this._tag.format().toLowerCase()) {
            case 'fr': return new Country('FRA');
            case 'ja': return new Country('JPN');
            case 'ru': return new Country('RUS');
        }
        return null;
    }

    toString() {
        return this._tag.format();
    }
}

export class Country {
    constructor(id, key = undefined) {
        if (key != constructorPrivateKey)
            throw new Error('Illegal constructor for Country.');
        id = id.toUpperCase();
        id = id.length == 2 ? countryISO2To3(id) : id;
        if (!getCountryName(id, 'en'))
            throw new Error('Unknown country identifier.');
        this._id = id;
    }

    get internationalName() {
        return this.getName(parseLocale('en'));
    }

    getName(locale) {
        return getCountryName(this._id, locale.standardTag.language().format());
    }

    toString() {
        return this._id;
    }
}

const localePool = new Map;

export function parseLocale(id) {
    try {
        id = new Locale(id, constructorPrivateKey).toString();
        let r = localePool.get(id);
        if (!r)
            localePool.set(id, r = new Locale(id, constructorPrivateKey));
        return r;
    } catch (e) {
        return null;
    }
}

const countryPool = new Map;

export function parseCountry(id) {
    try {
        id = new Country(id, constructorPrivateKey).toString();
        let r = countryPool.get(id);
        if (!r)
            countryPool.set(id, r = new Country(id, constructorPrivateKey));
        return r;
    } catch (e) {
        return null;
    }
}

export class LocaleMap extends EventTarget {
    constructor(options) {
        super();
        let localePathComponents = new Map;
        let supportedLocales = new Set;
        for (let code of options.supportedLocales) {
            let localeParse = parseLocale(code);
            localePathComponents.set(localeParse, code);
            supportedLocales.add(localeParse);
        }
        let fallbacks = new Map;
        for (let [k, v] of Object.entries(options.fallbacks || {})) {
            let arrayV = v instanceof Array ? v : [v];
            fallbacks.set(parseLocale(k), arrayV.map(e => parseLocale(e)));
        }
        this._localePathComponents = localePathComponents;
        this._supportedLocales = supportedLocales;
        this._defaultLocale = parseLocale(options.defaultLocale);
        this._fallbacks = fallbacks;
        this._assetsSrc = options.assets.src;
        this._assetsBaseFileNames = options.assets.baseFileNames.slice(0);
        this._assetsAutoClean = !!options.assets.autoClean;
        this._assetsLoaderType = options.assets.loaderType;
    }

    get supportedLocales() {
        let r = new Set;
        for (let locale of this._supportedLocales) r.add(locale);
        return r;
    }

    supportsLocale(arg) {
        return this._supportedLocales.has(arg);
    }

    get currentLocale() {
        return this._currentLocale;
    }

    async load(newLocale = null) {
        if (!newLocale) newLocale = this._defaultLocale;
        if (!this.supportsLocale(newLocale))
            throw new Error(`Unsupported locale: ${newLocale.toString()}`);
        let toLoad = new Set;
        toLoad.add(newLocale);
        this._enumerateFallbacks(newLocale, toLoad);

        let newAssets = new Map;
        for (let locale of toLoad) {
            let res = await this._loadSingleLocale(locale);
            if (!res) {
                return false;
            }
            newAssets.set(locale, res);
        }

        if (this._assetsAutoClean)
            this._assets.clear();
        
        for (let [locale, root] of newAssets)
            this._assets.set(locale, root);

        this._currentLocale = newLocale;
        this.dispatchEvent(new LocaleEvent('localeupdate'));
        return true;
    }

    async _loadSingleLocale(locale) {
        let r = {};
        let localePathComp = this._localePathComponents.get(locale);
        if (!localePathComp)
            throw new Error(`Fallback locale is not a supported locale: ${locale.toString()}`);
        for (let baseName of this._assetsBaseFileNames) {
            let resPath = `${this._assetsSrc}/${localePathComp}/${baseName}.json`;
            let content = '';
            try {
                if (this._assetsLoaderType == 'fileSystem') {
                    content = await fsLoader(resPath);
                } else {
                    content = await HttpRequest.get(resPath, {
                        responseType: 'json',
                    });
                }
            } catch (e) {
            }
            if (!content) {
                console.error(`Failed to load resource at ${resPath}`);
                return null;
            }
            this._setResourceDeep(baseName, content, r);
        }
        return r;
    }

    _setResourceDeep(name, assign, output) {
        let names = name.split('/');
        let lastName = names.pop();
        for (let name of names) {
            let r = output[name];
            if (r === undefined || r === null || r.constructor != Object)
                output[name] = {};
            output = output[name];
        }
        output[lastName] = assign;
    }

    _enumerateFallbacks(locale, output) {
        let list = this._fallbacks.get(locale);
        if (!list)
            return;
        for (let item of list)
            output.add(item),
            this._enumerateFallbacks(item, output);
    }

    get(id, ...options) {
        let vars = null;
        let gender = null;
        let amountNumber = null;

        for (let option of options) {
            if (option instanceof Gender) gender = option;
            else if (typeof option == 'number') amountNumber = option;
            else if (!!option && option.constructor == Object) {
                vars = vars || {};
                for (let k in option) vars[k] = String(option[k]);
            }
        }

        if (gender) id += (gender == Gender.FEMALE ? 'Female' : gender == Gender.MALE ? 'Male' : 'Other');
        if (!vars) vars = {};

        // idEmpty, idOne, idMultiple and $number variable
        if (amountNumber) id += amountNumber == 0 ? 'Empty' : amountNumber == 1 ? 'One' : 'Multiple', vars.number = amountNumber.toString();

        if (!this._currentLocale)
            return id;
        let r = this._getWithLocale(this._currentLocale, id.split('.'), vars);
        return r === null ? id : r;
    }

    _getWithLocale(locale, id, vars) {
        let message = this._resolveId(this._assets.get(locale), id);
        if (message != null)
            return this._applyMessage(message, vars);

        let fallbacks = this._fallbacks.get(locale);
        if (fallbacks != null) {
            for (let fl of fallbacks) {
                let r = this._getWithLocale(fl, id, vars);
                if (r != null)
                    return r;
            }
        }
        return null;
    }

    _applyMessage(message, vars) {
        return message.replace(/\$(\$|[A-Za-z0-9_-]+)/g, (_, s) => {
            if (s == '$')
                return '$';
            else return vars[s] || 'undefined';
        });
    }

    _resolveId(root, id) {
        let r = root;
        for (let frag of id) {
            if (r === undefined || r === null || r.constructor != Object)
                return null;
            r = r[frag];
        }
        return typeof r == 'string' ? r : null;
    }

    reflectOptions() {
        let supportedLocales = [];
        for (let [, s] of this._localePathComponents)
            supportedLocales.push(s);
        let fallbacks = {};
        for (let [from, to] of this._fallbacks)
            fallbacks[from.toString()] = to.map(v => v.toString());
        return {
            defaultLocale: this._defaultLocale.toString(),
            supportedLocales,
            fallbacks,
            assets: {
                src: this._assetsSrc,
                baseFileNames: this._assetsBaseFileNames.slice(0),
                autoClean: this._assetsAutoClean,
                loaderType: this._assetsLoaderType,
            },
        };
    }

    clone() {
        let r = new LocaleMap(this.reflectOptions());
        r._assets = this._assets;
        r._currentLocale = this._currentLocale;
        return r;
    }
}

export class Gender {
    constructor(key) {
        if (key != constructorPrivateKey)
            throw new Error("Illegal constructor for Gender.");
    }
}

Gender.MALE = new Gender(constructorPrivateKey);
Gender.FEMALE = new Gender(constructorPrivateKey);
Gender.OTHER = new Gender(constructorPrivateKey);

export class LocaleEvent {
    constructor(type) {
        this.type = type;
    }
}
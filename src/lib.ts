import getCountryName from 'country-name';
import countryISO2To3 from 'country-iso-2-to-3';
import LanguageTags from 'language-tags';
import LanguageNameMap from 'language-name-map';
import HttpRequest from 'axios';
import { EventTarget } from 'event-target-shim';
import fsLoader from './FSLoader4NodeJS';

const { getLangNameFromCode } = LanguageNameMap;

const constructorPrivateKey: any = {};

export class Locale {
    private _tag: LanguageTags.Tag;

    constructor(id: string, key?: any) {
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

    public get standardTag(): LanguageTags.Tag {
        return this._tag;
    }

    private _getBasicInfo(): any {
        return getLangNameFromCode(this._tag.language().format());
    }

    public get direction(): Direction {
        let info = this._getBasicInfo();
        return info.dir == 1 ? Direction.LEFT_TO_RIGHT : Direction.RIGHT_TO_LEFT;
    }

    public get internationalName(): string {
        return this._getBasicInfo().name;
    }

    public get nativeName(): string {
        let { country } = this;
        return this._getBasicInfo().native + (country ? ` (${ country.getName(this) })` : '');
    }

    public get country(): Country | null {
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

    public toString(): string {
        return this._tag.format();
    }
}

export enum Direction {
    LEFT_TO_RIGHT = 'leftToRight',
    RIGHT_TO_LEFT = 'rightToLeft',
}

export class Country {
    private _id: string;

    constructor(id: string, key?: any) {
        if (key != constructorPrivateKey)
            throw new Error('Illegal constructor for Country.');
        id = id.toUpperCase();
        id = id.length == 2 ? countryISO2To3(id) : id;
        if (!getCountryName(id, 'en'))
            throw new Error('Unknown country identifier.');
        this._id = id;
    }

    public get internationalName(): string {
        return this.getName(parseLocale('en'));
    }

    public getName(locale: Locale): string {
        return getCountryName(this._id, locale.standardTag.language().format());
    }

    public toString(): string {
        return this._id;
    }
}

const localePool: Map<string, Locale> = new Map;

/**
 * Parses locale identifier. This method performs object pooling,
 * thus calling it multiple times for the same identifier yields
 * the same object reference.
 */
export function parseLocale(id: string): Locale | null {
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

const countryPool: Map<string, Country> = new Map;

/**
 * Parses country identifier. This method performs object pooling,
 * thus calling it multiple times for the same identifier yields
 * the same object reference.
 */
export function parseCountry(id: string): Country | null {
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
    private _currentLocale?: Locale;
    private _localePathComponents: Map<Locale, string>;
    private _supportedLocales: Set<Locale>;
    private _defaultLocale?: Locale;
    private _fallbacks: Map<Locale, Locale[]>;
    private _assets: Map<Locale, any> = new Map;
    private _assetsSrc: string;
    private _assetsBaseFileNames: string[];
    private _assetsAutoClean: boolean;
    private _assetsLoaderType: LocaleMapLoaderType;

    constructor(options: LocaleMapOptions) {
        super();
        let localePathComponents: Map<Locale, string> = new Map;
        let supportedLocales: Set<Locale> = new Set;
        for (let code of options.supportedLocales) {
            let localeParse = parseLocale(code);
            localePathComponents.set(localeParse, code);
            supportedLocales.add(localeParse);
        }
        let fallbacks: Map<Locale, Locale[]> = new Map;
        for (let [k, v] of Object.entries(options.fallbacks || {})) {
            let arrayV = v instanceof Array ? v as any[] : [v];
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

    /**
     * Returns a set of supported locales. This method reflects the locales
     * that were supplied to the `LocaleMap` constructor.
     */
    public get supportedLocales(): Set<Locale> {
        let r: Set<Locale> = new Set;
        for (let locale of this._supportedLocales) r.add(locale);
        return r;
    }

    /**
     * Returns `true` if the specified locale is supported.
     */
    public supportsLocale(arg: Locale): boolean {
        return this._supportedLocales.has(arg);
    }

    /**
     * Returns the currently loaded locale.
     */
    public get currentLocale(): Locale | null {
        return this._currentLocale;
    }

    public async load(newLocale: Locale | null = null): Promise<boolean> {
        if (!newLocale) newLocale = this._defaultLocale;
        if (!this.supportsLocale(newLocale))
            throw new Error(`Unsupported locale: ${newLocale.toString()}`);
        let toLoad: Set<Locale> = new Set;
        toLoad.add(newLocale);
        this._enumerateFallbacks(newLocale, toLoad);

        let newAssets: Map<Locale, any> = new Map;
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

    private async _loadSingleLocale(locale: Locale): Promise<any> {
        let r: any = {};
        let localePathComp = this._localePathComponents.get(locale);
        if (!localePathComp)
            throw new Error(`Fallback locale is not a supported locale: ${locale.toString()}`);
        for (let baseName of this._assetsBaseFileNames) {
            let resPath = `${this._assetsSrc}/${localePathComp}/${baseName}.json`;
            let content: string = '';
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

    private _setResourceDeep(name: string, assign: any, output: any) {
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

    private _enumerateFallbacks(locale: Locale, output: Set<Locale>) {
        let list = this._fallbacks.get(locale);
        if (!list)
            return;
        for (let item of list)
            output.add(item),
            this._enumerateFallbacks(item, output);
    }

    /**
     * Retrieves message by identifier with formatting options.
     */
    public get(id: string, ...options: (number | Gender | Object)[]): string {
        let vars: any = null;
        let gender: Gender | null = null;
        let amountNumber: number | null = null;

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

    private _getWithLocale(locale: Locale, id: string[], vars: any): string | null {
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

    private _applyMessage(message: string, vars: any): string {
        return message.replace(/\$(\$|[A-Za-z0-9_-]+)/g, (_, s) => {
            if (s == '$')
                return '$';
            else return vars[s] || 'undefined';
        });
    }

    private _resolveId(root: any, id: string[]): string | null {
        let r = root;
        for (let frag of id) {
            if (r === undefined || r === null || r.constructor != Object)
                return null;
            r = r[frag];
        }
        return typeof r == 'string' ? r : null;
    }
}

export interface LocaleMapOptions {
    supportedLocales: string[];
    defaultLocale: string;
    fallbacks?: any;
    assets: LocaleMapAssetsOptions;
}

export interface LocaleMapAssetsOptions {
    src: string;
    baseFileNames: string[];
    autoClean?: boolean;
    loaderType: LocaleMapLoaderType;
}

export type LocaleMapLoaderType = 'http' | 'fileSystem';

export class Gender {
    public static MALE: Gender = new Gender(constructorPrivateKey);
    public static FEMALE: Gender = new Gender(constructorPrivateKey);
    public static OTHER: Gender = new Gender(constructorPrivateKey);

    constructor(key?: any) {
        if (key != constructorPrivateKey)
            throw new Error("Illegal constructor for Gender.");
    }
}

export class LocaleEvent {
    public readonly type: string;

    constructor(type: string) {
        this.type = type;
    }
}
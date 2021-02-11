import HttpRequest from 'axios';
import EventTargetShim from 'event-target-shim';
import FSLoader from './FSLoaderForNodeJS.js';
import { Locale, LocaleDirection, Region } from './Locale.js';
import { Enum } from 'com.recoyxgroup.javascript.enum';

const { EventTarget, defineEventAttribute } = EventTargetShim;

export { Locale, LocaleDirection, Region };

export class LocaleMap extends EventTarget {
    constructor(options = {}) {
        super();
        options.assets = options.assets || {};

        this._localePathComponents = new Map;
        if (options.localeSet instanceof Array)
            for (let locale of options.localeSet)
                this._localePathComponents.set(Locale(locale), String(locale));

        this._localeSet = (options.localeSet instanceof Array ? options.localeSet : []).map(id => Locale(id));
        this._defaultLocale = options.defaultLocale ? Locale(options.defaultLocale) : null;
        this._fallbacks = new Map;
        options.fallbacks = options.fallbacks || {};
        for (let fromLang in options.fallbacks) {
            let rawList = options.fallbacks[fromLang];
            rawList = rawList instanceof Array ? rawList : [rawList];
            let list = rawList.map(toLang => Locale(toLang));
            this._fallbacks.set(Locale(fromLang), list);
        }
        this._assets = new Map;
        this._assetTopLevelNames = options.assets.topLevelNames || [];
        this._assetPath = String(options.assets.path || '');
        this._assetLoader = LoaderType(options.assets.loaderType || 'fileSystem') == 'fileSystem' ? FSLoader : HttpLoader;
        this._autoCleanAssets = options.assets.autoClean === undefined ? true : !!options.assets.autoClean;
        this._language = null;
    }

    get defaultLocale() {
        return this._defaultLocale;
    }

    get localeSet() {
        return this._localeSet.slice(0);
    }

    supportsLocale(lang) {
        return this._localeSet.indexOf(Locale(lang));
    }

    getLocale() {
        return this._language;
    }

    async setLocale(language) {
        language = Locale(language);
        if (!this._localeSet.includes(language))
            throw new Error('Unsupported language: ' + language.toString());
        let k = this._language;
        if (language == k) return;
        this._language = language;
        await this.loadAssets();
        if (this._autoCleanAssets) {
            let toClean = this._recursiveFallbacksOf(k);
            toClean.push(k);
            let toKeep = this._recursiveFallbacksOf(language);
            toKeep.push(language);
            toClean = toClean.filter(lang => !toKeep.includes(lang));
            for (let l of toClean)
                this._assets.delete(l);
        }
        this.dispatchEvent(new LocaleEvent('localeupdate'));
    }

    _recursiveFallbacksOf(l) {
        var r = [];
        for (let fl of (this._fallbacks.get(l) || [])) {
            r.push(fl);
            var subresults = this._recursiveFallbacksOf(fl);
            for (let rl of subresults)
                if (!r.includes(rl)) r.push(rl);
        }
        return r;
    }

    async loadAssets() {
        if (!this._language) return;
        let l = this._language;
        let list = this._recursiveFallbacksOf(l);
        list.push(l);
        for (let l of list)
            if (!this._assets.has(l)) await this._assetLoader(this, l);
    }

    t(id, ...options) {
        let variables, gender, amount;

        for (let option of options) {
            if (option.constructor == Object)
                variables = option;
            else if (typeof option == 'number' || typeof option == 'bigint')
                amount = option;
            else if (option instanceof Gender)
                gender = option;
        }

        if (!this._language)
            return id;

        if (typeof amount == 'number' || typeof amount == 'bigint')
            id += amount > 1 ? 'Plural' : amount == 0 ? 'Empty' : 'Single';
        else if (gender)
            id += gender == Gender.MALE ? 'Male' : 'Female';

        let splitId = id.split('.');

        const withLanguage = l => {
            let message = this._resolveId(this._assets.get(l), splitId);
            if (message) return this._applyMessage(message, variables, gender, amount);

            let fallbacks = this._fallbacks.get(l) || [];
            for (let fl of fallbacks) {
                let r = withLanguage(fl);
                if (r !== undefined) return r;
            }
            return undefined;
        };

        let r = withLanguage(this._language);
        return r === undefined ? id : r;
    }

    clone() {
        let clone = new LocaleMap;
        clone._localePathComponents = this._localePathComponents;
        clone._defaultLocale = this._defaultLocale;
        clone._localeSet = this._localeSet;
        clone._fallbacks = this._fallbacks;
        clone._assets = this._assets;
        clone._assetPath = this._assetPath;
        clone._assetTopLevelNames = this._assetTopLevelNames.slice(0);
        clone._assetLoader = this._assetLoader;
        clone._autoCleanAssets = false;
        clone._language = this._language;
        return clone;
    }

    _resolveId(root, splitId) {
        let r = root;
        let l = splitId.length;
        if (!r) return null;
        for (let i = 0; i != l; ++i) {
            r = r[splitId[i]];
            if (r === undefined) return null;
        }
        return typeof r == 'string' ? r : null;
    }

    _applyMessage(message, variables, gender, amount) {
        if (typeof amount == 'number' || typeof amount == 'bigint') {
            variables = variables || {};
            variables.amount = amount;
        }
        let r = message;
        if (variables) {
            r = r.replace(/\$([a-z0-9]+)/, (_, id) => variables[id]);
            r = r.replace('$$', '$');
        }
        return r;
    }

    _assignAssets(language, topLvlName, data) {
        this._assets.set(language, this._assets.get(language) || {});
        let r = this._assets.get(language);
        let idSplit = topLvlName.split('.');
        for (let i = 0; i != idSplit.length - 1; ++i)
            r[idSplit[i]] = r[idSplit[i]] || {};
        r[idSplit[idSplit.length - 1]] = data;
    }
}

defineEventAttribute(LocaleMap.prototype, 'localeupdate');

export class LocaleEvent {
    constructor(type) {
        this.type = type;
    }
}

export const Gender = Enum('Gender', [
    'MALE',
    'FEMALE',
]);

export const LoaderType = Enum('LoaderType', [
    'HTTP',
    'FILE_SYSTEM',
]);

async function HttpLoader(dictRef, language) {
    for (let topLvlName of dictRef._assetTopLevelNames) {
        try {
            let { data } = await HttpRequest.get(dictRef._assetPath + '/' + String(dictRef._localePathComponents.get(language.toString())) + '/' + topLvlName.replace(/\./g, '/') + '.json', {
                responseType: 'json',
            });
            dictRef._assignAssets(language, topLvlName, data);
        }
        catch (e) {
        }
    }
}

export default {
    LocaleMap,
    Gender,
    LoaderType,
    Locale,
    LocaleDirection,
    Region,
};
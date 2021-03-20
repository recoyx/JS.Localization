import LanguageTags from 'language-tags';
import { EventTarget } from 'event-target-shim';

export declare class Locale {
    readonly standardTag: LanguageTags.Tag;
    readonly direction: Direction;
    readonly internationalName: string;
    readonly nativeName: string;
    readonly country?: Country;

    toString(): string;
}

export type Direction = 'leftToRight' | 'rightToLeft';

export declare class Country {
    readonly internationalName: string;
    
    getName(locale: Locale): string;
    toString(): string;
}

/**
 * Parses locale identifier. This method performs object pooling,
 * thus calling it multiple times for the same identifier yields
 * the same object reference.
 */
export declare function parseLocale(id: string): Locale | null;

/**
 * Parses country identifier. This method performs object pooling,
 * thus calling it multiple times for the same identifier yields
 * the same object reference.
 */
export declare function parseCountry(id: string): Country | null;

export declare class LocaleMap extends EventTarget {
    constructor(options: LocaleMapOptions);

    /**
     * Returns a set of supported locales. This method reflects the locales
     * that were supplied to the `LocaleMap` constructor.
     */
    readonly supportedLocales: Set<Locale>;

    /**
     * Returns `true` if the specified locale is supported.
     */
    supportsLocale(arg: Locale): boolean;

    /**
     * Returns the currently loaded locale.
     */
    readonly currentLocale?: Locale;

    /**
     * Attempts to load locale. Returns `false` if any resource fails to load, otherwise `true`.
     * If the method returns `true`, the `currentLocale` property updates accordingly.
     */
    load(newLocale?: Locale): Promise<boolean>;

    /**
     * Retrieves message by identifier with optional formatting options.
     */
    get(id: string, ...options: (number | Gender | Object)[]): string;

    reflectOptions(): LocaleMapOptions;
    clone(): LocaleMap;
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

export declare class Gender {
    static readonly FEMALE: Gender;
    static readonly MALE: Gender;
    static readonly OTHER: Gender;
}

export declare class LocaleEvent {
    constructor(type: string);
}
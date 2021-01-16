import getRegionName from 'country-name';
import LanguageTags from 'language-tags';
import LanguageInfoMap from 'language-name-map';
import getRegionISO3 from 'country-iso-2-to-3';
import { Enum } from 'com.recoyxgroup.javascript.enum';

const { getLangNameFromCode } = LanguageInfoMap;

export const LocaleDirection = Enum('LocaleDirection', [
    'LTR',
    'RTL',
]);

class Locale {
    constructor(languageCode, regionCode = null) {
        if (!Locale._constructorAvailable)
            throw new Error('Illegal constructor for Locale.');
        // BCP 47 language code
        this._languageCode = languageCode;
        // ISO 3166 3-letter country code
        this._regionCode = regionCode;

        Locale._valueOf[languageCode] = this;
    }

    get name() {
        let id = LanguageTags(this._languageCode).language().format();
        let {region} = this;
        return getLangNameFromCode(id).native + (region ? ' (' + region.getName(this) + ')' : '');
    }

    get region() {
        return this._regionCode ? Region(this._regionCode) : null;
    }

    get readType() {
        let id = LanguageTags(this._languageCode).language().format();
        let num = getLangNameFromCode(id).dir;
        return num == 0 ? LocaleDirection.RTL : LocaleDirection.LTR;
    }

    toString() {
        return this._languageCode;
    }
}

Locale._valueOf = {};
Locale._constructorAvailable = true;

new Locale('en-US', 'USA');
new Locale('af');
new Locale('sq');
new Locale('am');
new Locale('ar-DZ');
new Locale('ar-BH');
new Locale('ar-EG');
new Locale('ar-IQ');
new Locale('ar-JO');
new Locale('ar-KW');
new Locale('ar-LB');
new Locale('ar-LY');
new Locale('ar-MA');
new Locale('ar-OM');
new Locale('ar-QA');
new Locale('ar-SA');
new Locale('ar-SY');
new Locale('ar-TN');
new Locale('ar-AE');
new Locale('ar-YE');
new Locale('hy');
new Locale('as');
new Locale('az-AZ');
new Locale('eu');
new Locale('be');
new Locale('bn');
new Locale('bs');
new Locale('bg');
new Locale('my');
new Locale('ca');
new Locale('zh-CN', 'CHN');
new Locale('zh-HK', 'HKG');
new Locale('zh-MO');
new Locale('zh-SG');
new Locale('zh-TW', 'TWN');
new Locale('hr');
new Locale('cs');
new Locale('da');
new Locale('nl-BE');
new Locale('nl-NL');
new Locale('en-AU', 'AUS');
new Locale('en-BZ');
new Locale('en-CA');
new Locale('en-CB');
new Locale('en-GB', 'GBR');
new Locale('en-IN');
new Locale('en-IE');
new Locale('en-JM');
new Locale('en-NZ');
new Locale('en-PH');
new Locale('en-ZA');
new Locale('en-TT');
new Locale('et');
new Locale('mk');
new Locale('fo');
new Locale('fa');
new Locale('fi');
new Locale('fr-BE');
new Locale('fr-CA');
new Locale('fr-FR', 'FRA');
new Locale('fr-LU');
new Locale('fr-CH');
new Locale('gd-IE');
new Locale('gd');
new Locale('de-AT');
new Locale('de-DE');
new Locale('de-LI');
new Locale('de-LU');
new Locale('de-CH');
new Locale('el');
new Locale('gn');
new Locale('gu');
new Locale('he');
new Locale('hi');
new Locale('hu');
new Locale('is');
new Locale('id');
new Locale('it-IT', 'ITA');
new Locale('it-CH');
new Locale('ja', 'JPN');
Locale._valueOf['ja-JP'] = Locale('ja');
Locale._valueOf['jp'] = Locale('ja');
new Locale('kn');
new Locale('ks');
new Locale('kk');
new Locale('km');
new Locale('ko');
new Locale('lo');
new Locale('la');
new Locale('lv');
new Locale('lt');
new Locale('ms-BN');
new Locale('ms-MY');
new Locale('ml');
new Locale('mt');
new Locale('mi');
new Locale('mr');
new Locale('mn');
new Locale('ne');
new Locale('no-NO');
new Locale('or');
new Locale('pl');
new Locale('pt-BR', 'BRA');
new Locale('pt-PT', 'PRT');
new Locale('pa');
new Locale('rm');
new Locale('ro-MO');
new Locale('ro');
new Locale('ru', 'RUS');
new Locale('ru-MO');
new Locale('sa');
new Locale('sr-SP');
new Locale('tn');
new Locale('sd');
new Locale('si');
new Locale('sk');
new Locale('sl');
new Locale('so');
new Locale('sb');
new Locale('es-AR');
new Locale('es-BO');
new Locale('es-CL');
new Locale('es-CO');
new Locale('es-CR');
new Locale('es-DO');
new Locale('es-EC');
new Locale('es-SV');
new Locale('es-GT');
new Locale('es-HN');
new Locale('es-MX');
new Locale('es-NI');
new Locale('es-PA');
new Locale('es-PY');
new Locale('es-PE');
new Locale('es-PR');
new Locale('es-ES');
new Locale('es-UY');
new Locale('es-VE');
new Locale('sw');
new Locale('sv-FI');
new Locale('sv-SE');
new Locale('tg');
new Locale('ta');
new Locale('tt');
new Locale('te');
new Locale('th');
new Locale('bo');
new Locale('ts');
new Locale('tr');
new Locale('tk');
new Locale('uk');
new Locale('ur');
new Locale('uz-UZ');
new Locale('vi');
new Locale('cy');
new Locale('xh');
new Locale('yi');
new Locale('zu');

Locale._constructorAvailable = false;

const LanguageProxy = new Proxy(Locale, {
    apply(obj, thisObj, [lang]) {
        if (lang instanceof Locale) return lang;
        var tag = LanguageTags(lang);
        if (!tag) return null;
        var r = Locale._valueOf[tag.format()];
        return r || null;
    },
});

export { LanguageProxy as Locale };

class Region {
    constructor(regionCode) {
        if (!Region._constructorAvailable)
            throw new Error('Illegal constructor for Region.');
        this._regionCode = regionCode;
        Region._valueOf[this._regionCode] = this;
    }

    getName(language) {
        language = LanguageTags.language(Locale(language).toString()).format();
        return getRegionName(this._regionCode, language);
    }

    toString() {
        return this._regionCode;
    }
}

Region._valueOf = {};
Region._constructorAvailable = true;

new Region('AFG');
new Region('ALA');
new Region('ALB');
new Region('DZA');
new Region('ASM');
new Region('AND');
new Region('AGO');
new Region('AIA');
new Region('ATA');
new Region('ATG');
new Region('ARG');
new Region('ARM');
new Region('ABW');
new Region('AUS');
new Region('AUT');
new Region('AZE');
new Region('BHS');
new Region('BHR');
new Region('BGD');
new Region('BRB');
new Region('BLR');
new Region('BEL');
new Region('BLZ');
new Region('BEN');
new Region('BMU');
new Region('BTN');
new Region('BOL');
new Region('BES');
new Region('BIH');
new Region('BWA');
new Region('BVT');
new Region('BRA');
new Region('IOT');
new Region('BRN');
new Region('BGR');
new Region('BFA');
new Region('BDI');
new Region('CPV');
new Region('KHM');
new Region('CMR');
new Region('CAN');
new Region('CYM');
new Region('CAF');
new Region('TCD');
new Region('CHL');
new Region('CHN');
new Region('CXR');
new Region('CCK');
new Region('COL');
new Region('COM');
new Region('COG');
new Region('COD');
new Region('COK');
new Region('CRI');
new Region('CIV');
new Region('HRV');
new Region('CUB');
new Region('CUW');
new Region('CYP');
new Region('CZE');
new Region('DNK');
new Region('DJI');
new Region('DMA');
new Region('DOM');
new Region('ECU');
new Region('EGY');
new Region('SLV');
new Region('GNQ');
new Region('ERI');
new Region('EST');
new Region('SWZ');
new Region('ETH');
new Region('FLK');
new Region('FRO');
new Region('FJI');
new Region('FIN');
new Region('FRA');
new Region('GUF');
new Region('PYF');
new Region('ATF');
new Region('GAB');
new Region('GMB');
new Region('GEO');
new Region('DEU');
new Region('GHA');
new Region('GIB');
new Region('GRC');
new Region('GRL');
new Region('GRD');
new Region('GLP');
new Region('GUM');
new Region('GTM');
new Region('GGY');
new Region('GIN');
new Region('GNB');
new Region('GUY');
new Region('HTI');
new Region('HMD');
new Region('VAT');
new Region('HND');
new Region('HKG');
new Region('HUN');
new Region('ISL');
new Region('IND');
new Region('IDN');
new Region('IRN');
new Region('IRQ');
new Region('IRL');
new Region('IMN');
new Region('ISR');
new Region('ITA');
new Region('JAM');
new Region('JPN');
new Region('JEY');
new Region('JOR');
new Region('KAZ');
new Region('KEN');
new Region('KIR');
new Region('PRK');
new Region('KOR');
new Region('KWT');
new Region('KGZ');
new Region('LAO');
new Region('LVA');
new Region('LBN');
new Region('LSO');
new Region('LBR');
new Region('LBY');
new Region('LIE');
new Region('LTU');
new Region('LUX');
new Region('MAC');
new Region('MDG');
new Region('MWI');
new Region('MYS');
new Region('MDV');
new Region('MLI');
new Region('MLT');
new Region('MHL');
new Region('MTQ');
new Region('MRT');
new Region('MUS');
new Region('MYT');
new Region('MEX');
new Region('FSM');
new Region('MDA');
new Region('MCO');
new Region('MNG');
new Region('MNE');
new Region('MSR');
new Region('MAR');
new Region('MOZ');
new Region('MMR');
new Region('NAM');
new Region('NRU');
new Region('NPL');
new Region('NLD');
new Region('NCL');
new Region('NZL');
new Region('NIC');
new Region('NER');
new Region('NGA');
new Region('NIU');
new Region('NFK');
new Region('MKD');
new Region('MNP');
new Region('NOR');
new Region('OMN');
new Region('PAK');
new Region('PLW');
new Region('PSE');
new Region('PAN');
new Region('PNG');
new Region('PRY');
new Region('PER');
new Region('PHL');
new Region('PCN');
new Region('POL');
new Region('PRT');
new Region('PRI');
new Region('QAT');
new Region('REU');
new Region('ROU');
new Region('RUS');
new Region('RWA');
new Region('BLM');
new Region('SHN');
new Region('KNA');
new Region('LCA');
new Region('MAF');
new Region('SPM');
new Region('VCT');
new Region('WSM');
new Region('SMR');
new Region('STP');
new Region('SAU');
new Region('SEN');
new Region('SRB');
new Region('SYC');
new Region('SLE');
new Region('SGP');
new Region('SXM');
new Region('SVK');
new Region('SVN');
new Region('SLB');
new Region('SOM');
new Region('ZAF');
new Region('SGS');
new Region('SSD');
new Region('ESP');
new Region('LKA');
new Region('SDN');
new Region('SUR');
new Region('SJM');
new Region('SWE');
new Region('CHE');
new Region('SYR');
new Region('TWN');
new Region('TJK');
new Region('TZA');
new Region('THA');
new Region('TLS');
new Region('TGO');
new Region('TKL');
new Region('TON');
new Region('TTO');
new Region('TUN');
new Region('TUR');
new Region('TKM');
new Region('TCA');
new Region('TUV');
new Region('UGA');
new Region('UKR');
new Region('ARE');
new Region('GBR');
new Region('USA');
new Region('UMI');
new Region('URY');
new Region('UZB');
new Region('VUT');
new Region('VEN');
new Region('VNM');
new Region('VGB');
new Region('VIR');
new Region('WLF');
new Region('ESH');
new Region('YEM');
new Region('ZMB');
new Region('ZWE');

Region._constructorAvailable = false;

const RegionProxy = new Proxy(Region, {
    apply(base, thisArg, [code]) {
        code = String(code).toUpperCase();
        code = code.length == 2 ? getRegionISO3(code) : code;
        return Region._valueOf[code] || null;
    },
});

export { RegionProxy as Region };
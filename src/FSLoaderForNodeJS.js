import * as fs from 'fs';
import * as path from 'path';

export default function loader(dictRef, language) {
    return new Promise(resolve => {
        let resolvedCount = 0;
        let length = dictRef._assetTopLevelNames.length;
        for (let topLvl of dictRef._assetTopLevelNames) {
            fs.readFile(path.resolve(dictRef._assetPath, String(dictRef._localePathComponents.get(language.toString())), topLvl.replace(/\./g, '/') + '.json'), 'utf8', function(error, data) {
                if (!error)
                    dictRef._assignAssets(language, topLvl, JSON.parse(data));
                if (++resolvedCount == length)
                    resolve();
            });
        }
    });
}
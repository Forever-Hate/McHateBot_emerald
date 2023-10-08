
import { Language } from '../models/files';
import { logger } from './logger';
import { config } from './util';

class LocalizationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalizationException";
  }
}
export let localizer:Localization;
export class Localization
{
  language:Language;

  /**
   * 格式化內容
   * @param { string } value - 語言路徑
   * @param { Map<string, any> } map - 格式內容
   * @returns { string | string[] } 返回轉換後的結果
  */
  format(value: string, map?: Map<string, any> | undefined):string | string[]
  {
    logger.i(`進入format，Map值為 ${map}`)
    const unformatted :string | string[] = this.language[value];
    if (map == undefined)
    {
      logger.d(`map為空，返回原字串`)
      return unformatted;
    }
    if(typeof unformatted === "object")
    {
      logger.d(`map為非字串，拆解、格式化後回傳`)
      for(const [index,words] of unformatted.entries())
      {
        const formatted = words.replace(/\${(\w+)}/g, (match, index) => {
          logger.d(`回傳${map.get(index) || match}`)
          return map.get(index) || match; 
        });
        unformatted[index] = formatted
      }
      return unformatted;
    }
    logger.d("=======Map值=======")
    map.forEach((value, key) => {
      logger.d(`- key: ${key}, value: ${value}`);
    });
    logger.d("===================")
    const formatted = unformatted.replace(/\${(\w+)}/g, (match, index) => {
      logger.d(`回傳 ${map.get(index) || match}`)
      return map.get(index) || match; 
    });
    logger.d(`格式化後的值 ${formatted}`)
    return formatted;
  }

  /**
   * 內部函數，取得語言檔資料
   * @param { string } path - 檔案路徑
   * @returns { Language } 返回語言檔
  */
  _getLanguage(path: string): Language 
  {
    try {
      delete require.cache[require.resolve(path)];
      const language:Language = require(path)
      if (language === undefined) {
        throw new LocalizationException(`no such path:${path} in ${config.language}.json`);
      } else {
        return language;
      }
    } catch (e:any | unknown) {
      return e.toString();
    }
  }

  constructor()
  {
    logger.i("建立Localization物件")
    this.language = this._getLanguage(`${process.cwd()}/language/${config.language}.json`);
  }
}

export default function setLocalization()
{
  logger.i("進入setLocalization，建立一個新的Localization物件")
  localizer = new Localization()
}

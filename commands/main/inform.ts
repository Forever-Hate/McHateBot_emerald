import { localizer } from "../../utils/localization";
import { logger } from "../../utils/logger";
import { bot } from "./bot"

export let informer:Informer; 

export class Informer 
{
    map = new Map<string, any>();
    version_str: string = process.env.VERSION!;
    author_dc: string = process.env.AUTHOR_DC!;
    author_id: string = process.env.AUTHOR_ID!;

    /**
     * 查詢當前經驗值
     * @param { string | undefined } playerId 下指令的玩家ID
     * @param { boolean | undefined } isfromdiscord 是否從discord發送指令
     * @returns { string } 要傳遞給玩家的訊息
     */
    experience(playerId: string | undefined,isfromdiscord:boolean | undefined = false):string
    {
        logger.i("進入experience，查詢此bot的經驗值")
        this._setMap();
        if(!isfromdiscord)
        {
           bot.chat(`/m ${playerId} ${localizer.format("EXP",this.map)}`); 
        }
        return localizer.format("EXP",this.map) as string;
        
    }

    /**
     * 查詢指令
     * @param { string | undefined } playerId - 下指令的玩家ID
     * @param { boolean | undefined } isfromdiscord 是否從discord發送指令
     * @returns { string } 要傳遞給玩家的訊息
     */
    help(playerId: string | undefined,isfromdiscord:boolean | undefined = false):string[]
    {
        logger.i("進入help，查詢此bot的指令")
        this._setMap();
        if(!isfromdiscord)
        {
            bot.chat(`/m ${playerId} ${localizer.format("HELP",this.map)}`);
        }
        (localizer.format("COMMAND_LIST",this.map) as string[]).forEach((str, index) => {
            logger.l(str);
        })
        return localizer.format("COMMAND_LIST",this.map) as string[] 
    }

    /**
     * 查詢當前bot版本，並發送私訊
     * @param { string } playerId - 下指令的玩家ID
     * @param { boolean | undefined } isfromdiscord 是否從discord發送指令
     * @returns { string } 要傳遞給玩家的訊息
     */
    version(playerId: string | undefined,isfromdiscord:boolean | undefined = false):string
    {
        logger.i("進入version，查詢此bot的版本，並發送私訊")
        this._setMap();
        if(!isfromdiscord)
        {
            bot.chat(`/m ${playerId} ${localizer.format("VERSION",this.map)}`);
        }
        return localizer.format("VERSION",this.map) as string;
    }

    /**
     * 查詢關於此bot的資訊
     * @param { string } playerId - 下指令的玩家ID
     * @param { boolean | undefined } isfromdiscord 是否從discord發送指令
     * @returns { string[] } 要傳遞給玩家的訊息
     */
    about(playerId: string | undefined,isfromdiscord:boolean | undefined = false):string[]
    {
        logger.i("進入about，查詢此bot的資訊")
        this._setMap();
        const content: string[] = localizer.format("ABOUT",this.map) as string[];
        if(!isfromdiscord)
        {
            content.forEach((c: string, index: number) => {
                setTimeout(() => {
                    bot.chat(`/m ${playerId} ${c}`);
                }, 500 * (index + 1));
            });
        }
        return content;
    }

    /**
     * 內部函數，建立變數的映射值
     */
    _setMap() 
    {
        logger.i("進入_setMap，設定變數的映射值")
        this.map.set("level", bot.experience.level);
        this.map.set("points", bot.experience.points);
        this.map.set("percent", Math.round(bot.experience.progress * 100));
        this.map.set("version", this.version_str);
        this.map.set("author_dc", this.author_dc);
        this.map.set("author_id", this.author_id);
    }
    
    constructor()
    {
        logger.i("建立Informer物件")
    }

}

export default function setInformer()
{
    logger.i("進入setInformer，建立一個新的Informer物件");
    informer = new Informer();
}


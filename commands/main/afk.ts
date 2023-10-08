import { localizer } from "../../utils/localization";
import { logger } from "../../utils/logger";
import { LocationType, findReachableHomeLocation, findReachableWarpLocation, getValidLocationType, settings } from "../../utils/util";
import { discordManager } from "../communicate/dc";
import { bot } from "./bot";

export let afkManager:AfkManager;

class AfkManager {

    afkIndex:number = 1; //當前掛機index
    currentPlace:string = ""; //當前掛機地點
    currentServer:number = 0; //當前分流
    map:Map<string,string> = new Map();

    /**
     * 掛機
     * @param { string } playerId 下指令的玩家ID
     * @param { boolean } isfromdiscord 是否從discord發送指令
     * @returns { Promise<string> } 錯誤/成功訊息
     */
    async afk(playerId:string,isfromdiscord:boolean = false):Promise<string> 
    {
        return new Promise((resolve)=>{
            logger.i("進入afk，開始掛機")
            this._findPlace(playerId,isfromdiscord).catch((reason)=>{
                resolve(reason)
            })
            .then((msg)=>{
                resolve(msg as string)
            })
        })
    }

    /**
     * 內部函數，找尋能夠存綠的地點
     * @param { string } playerId 下指令的玩家ID
     * @param { boolean } isfromdiscord 是否從discord發送指令
     * @returns { Promise<string> } 錯誤/成功訊息
     */
    async _findPlace(playerId:string,isfromdiscord:boolean = false):Promise<string> 
    {
        logger.i("進入_findPlace，開始尋找掛機地點")
        return new Promise(async (resolve)=>{
            if(this.afkIndex === settings.afk_place.length + 1)
            {
                logger.d("結束了")
                if(!isfromdiscord)
                {
                    bot.chat(`/m ${playerId} ${localizer.format("AFK_PLACE_NOT_FOUND",this.map)}`)
                }
                else
                {
                    discordManager.send("",localizer.format("AFK_PLACE_NOT_FOUND",this.map) as string)
                }
                return
            }
            this.currentPlace = settings.afk_place[this.afkIndex-1]
            this._setMap()
            if(!isfromdiscord)
            {
                bot.chat(`/m ${playerId} ${localizer.format("AFK_ON_THE_WAY",this.map)}`)
            }
            else
            {
                discordManager.send("",localizer.format("AFK_ON_THE_WAY",this.map) as string)
                resolve(localizer.format("DC_COMMAND_EXECUTED",this.map) as string)
            }
            const currentLocationType:LocationType = getValidLocationType(this.currentPlace)
            if(currentLocationType === LocationType.Warp)
            {
                await findReachableWarpLocation(this.currentPlace).then(async () => {
                    logger.d("已找到地點，開始掛機")
                    if(!isfromdiscord)
                    {
                        bot.chat(`/m ${playerId} ${localizer.format("AFK_FOUND_PLACE",this.map)}`)
                    }
                    else
                    {
                        discordManager.send("",localizer.format("AFK_FOUND_PLACE",this.map) as string)
                    }
                    await new Promise(resolve => setTimeout(resolve, 3000)); //延遲3秒
                    await this._findMinecart(playerId,isfromdiscord)
                }).catch(async () => {
                    logger.d("無法抵達公傳點")
                    if(!isfromdiscord)
                    {
                        bot.chat(`/m ${playerId} ${localizer.format("AFK_CANT_GO_THETE_ERROR",this.map)}`)  
                    }
                    else
                    {
                        discordManager.send("",localizer.format("AFK_CANT_GO_THETE_ERROR",this.map) as string)
                    }
                    await new Promise(resolve => setTimeout(resolve, 3000)); //延遲3秒
                    this.afkIndex++
                    this._findPlace(playerId,isfromdiscord).then((msg)=>{
                        resolve(msg)
                    })
                })
            }
            else if(currentLocationType === LocationType.Home)
            {
                try
                {

                    this.currentServer = parseInt(bot.tablist.header.extra![54].json['text'].slice(2))
                    const matches = bot.tablist.header.extra!.filter((msg) => {
                        return msg.json['text'].startsWith('分流');
                    });
                    this.currentServer = parseInt(matches[0].json['text'].slice(2))
                    await findReachableHomeLocation(this.currentServer,this.currentPlace).then(async () => {
                        logger.d("已找到地點，開始掛機")
                        if(!isfromdiscord)
                        {
                            bot.chat(`/m ${playerId} ${localizer.format("AFK_FOUND_PLACE",this.map)}`)
                        }
                        else
                        {
                            discordManager.send("",localizer.format("AFK_FOUND_PLACE",this.map) as string)
                        }
                        await new Promise(resolve => setTimeout(resolve, 3000)); //延遲3秒
                        await this._findMinecart(playerId,isfromdiscord)
                    })
                }
                catch(error)
                {
                    logger.e(`錯誤:${error}`)
                    logger.d("無法取得當前所在分流或無法前往Home點")
                    this.currentServer = 0
                    if(!isfromdiscord)
                    {
                       bot.chat(`/m ${playerId} ${localizer.format("AFK_NOT_ENOUGH_PLACE_ERROR",this.map)}`)  
                    }
                    else
                    {
                        discordManager.send("",localizer.format("AFK_NOT_ENOUGH_PLACE_ERROR",this.map) as string)
                    }
                    this.afkIndex++
                    this._findPlace(playerId,isfromdiscord).then((msg)=>{
                        resolve(msg)
                    })
                }
            }
        })
    }

    /**
     * 內部函數，找尋礦車
     * @param { string } playerId 下指令的玩家ID
     * @param { boolean } isfromdiscord 是否從discord發送指令
     * @returns { Promise<string> } 錯誤/成功訊息
     */
    async _findMinecart(playerId:string,isfromdiscord:boolean = false):Promise<string>
    {
        logger.i("進入_findMinecart，找尋礦車")
        let minecart
        for(const entity in bot.entities)
        {
            if(bot.entities[entity].name === "minecart" && bot.entity.position.distanceTo(bot.entities[entity].position) <= 5)
            {
                minecart = bot.entities[entity]
                break
            }
        }
        if(minecart)
        {
            bot.mount(minecart)
            if(!isfromdiscord)
            {
                bot.chat(`/m ${playerId} ${localizer.format("AFK_FOUND_MINECART")}`)
            }
            else
            {
                discordManager.send("",localizer.format("AFK_FOUND_MINECART") as string)
            }
            return localizer.format("AFK_FOUND_MINECART") as string
        }
        else
        {
            if(!isfromdiscord)
            {
                bot.chat(`/m ${playerId} ${localizer.format("AFK_NOT_FOUND_MINECART")}`)
            }
            else
            {
                discordManager.send("",localizer.format("AFK_FOUND_MINECART") as string)
            }
            return localizer.format("AFK_NOT_FOUND_MINECART") as string
        }
            
    }

    /**
     * 內部函數，建立變數的映射值
     */
    _setMap()
    {
        logger.i("進入_setMap，設定變數的映射值")
        this.map.set("index",this.afkIndex.toString())
        this.map.set("place",this.currentPlace.includes("-") ? `[分 流:${this.currentPlace.split("-")[0]} 家 點:${this.currentPlace.split("-")[1]}]`: `公傳點:${this.currentPlace}`);
    }
    constructor(){
        logger.i("建立一個AfkManager物件")
    }
}
export default function setAfkManager()
{
    logger.i("進入setAfkManager，建立一個新的AfkManager物件")
    afkManager = new AfkManager();
}


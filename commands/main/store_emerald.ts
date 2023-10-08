import { Block } from 'prismarine-block';

import { localizer } from "../../utils/localization";
import { logger } from "../../utils/logger";
import { LocationType, RestartNotifier, findReachableHomeLocation, findReachableWarpLocation, formatThousandths, formatTime, getDiscordStoreLogEmbed, getValidLocationType, get_window, settings } from "../../utils/util";
import { bot } from "./bot";
import { Item } from 'prismarine-item';
import { discordManager } from '../communicate/dc';
import { discardItemer } from '../../utils/discarditem';
import { afkManager } from './afk';

export let storeEmeraldManager:StoreEmeraldManager;

/**
 * 盒子錯誤狀態
 * 1. 空的
 * 2. 有垃圾
 */
const enum ShulkerBoxError {
    Empty,
    HasTrash
}
export class StoreLog {
    playerId:string
    totalTime:string
    currentSaveCount:string
    currentFixCount:string
    currentFixAmount:string
    currentEmptyCount:string
    savedMoney:string
    reason:string

    map:Map<string,string> = new Map<string,string>();

    constructor(playerId:string,totalTime:string,currentSaveCount:string,currentFixCount:string,currentFixAmount:string,currentEmptyCount:string,savedMoney:string,reason:string)
    {
        this.playerId = playerId
        this.totalTime = totalTime
        this.currentSaveCount = currentSaveCount
        this.currentFixCount = currentFixCount
        this.currentFixAmount = currentFixAmount
        this.currentEmptyCount = currentEmptyCount
        this.savedMoney = savedMoney
        this.reason = reason
    }
    /**
     * 轉換成字串
     * @returns { string[] } StoreLog的所有資訊
     */
    toString():string[]
    {
        logger.i("進入toString，將StoreLog物件轉換成字串陣列")
        const sList:string[] = []
        this.map.set("totalTime",this.totalTime)
        this.map.set("player",this.playerId)
        this.map.set("saveCount",this.currentSaveCount)
        this.map.set("savedMoney",this.savedMoney)
        this.map.set("fixCount",this.currentFixCount)
        this.map.set("fixAmount",this.currentFixAmount)
        this.map.set("emptyCount",this.currentEmptyCount)
        this.map.set("reason",this.reason)
        sList.push(localizer.format("STORE_BANNER",this.map) as string)
        for(let i = 1; i < 9; i++)
        {
            sList.push(localizer.format(`STORE_LINE_${i}`,this.map) as string)
        }
        sList.push(localizer.format("STORE_BANNER",this.map) as string)
        return sList
    }
    /**
     * 轉換成Json
     * @returns { string } Json字串
     */
    toJson():{}
    {
        return {
            "playerId":this.playerId,
            "totalTime":this.totalTime,
            "currentSaveCount":`${this.currentSaveCount}次`,
            "savedMoney":`$${this.savedMoney}元`,
            "currentFixCount":`${this.currentFixCount}次`,
            "currentFixAmount":`$${this.currentFixAmount}元`,
            "currentEmptyCount":`${this.currentEmptyCount}次`,
            "reason":this.reason
        }
    }
}

class StoreEmeraldManager
{
    map:Map<string,string> = new Map();
    isProcessing:boolean = false; //是否正在執行中
    enableSaveEmerald:boolean = true; //是否要繼續存綠寶石
    trashList:Item[] = []; //垃圾清單
    storeIndex:number = 1; //當前index
    currentSaveCount:number = 0 //當前儲存的次數
    currentFixCount:number = 0 //當前修正次數
    currentFixAmount:number = 0 //當前修正總金額
    currentEmptyCount:number = 0 //當前空盒次數
    currentPlace:string = ""; //當前地點
    currentServer:number = 0; //當前分流
    receiver = RestartNotifier.getInstance(); //接收是否進入等待室事件
    isShulkerBoxBroken:boolean = true; //是否有盒子被破壞
    reason:string = "無";
    startTime:Date | null = null; //開始存綠時間
    endTime:Date | null = null; //結束存綠時間
    
    //給恢復工作用的變數(進等待室後重新執行)
    playerId:string = "";
    isfromdiscord:boolean = false;

    /**
     * 指令的入口，存綠
     * @param { string } playerId 下指令的玩家ID
     * @param { string[] } args 指令參數
     * @param { boolean } isfromdiscord 是否從discord發送指令
     * @returns { Promise<string> } 錯誤/成功訊息
     */
    async storeEmerald(playerId:string,args:string[],isfromdiscord:boolean = false):Promise<string>
    {
        logger.i("進入storeEmerald，存綠指令的入口")
        return new Promise(async (resolve)=>{
            this._init()
            if (settings.enable_multiple_place_store) 
            {
                logger.d("有開啟多點卸盒")
                if(args.length >= 2)
                {
                    logger.d("參數長度大於2")
                    this.storeIndex = parseInt(args[1])
                    if(this.storeIndex <= 0 || this.storeIndex > settings.store_place.length || isNaN(this.storeIndex))
                    {
                        logger.d(`參數格式錯誤，輸入的參數為: ${args[1]}`)
                        if(!isfromdiscord)
                        {
                            bot.chat(`/m ${playerId} ${localizer.format("STORE_FORMAT_ERROR",this.map)}`)
                        }
                        
                        return resolve(localizer.format("STORE_FORMAT_ERROR",this.map) as string)
                    }
                    if(args.length === 3)
                    {
                        logger.d("有輸入備註")
                        this.reason = args[2]
                    }     
                }
                else
                {
                    logger.d("參數長度不為2")
                    this.storeIndex = 1
                }
                if (settings.store_place.length === 0 || settings.store_place[0] === "") 
                {
                    logger.d("未填入任何地點或第一個地點為空字串")
                    if(!isfromdiscord)
                    {
                        bot.chat(`/m ${playerId} ${localizer.format("STORE_NO_ENOUGH_PLACE_ERROR",this.map)}`)
                    }
                    resolve(localizer.format("STORE_NO_ENOUGH_PLACE_ERROR",this.map) as string)
                } 
                else 
                {
                    this.startTime = new Date();
                    resolve(await this._findPlace(playerId,isfromdiscord))
                }
            }
            else
            {
                if(args.length >= 2)
                {
                    logger.d("有輸入備註")
                    this.reason = args[1]
                }
                this.startTime = new Date();  
                this._checkInventory()
                .then(()=>{
                    this.playerId = playerId;
                    this.isfromdiscord = isfromdiscord;
                    this.isProcessing = true;
                    this._storeEmerald(playerId,isfromdiscord)
                    if(!isfromdiscord)
                    {
                        bot.chat(`/m ${playerId} ${localizer.format("STORE_START",this.map)}`)
                    }
                    else
                    {
                        discordManager.send("",localizer.format("STORE_START",this.map) as string)
                    }
                    resolve(localizer.format("DC_COMMAND_EXECUTED",this.map) as string)
                })
                .catch((error)=>{
                    this._init();
                    if(!isfromdiscord)
                    {
                        bot.chat(`/m ${playerId} ${error}`)   
                    }
                    else
                    {
                        discordManager.send("",error)
                    }
                    resolve(error)
                })
            } 
            
        })

        
    }
    /**
     * 停止存綠
     * @param { string } playerId 下指令的玩家ID
     * @param { boolean } isfromdiscord 是否從discord發送指令
     * @returns { Promise<string> } 錯誤/成功訊息
     */
    async stopStoreEmerald(playerId:string,isfromdiscord:boolean = false):Promise<string>
    {
        logger.i("進入stopStoreEmeral，停止存綠")
        if(this.isProcessing)
        {
            logger.d("執行中")
            this._writeAndSendReport(playerId,isfromdiscord)
            this.isProcessing = false;
            this.enableSaveEmerald = false;
            if(!isfromdiscord)
            {
                bot.chat(`/m ${playerId} ${localizer.format("STORE_STOP",this.map)}`)
            }
            return localizer.format("STORE_STOP",this.map) as string
        }
        else
        {
            logger.d("未執行中")
            if(!isfromdiscord)
            {
                bot.chat(`/m ${playerId} ${localizer.format("STORE_NOT_PROCESS_ERROR",this.map)}`)
            }
            return localizer.format("STORE_NOT_PROCESS_ERROR",this.map) as string
        }
    }
    /**
     * 內部函數，檢查背包空間是否充足
     * 
     * 超過10個雜物會丟出，多的綠寶石會存入bank
     */
    async _checkInventory():Promise<void>
    {
        logger.i("進入_checkInventory，檢查背包空間是否充足")
        return new Promise(async (resolve,reject)=>{ 
            let numOfEmerald = 0;
            let numOfAnotherItem = 0;
            const anotherItemList = []
            for(const item of bot.inventory.items())
            {
                if(item.type === bot.registry.itemsByName["emerald"].id)
                {
                    numOfEmerald += item.count;
                }
                else
                {
                    numOfAnotherItem += 1;
                    anotherItemList.push(item)
                }
            }
            //如果雜物超過10個的話
            if(numOfAnotherItem >= 10)
            {
                logger.d("雜物超過10個")
                if(settings.enable_auto_repair)
                {
                    logger.d("有開啟自動修復")
                    await discardItemer.tossItemFromList(anotherItemList)
                }
                else
                {
                    logger.d("未開啟自動修復")
                    reject(localizer.format("STORE_NOT_ENOUGH_INVENTORY_ERROR",this.map))
                    return
                }
            } 
            if(numOfEmerald !== 0)
            {
                logger.d("有遺留綠寶石")
                this.currentSaveCount -= 1; //預先減一次，才不會造成錯誤的統計
                this.currentFixCount -= 1; //預先減一次，才不會造成錯誤的統計
                await this._fixEmeraldAmount(1728 - numOfEmerald)
                await this._saveEmerald()
            }
            resolve()
        })
    }
    /**
     * 內部函數，存綠
     * 透過setTimeout自身達成循環
     * 
     * 流程:找盒子、取出綠寶石、存綠
     * @param { string } playerId 下指令的玩家ID
     * @param isfromdiscord 
     */
    async _storeEmerald(playerId:string,isfromdiscord:boolean = false):Promise<void> 
    {
        logger.i("進入_storeEmerald，存綠的主循環")
        await this._findShulkerBox().then(async (shulkerboxToOpen)=>{
            await this._takeEmerald(playerId,shulkerboxToOpen,isfromdiscord).then(async (isNeedStoreEmerald)=>{
                if(isNeedStoreEmerald)
                {
                    logger.d("需要存綠")
                    await this._saveEmerald()
                }
                else
                {
                    logger.d("不需要存綠")
                }
                if(this.enableSaveEmerald)
                {
                    logger.d("繼續存綠")
                    setTimeout(()=>{
                        this._storeEmerald(playerId,isfromdiscord)
                    },settings.store_emerald_interval * 1000)
                }
                else
                {
                    logger.d("不繼續存綠")
                }
            })
            .catch((error)=>{
                logger.e(error)
                if(error === ShulkerBoxError.HasTrash)
                {
                    logger.d("盒子裡有異物")
                    if(!isfromdiscord)
                    {
                        bot.chat(`/m ${playerId} ${localizer.format("STORE_SHULKER_BOX_HAS_TRASH_ERROR",this.map)}`);
                    }
                    else
                    {
                        discordManager.send("",`${localizer.format("STORE_SHULKER_BOX_HAS_TRASH_ERROR",this.map)}`);
                    }
                }
                else if(error === ShulkerBoxError.Empty)
                {
                    logger.d("盒子是空的")
                    if(!isfromdiscord)
                    {
                        bot.chat(`/m ${playerId} ${localizer.format("STORE_SHULKER_BOX_EMPTY_ERROR",this.map)}`);
                    }
                    else
                    {
                        discordManager.send("",`${localizer.format("STORE_SHULKER_BOX_EMPTY_ERROR",this.map)}`);
                    }
                }
                this._writeAndSendReport(playerId,isfromdiscord)
                this._init();

            })
        }).catch(()=>{
            logger.d("沒有盒子了")
            if(settings.enable_multiple_place_store)
            {
                logger.d("前往下一地點")
                if(!isfromdiscord)
                {
                    bot.chat(`/m ${playerId} ${localizer.format("STORE_GO_TO_NEXT_PLACE",this.map)}`)
                }
                else
                {
                    discordManager.send("",localizer.format("STORE_GO_TO_NEXT_PLACE",this.map) as string)
                }
                this.storeIndex++;
                this._findPlace(playerId,isfromdiscord)
            }
            else
            {
                logger.d("結束")
                this._writeAndSendReport(playerId,isfromdiscord)
                this._init();
                if(settings.enable_afk_after_store)
                {
                    logger.d("有開啟結束後去掛機")
                    afkManager.afk(playerId,isfromdiscord)
                }
                else
                {
                    logger.d("未開啟結束後去掛機")
                    if(!isfromdiscord)
                    {
                        bot.chat(`/m ${playerId} ${localizer.format("STORE_DONE",this.map)}`)
                    }
                    else
                    {
                        discordManager.send("",localizer.format("STORE_DONE",this.map) as string)
                    }
                }
            }
        })
    }
    /**
     * 內部函數，領出綠寶石來補足數量
     * @param {number} count - 需領出的綠寶石數量 
     */
    async _fixEmeraldAmount(count:number):Promise<void>
    {
        logger.i("進入_fixEmeraldAmount，修正持有的綠寶石數量")
        if(count !== 0)
        {
            logger.d(`需要提領的數量為: ${count}個`)
            this.currentFixAmount += count;
            this.currentFixCount += 1;

            const clicksFor64Emeralds = Math.floor(count / 64); //64個綠寶石的提領次數
            const clicksFor8Emeralds = Math.floor((count - clicksFor64Emeralds * 64) / 8); //8個綠寶石的提領次數
            const clicksFor1Emerald = count % 8; //1個綠寶石的提領次數
            const bankWindow = await get_window("bank")
            for (let i = 0; i < clicksFor64Emeralds; i++) {
                await bot.simpleClick.leftMouse(20)
                await new Promise(resolve => setTimeout(resolve, 1000)); //延遲1秒
            }

            for (let i = 0; i < clicksFor8Emeralds; i++) {
                await bot.simpleClick.leftMouse(19)
                await new Promise(resolve => setTimeout(resolve, 1000)); //延遲1秒
            }

            for (let i = 0; i < clicksFor1Emerald; i++) {
                await bot.simpleClick.leftMouse(18)
                await new Promise(resolve => setTimeout(resolve, 1000)); //延遲1秒
            }
            bot.closeWindow(bankWindow)
        }
    }
    /**
     * 內部函數，取得盒子實例
     * @param currentAttempts 當前已檢測的次數
     * @returns { Promise<Block> } 盒子實例
     */
    async _findShulkerBox(currentAttempts:number = 0):Promise<Block> 
    {
        logger.d("進入_findShulkerBox，尋找盒子")
        return new Promise(async (resolve,reject) =>{
            if(currentAttempts >= settings.store_emerald_check_times)
            {
                reject();
            }
            else
            {
                const shulkerboxToOpen = bot.findBlock({
                    matching: bot.registry.blocksByName["shulker_box"].id,
                    count: 1,
                    maxDistance: 8,
                })
                if(!shulkerboxToOpen || !this.isShulkerBoxBroken)
                {
                    logger.d("沒有找到界伏盒")
                    setTimeout(async () => {
                        try 
                        {
                          resolve(await this._findShulkerBox(currentAttempts + 1));
                        } 
                        catch (error) 
                        {
                          reject(); 
                        }
                    }, 1000);
                }
                else
                {
                    this.isShulkerBoxBroken = false;
                    logger.d("有找到界伏盒")
                    resolve(shulkerboxToOpen)
                }
            }
           
        })
    }
    /**
     * 內部函數，取出綠寶石
     * 
     * 會檢查3次是否皆為空盒狀態，丟出error
     * @param { string } playerId 下指令的玩家ID
     * @param { Block } shulkerboxToOpen 要開啟的Block實例 
     * @param isfromdiscord 是否從discord發送指令
     * @param currentAttempts 當前已檢測的次數
     * @returns { Promise<boolean | void> } 需不需要存綠寶石
     */
    async _takeEmerald(playerId:string,shulkerboxToOpen:Block,isfromdiscord:boolean,currentAttempts:number = 0):Promise<boolean | void>
    {
        logger.i("進入_takeEmerald，取出綠寶石(必要時修正持有數量)")
        const maxAttempts = 3;

        return new Promise(async (resolve,reject)=>{
            if(currentAttempts >= maxAttempts)
            {
                this.currentEmptyCount += 1;
                if(settings.enable_auto_repair)
                {
                    logger.d("有開啟自動修復，將空盒敲掉")
                    await bot.dig(shulkerboxToOpen)
                    this.isShulkerBoxBroken = true //手動更改為true，不然會無法繼續存綠
                    resolve(false)
                }
                else
                {
                   reject(ShulkerBoxError.Empty) 
                }
            }
            else
            {
                await bot.lookAt(shulkerboxToOpen.position, false)
                const shulkerBoxWindow = await bot.openContainer(shulkerboxToOpen)
                let numOfEmerald:number = 0
                if (shulkerBoxWindow.containerItems().length !== 0) 
                {
                    logger.d("盒子內有物品")
                    for (const item of shulkerBoxWindow.containerItems()) 
                    {
                        try 
                        {
                            if (item.type !== bot.registry.itemsByName["emerald"].id) 
                            {
                                this.trashList.push(item)
                            }
                            else
                            {
                                numOfEmerald += item.count
                            }
                            await shulkerBoxWindow.withdraw(item.type, item.metadata, item.count)
                        } 
                        catch (e) 
                        {
                            logger.e(`cant take it:${e}`)
                        }
                    }
                    logger.d(numOfEmerald)

                    shulkerBoxWindow.close()
                    if (this.trashList.length !== 0) 
                    {
                        logger.d("有異物")
                        if(settings.enable_auto_repair)
                        {
                            logger.d("有開啟自動修復")
                            await discardItemer.tossItemFromList(this.trashList)
                            this.trashList = [];
                        }
                        else
                        {
                            reject(ShulkerBoxError.HasTrash)
                        }
                    }
        
                    if(numOfEmerald > 0 && numOfEmerald < 1728)
                    {
                        logger.d(`盒子內數量為 ${numOfEmerald}個無法存入，須修正數量`)
                        await this._fixEmeraldAmount(1728 - numOfEmerald)
                        resolve(true)
                    }
                    else
                    {
                        resolve(true)
                    }
                }
                else 
                {
                    logger.d("盒子內沒有物品")
                    shulkerBoxWindow.close()
                    setTimeout(async ()=>{
                        await this._takeEmerald(playerId,shulkerboxToOpen,isfromdiscord,currentAttempts + 1)
                        .then(() => {
                            resolve(); 
                        })
                        .catch((error) => {
                            reject(error); 
                        });
                    },1000)
                }
            }
        })
    }
    /**
     * 內部函數，存入綠寶石
     * @returns { Promise<void> }
     */
    async _saveEmerald():Promise<void>
    {
        logger.i("進入_saveEmerald，儲存綠寶石")
        return new Promise(async (resolve) => {
            get_window("bank").then((window)=>{
                bot.simpleClick.leftMouse(30).then(()=>{
                    this.currentSaveCount += 1;
                    bot.closeWindow(window)
                    resolve();
                })
            }).catch(()=>{
                logger.d("儲存綠寶石失敗，請稍後再試")
                resolve();
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
        logger.i("進入_findPlace，開始尋找存綠地點")
        return new Promise(async (resolve)=>{
            if(this.storeIndex === settings.store_place.length + 1)
            {
                logger.d("結束了")
                this._writeAndSendReport(playerId,isfromdiscord)
                this._init();
                if(settings.enable_afk_after_store)
                {
                    afkManager.afk(playerId,isfromdiscord)
                }
                else
                {
                    if(!isfromdiscord)
                    {
                        bot.chat(`/m ${playerId} ${localizer.format("STORE_DONE",this.map)}`)
                    }
                    else
                    {
                        discordManager.send("",localizer.format("STORE_DONE",this.map) as string)
                    }
                }
                resolve(localizer.format("STORE_DONE",this.map) as string)
                return
            }
            this.currentPlace = settings.store_place[this.storeIndex-1]
            this._setMap()
            if(!isfromdiscord)
            {
                bot.chat(`/m ${playerId} ${localizer.format("STORE_ON_THE_WAY",this.map)}`)
            }
            else
            {
                discordManager.send("",localizer.format("STORE_ON_THE_WAY",this.map) as string)
                resolve(localizer.format("DC_COMMAND_EXECUTED",this.map) as string)
            }
            const currentLocationType:LocationType = getValidLocationType(this.currentPlace)
            if(currentLocationType === LocationType.Warp)
            {
                await findReachableWarpLocation(this.currentPlace).then(async () => {
                    logger.d("已找到地點，開始卸盒")
                    if(!isfromdiscord)
                    {
                        bot.chat(`/m ${playerId} ${localizer.format("STORE_FOUND_PLACE",this.map)}`)
                    }
                    else
                    {
                        discordManager.send("",localizer.format("STORE_FOUND_PLACE",this.map) as string)
                    }
                    await new Promise(resolve => setTimeout(resolve, 3000)); //延遲3秒
                    this._checkInventory()
                    .then(()=>{
                        this.playerId = playerId;
                        this.isfromdiscord = isfromdiscord;
                        this.isProcessing = true;
                        this._storeEmerald(playerId,isfromdiscord)
                    })
                    .catch((error)=>{
                        this._init();
                        if(!isfromdiscord)
                        {
                            bot.chat(`/m ${playerId} ${error}`)   
                        }
                        resolve(error)
                    })
                }).catch(async () => {
                    logger.d("無法抵達公傳點")
                    if(!isfromdiscord)
                    {
                        bot.chat(`/m ${playerId} ${localizer.format("STORE_CANT_GO_THETE_ERROR",this.map)}`)  
                    }
                    else
                    {
                        discordManager.send("",localizer.format("STORE_CANT_GO_THETE_ERROR",this.map) as string)
                    }
                    await new Promise(resolve => setTimeout(resolve, 3000)); //延遲3秒
                    this.storeIndex++
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
                        logger.d("已找到地點，開始卸盒")
                        if(!isfromdiscord)
                        {
                            bot.chat(`/m ${playerId} ${localizer.format("STORE_FOUND_PLACE",this.map)}`)
                        }
                        else
                        {
                            discordManager.send("",localizer.format("STORE_FOUND_PLACE",this.map) as string)
                        }
                        await new Promise(resolve => setTimeout(resolve, 3000)); //延遲3秒
                        this._checkInventory()
                        .then(()=>{
                            this.playerId = playerId;
                            this.isfromdiscord = isfromdiscord;
                            this.isProcessing = true;
                            this._storeEmerald(playerId,isfromdiscord)
                        })
                        .catch((error)=>{
                            this._init();
                            if(!isfromdiscord)
                            {
                                bot.chat(`/m ${playerId} ${error}`)   
                            }
                            else
                            {
                                discordManager.send("",error)
                            }
                            resolve(error)
                        })
                    })
                }
                catch(error)
                {
                    logger.e(`錯誤:${error}`)
                    logger.d("無法取得當前所在分流或無法前往Home點")
                    this.currentServer = 0
                    if(!isfromdiscord)
                    {
                       bot.chat(`/m ${playerId} ${localizer.format("STORE_CANT_GO_THETE_ERROR",this.map)}`)  
                    }
                    else
                    {
                        discordManager.send("",localizer.format("STORE_CANT_GO_THETE_ERROR",this.map) as string)
                    }
                    this.storeIndex++
                    this._findPlace(playerId,isfromdiscord).then((msg)=>{
                        resolve(msg)
                    })
                }
            }
        })
    }
    /**
     * 建立訊息接收器，接收分流重啟訊息
     */
    setMessageReceiver():void
    {
        this.receiver.on('restartMessageSent', (message: string) => {
            logger.d(`接收者收到消息: ${message}`);
            if(this.isProcessing)
            {
                logger.d("存綠正在運作中，因分流重啟，暫時停止工作")
                this.enableSaveEmerald = false;
            }
        });
        this.receiver.on('returnBackMessageSent', (message: string) => {
            logger.d(`接收者收到消息: ${message}`);
            if(this.isProcessing)
            {
                logger.d("分流重啟完成，重新進行工作")
                this.enableSaveEmerald = true;
                this._checkInventory().then(()=>{
                    this.isShulkerBoxBroken = true //手動更改以防萬一
                    this._storeEmerald(this.playerId,this.isfromdiscord);
                });
            }
        });
    }
    /**
     * 建立事件，判斷是否有新的盒子被放置
     */
    setEvent():void
    {
        bot.on('blockUpdate', (oldBlock, newBlock) => {
            if(oldBlock?.name === 'shulker_box' && newBlock.name === 'moving_piston')
            {
                this.isShulkerBoxBroken = true;
                logger.d('shulker_box被破壞');
            }
            if (this.isShulkerBoxBroken && newBlock.name === 'shulker_box') 
            {
                logger.d('shulker_box被放置');
            }
        });
    }

    /**
     * 內部函數，建立變數的映射值
     */
    _setMap():void
    {
        logger.i("進入_setMap，設定變數的映射值")
        this.map.set("index",this.storeIndex.toString());
        this.map.set("place",this.currentPlace.includes("-") ? `[分 流:${this.currentPlace.split("-")[0]} 家 點:${this.currentPlace.split("-")[1]}]`: `公傳點:${this.currentPlace}`);
    }
    /**
     * 取得當前存綠紀錄
     * @param { string } playerId 下指令的玩家ID
     */
    getCurrentStoreLog(playerId:string):void
    {
        logger.i("進入getCurrentStoreLog，取得當前存綠紀錄")    
        if(this.isProcessing)
        {
            logger.d("執行中")
            const storeLog = this.getCurrentLog()!
            // storeLog.toString().forEach((str, index) => {
            //     setTimeout(()=>{
            //     bot.chat(`/m ${playerId} ${str}`);
            //     },1500 * index);
            // })
            bot.chat(`/m ${playerId} ${localizer.format("STORE_SHOW_LOG_IN_CONSOLE",this.map)}`)   
            storeLog.toString().forEach((str, index) => {
                logger.l(str);
            }) 
        }
        else
        {
            logger.d("未執行中")
            bot.chat(`/m ${playerId} ${localizer.format("STORE_NOT_PROCESS_ERROR",this.map)}`)   
        }
    }

    /**
     * 取得當前存綠紀錄
     * @returns { StoreLog|null } 存綠Log
     */
    getCurrentLog():StoreLog | null
    {
        logger.i("進入getCurrentLog，取得當前存綠紀錄")    
        if(this.isProcessing)
        {
            this.endTime = new Date()
            const storeLog = new StoreLog(
                this.playerId,
                formatTime(Math.floor((this.endTime.getTime() - this.startTime!.getTime()) / 1000)),
                formatThousandths(this.currentSaveCount),
                formatThousandths(this.currentFixCount),
                formatThousandths(this.currentFixAmount),
                formatThousandths(this.currentEmptyCount),
                formatThousandths(this.currentSaveCount * 1728),
                this.reason
            )
            return storeLog
        }
        else
        {
            return null
        }
    }

    /**
     * 內部函數，撰寫存綠紀錄與寄送存綠結果
     * 
     * 撰寫情形:
     * 1. 使用指令暫停時
     * 2. 抵達最後一個地點結束時
     * 3. 單一地點卸盒，找不到盒子時
     * 4. 未開啟自動修復，且檢測到異物或空盒時
     * @param { string } playerId 下指令的玩家ID
     * @param { boolean } isfromdiscord 是否從discord發送指令
     */
    _writeAndSendReport(playerId:string,isfromdiscord:boolean):void
    {
        logger.i("進入_writeAndSendReport，撰寫存綠紀錄與寄送存綠結果")
        const storeLog = this.getCurrentLog()!
        if(settings.enable_store_log)
        {
            logger.d("有開啟存綠紀錄")
            logger.writeStoreLog(storeLog)
        }
        if(settings.enable_auto_send_store_report)
        {
            logger.d("有開啟自動送出存綠報告")
            if(!isfromdiscord)
            {
                // storeLog.toString().forEach((str, index) => {
                //     setTimeout(()=>{
                //     bot.chat(`/m ${playerId} ${str}`);
                //     },1500 * index);
                // })
                bot.chat(`/m ${playerId} ${localizer.format("STORE_SHOW_LOG_IN_CONSOLE",this.map)}`)   
                storeLog.toString().forEach((str, index) => {
                    logger.l(str);
                }) 
            }
            else
            {
                discordManager.sendEmbed(getDiscordStoreLogEmbed(storeLog,true))
            }
        }
    }
    /**
     * 初始化變數
     */
    _init()
    {
        this.isProcessing = false;
        this.enableSaveEmerald = true;
        this.storeIndex = 1;
        this.currentPlace = "";
        this.currentServer = 0;
        this.currentSaveCount = 0;
        this.currentFixAmount = 0;
        this.currentFixCount = 0;
        this.currentEmptyCount = 0;
        this.isShulkerBoxBroken = true;
        this.reason = "無";
        this.trashList = [];
        this.playerId = "";
        this.isfromdiscord = false;
        this.startTime = null;
        this.endTime = null;
    }

    constructor()
    {
        logger.i("建立StoreEmeraldManager物件")
        this.setMessageReceiver()
    }
}

export default function setStoreEmeraldManager()
{
    logger.i("進入setStoreEmeraldManager，建立一個新的StoreEmeraldManager物件")
    storeEmeraldManager = new StoreEmeraldManager();
}
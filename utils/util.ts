const sd = require('silly-datetime'); //讀取silly-datetime模塊
import { Window } from 'prismarine-windows';
import net from 'net';
import { logger } from "./logger"
import { Config, Setting } from "../models/files";
import { bot } from '../commands/main/bot';
import EventEmitter from 'events';
import { StoreLog } from '../commands/main/store_emerald';

export let config:Config,Item:any,settings:Setting;

/**
 * 分流重啟監聽器 
 */
export class RestartNotifier extends EventEmitter {
    private static instance: RestartNotifier;

    private constructor() {
        super();
    }

    public static getInstance(): RestartNotifier {
        if (!RestartNotifier.instance) {
            RestartNotifier.instance = new RestartNotifier();
        }
        return RestartNotifier.instance;
    }

    public getRestartMessage(message: string) {
        this.emit('restartMessageSent', message);
    }
    public getRetrnBackMessage(message: string) {
        this.emit('returnBackMessageSent', message);
    }
}

/**
 * 地點類別
 * 1. 家
 * 2. 公傳點
 */
export const enum LocationType {
    Home,
    Warp
}

/**
 * 取得輸入指令後彈出的視窗實例
 * @param { string } category - 視窗名稱 
 * @returns { Promise<Window> } Promise<Window實例>
 */
export function get_window(category:string):Promise<Window> 
{
    logger.i(`進入get_window，取得${category} window實例`)
    return new Promise(((resolve,reject) => {
        bot.chat(`/${category}`)
        bot.once("windowOpen", function o(window) {
            clearTimeout(timeout)
            resolve(window);
        })
        const timeout:NodeJS.Timeout = setTimeout(()=>{
            reject();
        },5000)
    }))
}

/**
 * 添加千分位標記
 * @param { number } number - 要轉換的數字
 * @returns { string } 添加後的結果
 */
export function formatThousandths(number: number): string 
{
    logger.i("進入formatThousandths，添加千分位")
    let comma = /\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g;
    return number.toString().replace(comma, ',');
}

/**
 * 格式化時間(天:小時:分:秒)
 * @param { number } totalTime - 秒數
 * @returns { string } 格式化後的時間
 */
export function formatTime(totalTime: number): string 
{
    logger.i("進入formatTime，格式化時間")
    const days:number = Math.floor(totalTime / 86400); 
    const hours:number = Math.floor((totalTime % 86400) / 3600);
    const minutes:number = Math.floor((totalTime % 3600) / 60);
    const seconds:number = totalTime % 60;
  
    let result:string = '';
  
    if (days > 0) 
    {
      result += `${days}天`;
    }
    if (hours > 0) 
    {
      result += `${hours}小時`;
    }
    if (minutes > 0) 
    {
      result += `${minutes}分`;
    }
    if (seconds > 0 || result === '') 
    {
      result += `${seconds}秒`;
    }
    logger.d(`回傳格式化時間結果: ${result}`)
    return result;
}

/**
 * 取得settings
 */
export function getSettings()
{
    delete require.cache[require.resolve(`${process.cwd()}/settings.json`)]; //清除暫存
    settings = require(`${process.cwd()}/settings.json`) //讀取設定檔案
}

/**
 * 取得config
 */
export function getConfig()
{
    delete require.cache[require.resolve(`${process.cwd()}/config.json`)]; //清除暫存
    config = require(`${process.cwd()}/config.json`)  //讀取config檔案
}

/**
 * 尋找能夠抵達的公傳點
 * @param { string } warpPlace 公傳地點 
 * @returns { Promise<void> }
 */
export async function findReachableWarpLocation(warpPlace:string):Promise<void> 
{
    return new Promise(async (resolve,reject)=>{
        const warpRegex = new RegExp(/^\[系統\] 傳送您至公共傳送點/)
        const noWarpRegex = new RegExp(/^\[系統\] 找不到公共傳送點/)
        bot.chat(`/warp ${warpPlace}`)
        const msg = await bot.awaitMessage(warpRegex,noWarpRegex) //透過awaitMessage取得訊息 有一定機率卡住
        if(warpRegex.test(msg))
        {
            resolve()
        }
        else
        {
            reject()
        }
    })
}

/**
 * 尋找能夠抵達的家點
 * @param { number } currentServer 當前分流
 * @param { string } homePlace 家地點 
 * @returns { Promise<void> }
 */
export async function findReachableHomeLocation(currentServer:number,homePlace:string):Promise<void>
{
    logger.i("進入_findReachableHomeLocation")
    const numOfServer:number = parseInt(homePlace.split("-")[0])
    const homeName:string = homePlace.split("-")[1]
    return new Promise(async (resolve, reject) =>
    {
        if(isNaN(numOfServer) || homeName === "")
        {
            logger.d(`格式錯誤 ${numOfServer} - ${homeName}`)
            reject()
        }
        if(numOfServer !== currentServer)
        {
            logger.d(`不為相同分流，目標分流為:${numOfServer} 當前分流為:${currentServer}`)
            bot.chat(`/ts ${numOfServer}`)
            await bot.awaitMessage(new RegExp(/^\[系統\] 讀取人物成功。/)) //透過awaitMessage取得訊息 有一定機率卡住
        }
        else
        {
            logger.d("為相同分流")
        }
        bot.chat(`/homes ${homeName}`)
        const msg = await bot.awaitMessage(new RegExp(/^傳送到/),new RegExp(/^家點：/))
        if(new RegExp(/^傳送到/).test(msg))
        {
            resolve()
        }
        else
        {
            reject()
        }
    })
}

/**
 * 取的地點類型
 * @param { string } location 地點 
 * @returns { LocationType } 家 or 公傳點
 */
export function getValidLocationType(location:string):LocationType 
{
    const home_regex = new RegExp(/^[0-9]{1,3}-\w/)
    if (home_regex.test(location)) 
    {
        return LocationType.Home;
    } 
    else 
    {
        return LocationType.Warp;
    }

}

/**
 * 建立StoreLog Embed 
 * @param { StoreLog } storeLog 拾取紀錄
 * @param { boolean } isEnd 是否結束
 * @returns { Embed } Embed
 */
export function getDiscordStoreLogEmbed(storeLog:StoreLog,isEnd:boolean):any
{
    const embed = {
        color: 0x32CD32,
        title: isEnd ? '完整存綠紀錄一覽' : '當前存綠紀錄一覽',
        thumbnail: {
            url: settings.embed_thumbnail_url,
        },
        fields: [
            {
                name:isEnd ? "總花費時間:" : "花費時間:",
                value:storeLog.totalTime,
                inline:false
            },
            {
                name: isEnd ? '總儲存次數:(已扣除空盒次數)' : '儲存次數:(已扣除空盒次數)',
                value: `${storeLog.currentSaveCount}次`,
                inline:true
            },
            {
                name: isEnd ? '總綠寶石儲存量:(未扣除修正金額)' : '綠寶石儲存量:(未扣除修正金額)',
                value: `$${storeLog.savedMoney}元`,
                inline:true
            },
            {
                name:'\u200b',
                value:`\u200b`,
                inline:true
            },
            {
                name: isEnd ? '總修正次數:' : '修正次數:',
                value: `${storeLog.currentFixCount}次`,
                inline:true
            },
            {
                name: isEnd ? '總修正金額:' : '修正金額:',
                value: `$${storeLog.currentFixAmount}元`,
                inline:true
            },
            {
                name:'\u200b',
                value:`\u200b`,
                inline:true
            },
            {
                name: isEnd ? '總檢測空盒次數:' : '檢測空盒次數:',
                value: `${storeLog.currentEmptyCount}次`,
                inline:false
            },
            {
                name: "備註:",
                value: storeLog.reason,
                inline:false
            }
        ],
        timestamp: new Date().toISOString(),
        footer: {
            text: `由 McHateBot_emerald 建立`,
        },
    };
    
    return embed
}

/**
 * 取的可用的port
 * @param { number } startPort 起始port 
 * @returns { Promise<number> } 可用的port
 */
export function getAvailablePort(startPort: number): Promise<number> {
    const server = net.createServer();
    server.unref();
    return new Promise((resolve, reject) => {
        server.on('error', () => {
            // 如果當前 port 被占用，則嘗試下一個 port
            server.close(() => {
                getAvailablePort(startPort + 1).then(resolve).catch(reject);
            });
        });
        server.listen(startPort, () => {
            const { port } = server.address() as net.AddressInfo;
            server.close(() => {
                resolve(port);
            });
        });
    });
}

/**
 * 替換所有換行符號 (U+000A, U+000D) 為空格
 * @param { string } text 原始字串
 * @returns { string } 處理過的字串
 */
export function replaceNewlines(text: string): string {
    return text.replace(/(?:\r\n|\r|\n)/g, ' ');
}

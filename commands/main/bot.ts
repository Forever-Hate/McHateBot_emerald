import { Bot as _Bot, BotOptions } from "mineflayer";
import { Config } from "../../models/files";
import { logger } from "../../utils/logger";

import mineflayer from 'mineflayer';  //讀取mineflayer模塊

type Bot = _Bot & { getTps(): number };
export let bot:Bot;
export let isOnline:boolean = false;
/**
 * 登入bot
 */
export default function login()
{
    logger.i("進入login，登入bot")
    const config:Config = require(`${process.cwd()}/config.json`)  //讀取config檔案
    const loginOpts:BotOptions = {  //登入資訊
        host: config.ip,  //伺服器ip
        port: config.port >= 0 ? config.port : undefined,  //伺服器port(預設25565)
        username: config.username,  //Minecraft帳號
        password: "",  //Minecraft密碼
        version: config.version,  //bot的Minecraft版本
        auth: config.auth === 'microsoft' ? 'microsoft' : 'offline', //登入驗證器使用offline或者microsoft
        defaultChatPatterns: false,
        checkTimeoutInterval:3600000,
        onMsaCode(data) {
            logger.l(`[微軟帳號身分驗證] 第一次登入\n請使用瀏覽器開啟頁面 ${data.verification_uri} 並輸入代碼 ${data.user_code} 進行身分驗證`)
        },

    }
    try
    {
        bot = mineflayer.createBot(loginOpts) as Bot;
    }
    catch(e:any)
    {
        logger.e(e);
        logger.writeErrorLog(e.toString());
    }
    
}
export function setIsOnline(value:boolean)
{
    isOnline = value;
}
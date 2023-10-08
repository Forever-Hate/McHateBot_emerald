import { Bot, BotOptions } from "mineflayer";
import { Config } from "../../models/files";
import { logger } from "../../utils/logger";

import mineflayer from 'mineflayer';  //讀取mineflayer模塊

export let bot:Bot;

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
        checkTimeoutInterval:3600000
    }
    try
    {
        bot = mineflayer.createBot(loginOpts)
    }
    catch(e:any)
    {
        logger.e(e);
        logger.writeErrorLog(e.toString());
    }
    
}
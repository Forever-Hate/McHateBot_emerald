import * as dotenv from 'dotenv';

import login, { bot, setIsOnline } from "./commands/main/bot";
import setLocalization, { localizer } from "./utils/localization";
import setLogger, { logger } from "./utils/logger";
import setDiscordManager, { discordManager } from './commands/communicate/dc';
import setDiscardItemer, { discardItemer } from './utils/discarditem';
import setAnnouncer, { announcer } from './commands/publicity/announcement';
import setInformer, { informer } from './commands/main/inform';
import setFinancer, { financer } from './commands/main/finance';
import setReplyManager, { replyManager } from './commands/main/reply';
import { RestartNotifier, config, getConfig, getSettings, settings } from './utils/util';
import setStoreEmeraldManager, { storeEmeraldManager } from './commands/main/store_emerald';
import setAfkManager, { afkManager } from './commands/main/afk';
import { Route, WebSocketClient,websocketClient } from './commands/websocket/websocket';



try {
    //載入環境變數
    dotenv.config();
    getConfig();
    getSettings();
    setLogger();
    setLocalization();
    const sd = require('silly-datetime');//讀取silly-datetime模塊
    setDiscordManager();
    setDiscardItemer();
    setStoreEmeraldManager();
    setAfkManager();
    setAnnouncer();
    setInformer();
    setFinancer();
    setReplyManager();
    const restartNotifier = RestartNotifier.getInstance();

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    
    WebSocketClient.init();
    websocketClient!.refreshData()
    /**
     * 顯示歡迎旗幟在console
     */
    function showWelcomeBanner()
    {
        (localizer.format("WELCOME_BANNER",new Map().set("version",process.env.VERSION!)) as string[]).forEach((value,index)=>{
            logger.l(value);
        })
    }

    function connect() 
    {
        logger.i("進入connect，開機")
        const whitelist:string[] = config.whitelist;
        const broadcast_regex = new RegExp(/\<(.*?) 的領地告示牌廣播\> (.*)/)
        const messge_regex = new RegExp(/\[(.*?) -> 您\] (.*)/)
        login();

        bot.once('spawn', () => {   //bot啟動時
            logger.i(`${localizer.format("LOADING_DONE")}`)
            showWelcomeBanner()
            setIsOnline(true);
            //從小黑窗中發送訊息
            rl.on('line', async function (line:any) 
            {
                bot.chat(line)
            })

            if (settings.enable_trade_announce) //宣傳
            {
                announcer.startAnnounce()
            }
            if(settings.enable_discord_bot)
            {
                discordManager.login()
            }
            storeEmeraldManager.setEvent()
        });

        bot.on("message", async function (jsonMsg) 
        {
            const health = new RegExp(/目標生命 \: ❤❤❤❤❤❤❤❤❤❤ \/ ([\S]+)/g) //清除目標生命
            if (health.test(jsonMsg.toString())) 
            {
                return;
            } 
            else 
            {
                console.log(jsonMsg.toAnsi());
                websocketClient!.send(Route.message,jsonMsg.toHTML())
            }

            if (jsonMsg.toString().startsWith(`[系統] `) &&jsonMsg.toString().toLowerCase().includes(`想要你傳送到 該玩家 的位置`) ||jsonMsg.toString().toLowerCase().includes(`想要傳送到 你 的位置`)) 
            {
                logger.d('偵測到傳送請求');
                const msg = jsonMsg.toString().split(/ +/g);
                const playerId = msg[1]
                if (whitelist.includes(playerId)) 
                {
                    logger.d('包含在白名單內，同意傳送');
                    bot.chat(`/tpaccept ${playerId}`)
                } 
                else 
                {
                    logger.d('不包含在白名單內，拒絕傳送');
                    bot.chat(`/tpdeny ${playerId}`)
                }
                return
            }

            if (messge_regex.test(jsonMsg.toString())) 
            {  
                const msg = jsonMsg.toString()
                const match = messge_regex.exec(jsonMsg.toString())
                const playerId = match![1] //取得Minecraft ID
                const args = match![2].split(" ")  //取得指令內容
                if (whitelist.includes(playerId) || playerId === bot.username) {
                    switch (args[0]) { //指令前綴
                        case "pay": //轉帳
                        {
                            financer.pay(playerId, args)
                            break
                        }
                        case "payAll": //轉出所有錢
                        case "payall":
                        {
                            await financer.payall(playerId,args)
                            break
                        }
                        case "cancelpay": //取消轉帳(僅限跨分流)
                        {
                            await financer.cancelPay(playerId)
                            break;
                        }
                        case "money":  //查詢餘額
                        case "coin" :
                            await financer.money(playerId)
                            break;
                        case "start": //開始存綠
                        {
                            storeEmeraldManager.storeEmerald(playerId,args)
                            break
                        }
                        case "stop": //暫停存綠
                            storeEmeraldManager.stopStoreEmerald(playerId)
                            break;
                        case "currentlog":
                        {
                            storeEmeraldManager.getCurrentStoreLog(playerId)
                            break
                        }
                        case "afk": 
                        {
                            afkManager.afk(playerId,false);
                            break;
                        }
                        case "exp":  //查詢經驗值
                        {
                            informer.experience(playerId);
                            break;
                        }
                        case "throw":
                        {
                            await discardItemer.discardAllItems();
                            break;
                        }
                        case "cmd":
                        {
                            bot.chat(match![2].slice(4));
                            break;
                        }
                        case "switch":
                        {
                            announcer.switchAnnouncement(playerId);
                            break;
                        }
                        case "help": //取得指令幫助
                        {
                            informer.help(playerId);
                            break;
                        }
                        case "version": //查詢版本
                        {
                            informer.version(playerId);
                            break;
                        }
                        case "about": //關於此bot
                        {
                            informer.about(playerId)
                            break;
                        }
                        case "test":
                        {
                            // bot.physics.gravity = 0
                            // bot._client.write("",{

                            // })
                            // bot._client.write("abilities", {
                            //     flags: 1,
                            //     flyingSpeed: 4.0,
                            //     walkingSpeed: 4.0
                            // })
                            // logger.d(bot.entity.position)
                            // bot.entity.position = bot.entity.position.offset(0,8,0)
                            // await new Promise(resolve => setTimeout(resolve, 500)); //延遲3秒
                            // bot.entity.position = bot.entity.position.offset(8,0,0)
                            // await new Promise(resolve => setTimeout(resolve, 500)); //延遲3秒
                            // bot.entity.position = bot.entity.position.offset(8,0,0)
                            // await new Promise(resolve => setTimeout(resolve, 500)); //延遲3秒
                            // bot.entity.position = bot.entity.position.offset(-8,0,0)
                            // await new Promise(resolve => setTimeout(resolve, 500)); //延遲3秒
                            // bot.entity.position = bot.entity.position.offset(-8,0,0)
                            // await new Promise(resolve => setTimeout(resolve, 500)); //延遲3秒
                            // logger.d(bot.entity.position)
                            // break
                            break
                        }
                        case "exit": //關閉bot
                            bot.chat(`/m ${playerId} ${localizer.format("SHUTDOWN")}`)
                            console.log(`Shutdown in 10 seconds`)
                            setTimeout(function () {
                                process.exit()
                            }, 10000)
                            break
                        default: 
                        {
                            replyManager.whitelistedReply(playerId, msg)
                        }

                    }
                } 
                else 
                {
                    replyManager.noWhitelistedReply(playerId, msg)
                }
                return
            }
            if(new RegExp(/^\[系統\]\s:\s第\d{1,3}分流 伺服器將進行短暫重啟/).test(jsonMsg.toString()))
            {
                logger.d("檢測到分流重啟訊息")
                restartNotifier.getRestartMessage(jsonMsg.toString());
                return
            }
            if(new RegExp(/^\[系統\] 讀取人物成功。/).test(jsonMsg.toString()))
            {
                logger.d("檢測到分流重啟完成訊息")
                restartNotifier.getRetrnBackMessage(jsonMsg.toString());
                return
            }
        })

        bot.once('kicked', (reason) => {
            let time1 = sd.format(new Date(), 'YYYY/MM/DD HH:mm:ss'); //獲得系統時間
            console.log(`[資訊] 客戶端被伺服器踢出 @${time1}   \n造成的原因:${reason}`)
        });

        //斷線自動重連
        bot.once('end', () => {
            let time1 = sd.format(new Date(), 'YYYY/MM/DD HH:mm:ss'); //獲得系統時間
            console.log(`[資訊] 客戶端與伺服器斷線 ，10秒後將會自動重新連線...\n@${time1}`)
            if (settings.enable_trade_announce) 
            {
                announcer.stopAnnounceInterval();
            }
            bot.removeAllListeners()
            setIsOnline(false);
            setTimeout(function () {
                connect();
            }, 10000)
        });
        bot.once('error', (reason) => {
            logger.e(reason)
            logger.writeErrorLog(reason)
        })
    }

    connect();

} catch (err) {
    console.error(err)
    console.log('process exit in 10 sec...')
    new Promise(resolve => setTimeout(async () => {
        logger.writeErrorLog(err)
        process.exit()
    }, 10000))
}


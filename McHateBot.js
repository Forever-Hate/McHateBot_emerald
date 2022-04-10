let Log
try {
    const config = require(`${process.cwd()}/config.json`)  //讀取config(組態)
    const settings = require(`${process.cwd()}/settings.json`) //讀取settings檔案
    const localization = require("./utils/localization")(config)
    const tokens = require('prismarine-tokens-fixed');  //讀取prismarine-tokens-fixed(驗證緩存)模塊
    const mineflayer = require('mineflayer');  //讀取mineflayer模塊
    const sd = require('silly-datetime');//讀取silly-datetime模塊
    const fs = require("fs");
    Log = require("./utils/log")(localization, fs, sd, settings)
    const discord = require("./commands/communicate/dc")(localization,settings) //讀取discord模塊
    const discard = require("./utils/discarditem")(localization)
    const afk = require("./commands/main/afk")(localization,settings)
    const store = require("./commands/main/store_emerald")(localization,afk,settings)
    const publicity = require("./commands/publicity/announcement")(localization)
    const Inquire = require("./commands/main/Inquire")(localization)
    const finace = require("./commands/main/finance")(localization,Log,settings)
    const reply = require("./commands/main/Reply")(localization, discord, settings)
    let isRegister = false

    let loginOpts = {  //登入資訊
        host: config.ip,  //伺服器ip
        port: config.port,  //伺服器port(預設25565)
        username: config.username,  //Minecraft帳號
        password: config.password,  //Minecraft密碼
        tokensLocation: './bot_tokens.json',  //驗證緩存檔案
        tokensDebug: false,  //取得的token是否除錯
        version: false,  //bot的Minecraft版本
        auth: config.auth, //登入驗證器使用mojang或者microsoft
        defaultChatPatterns: false
    }

    function connect() {
        tokens.use(loginOpts, function (_err, _opts) { //使用驗證緩存
            const bot = mineflayer.createBot(_opts) //定義bot為mineflayer類別中的createBot

            bot.once('spawn', () => {   //bot啟動時
                console.log(`${localization.get_content("LOADING_DONE")}`)
                if (settings.enable_trade_announcement) //宣傳
                {
                  publicity.start(bot,settings)
                }
                if (!isRegister) {
                    isRegister = true
                    const readline = require('readline');
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                        terminal: false
                    });
                    rl.on('line', function (line) {
                        bot.chat(line)
                    })

                    if(settings.enable_discord_bot)
                    {
                        discord.login(bot,settings.enable_reply_msg,settings.bot_token,settings.forward_DC_ID)
                    }
                }
            });

            const whitelist = (config.whitelist);
            bot.on("message", async function (jsonMsg) {
                let health = /目標生命 \: ❤❤❤❤❤❤❤❤❤❤ \/ ([\S]+)/g.exec(jsonMsg.toString()); //清除目標生命
                if (health) {
                    return;
                } else {
                    console.log(jsonMsg.toAnsi());
                }
                if (jsonMsg.toString().startsWith(`[系統] `) &&
                    jsonMsg.toString().toLowerCase().includes(`想要你傳送到 該玩家 的位置!`) ||
                    jsonMsg.toString().toLowerCase().includes(`想要傳送到 你 的位置`)) {
                    let msg = jsonMsg.toString().split(/ +/g);
                    let playerid = msg[1]
                    if (whitelist.includes(playerid)) {
                        bot.chat(`/tok`)
                    } else {
                        bot.chat(`/tno`)
                    }
                }
                if (jsonMsg.toString().includes(`-> 您]`)) {  //偵測訊息包含為"-> 您]"
                    let msg = (jsonMsg.toString())
                    let dec = msg.split(/ +/g);
                    let playerid = dec[0].substring(1, dec[0].length) //取得Minecraft ID
                    let args = msg.slice(8 + playerid.length).split(" ")  //取得指令內容
                    if (whitelist.includes(`${playerid}`) || playerid === bot.username) {
                        switch (args[0]) { //指令前綴
                            case "pay": //轉帳
                                await finace.pay(bot, playerid, args)
                                break
                            case "payAll": //轉出所有錢
                            case "payall":
                                await finace.payall(bot,playerid)
                                break
                            case "cancelpay": //取消轉帳(僅限跨分流)
                                await finace.cancel_pay(bot,playerid)
                                break;
                            case "money":  //查詢餘額
                            case "coin" :
                                await finace.check_money(bot, playerid)
                                break;
                            case "start": //開始存綠
                            {
                                await store.store_emerald(bot,playerid,bot.entity.position)
                                break
                            }
                            case "stop": //暫停存綠
                                store.down(bot,playerid)
                                break;
                            case "afk": {
                                await afk.afk(bot, playerid, bot.entity.position)
                                break;
                            }
                            case "exp":  //查詢經驗值
                            {
                                Inquire.experience(bot,playerid)
                                break;
                            }
                            case "throw":
                                await discard.discard_item(bot)
                                break;
                            case "cmd":
                                bot.chat(msg.slice(12 + playerid.length))
                                break;
                            case "switch":
                                publicity.switch(bot,playerid,settings)
                                break;
                            case "help": //取得指令幫助
                                Inquire.h(bot,playerid)
                                break;
                            case "version":
                                Inquire.i(bot,playerid)
                                break;
                            case "about":
                                Inquire.about(bot,playerid)
                                break;
                            case "exit": //關閉bot
                                bot.chat(`/m ${playerid} ${localization.get_content("SHUTDOWN")}`)
                                console.log(`Shutdown in 10 seconds`)
                                setTimeout(function () {
                                    process.exit()
                                }, 10000)
                                break
                            default: {
                                reply.whitelisted_reply(bot,playerid,msg)
                            }

                        }
                    } else {
                        reply.no_whitelisted_reply(bot, playerid, msg)
                    }
                }

            })
            bot.once('kicked', (reason) => {
                let time1 = sd.format(new Date(), 'YYYY-MM-DD HH-mm-ss'); //獲得系統時間
                console.log(`[資訊] 客戶端被伺服器踢出 @${time1}   \n造成的原因:${reason}`)
                publicity.shut()
            });
            //斷線自動重連
            bot.once('end', () => {
                let time1 = sd.format(new Date(), 'YYYY-MM-DD HH-mm-ss'); //獲得系統時間
                console.log(`[資訊] 客戶端與伺服器斷線 ，10秒後將會自動重新連線...\n@${time1}`)
                publicity.shut()
                setTimeout(function () {
                    connect();
                }, 10000)
            });
            bot.once('error', (reason) => {
                console.log(reason)
                Log.writeErrorLog(reason)
            })
        })
    }

    connect();

} catch (err) {
    console.log(err)
    console.log('process exit in 10 sec...')
    new Promise(resolve => setTimeout(async () => {
        Log.writeErrorLog(err)
        process.exit()
    }, 10000))
}


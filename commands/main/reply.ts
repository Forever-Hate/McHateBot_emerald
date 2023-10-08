import { localizer } from '../../utils/localization';
import { logger } from '../../utils/logger';
import { discordManager } from '../communicate/dc';
import { bot } from './bot';
import { settings } from '../../utils/util';

export let replyManager:ReplyController;

export class ReplyController
{
    replyId: string = ""; // 回覆的ID
    clearReplyIdTimeout: NodeJS.Timeout | null = null; // 清除回覆ID的Timeout
    map: Map<string, string> = new Map<string, string>();

    /**
     * 非白名單內的回覆
     * @param { string } playerId - 發送訊息的玩家ID
     * @param { string } msg - 原始訊息
     */
    noWhitelistedReply(playerId: string, msg: string)
    {
        logger.i("進入noWhitelistedReply，處理非白名單內的訊息")
        //是否開啟回覆訊息
        if (settings.enable_reply_msg) 
        {
            logger.d("有開啟回覆訊息")
            this.replyId = playerId;
            this._setMap();
            //是否開啟自動回覆
            if (settings.enable_auto_reply) 
            {
                logger.d("有開啟自動回覆")
                _auto_reply(playerId,this);
            } 
            else 
            {
                logger.d("沒有開啟自動回覆")
                _forward_msg(this);
            }
        }
        /**
         * 內部函數，不在白名單內，轉發訊息
         * @param { ReplyController } reply - 自身實例
         */
        function _forward_msg(reply:ReplyController) 
        {
            logger.i("進入_forward_msg，處理轉發訊息")
            if (reply.replyId !== playerId || reply.replyId === "") {
                reply.replyId = playerId;
                if (settings.enable_discord_bot) {
                    discordManager.modifyReplyId(playerId);
                }
            }

            if (reply.clearReplyIdTimeout) 
            {
                logger.d("已存在clearReplyIdTimeout，清除Timeout")
                clearTimeout(reply.clearReplyIdTimeout);
            }
            reply.clearReplyIdTimeout = setTimeout(() => {
                reply.replyId = "";
                if (settings.enable_discord_bot) {
                    discordManager.modifyReplyId("");
                }
            }, settings.clear_reply_id_delay_time * 1000);

            if (settings.enable_discord_bot && settings.directly_send_msg_to_dc) 
            {
                logger.d("已開啟discord bot與直接轉發至DC")
                bot.chat(`/m ${playerId} ${localizer.format("FORWARD_TO_DC",reply.map)}`);
                discordManager.send(playerId, msg.slice(8 + playerId.length));
            } 
            else 
            {
                logger.d("未開啟discord bot或直接轉發至DC，轉發至遊戲")
                if(settings.enable_reply_msg)
                {
                    logger.d("有開啟回覆訊息")
                    bot.chat(`/m ${settings.forward_ID} ${localizer.format("FORWARDED_IN_GAME",reply.map)}: ${msg.slice(8 + playerId.length)}`); 
                    bot.on("message", _checkForwardIdOnline);
                }
            }

            /**
             * 內部函數，確認指定轉發的ID是否在線上
             * @param { any } jsonMsg - 原始訊息
             */
            function _checkForwardIdOnline(jsonMsg: any) 
            {
                logger.i("進入_checkForwardIdOnline，確認指定轉發的ID是否在線上")
                if (jsonMsg.toString().includes("的玩家資料，您打錯ID了嗎?")) 
                {
                    logger.d("指定的轉發ID不在線上")
                    bot.chat(`/m ${playerId} ${localizer.format("OFFLINE",reply.map)}`);
                    if (settings.enable_discord_bot) 
                    {
                        logger.d("已開啟discord bot，轉發至DC")
                        bot.chat(`/m ${playerId} ${localizer.format("FORWARD_TO_DC",reply.map)}`);
                        discordManager.send(playerId, msg.slice(8 + playerId.length));
                    }
                    bot.removeListener("message", _checkForwardIdOnline);
                } 
                else if (jsonMsg.toString().includes(`${localizer.format("FORWARDED_IN_GAME",reply.map)}`)) 
                {
                    logger.d("轉發成功")
                    bot.removeListener("message", _checkForwardIdOnline);
                }
            }
        }

        /**
         * 內部函數，確認是否在時間範圍內，自動回覆訊息
         * @param { string } playerId - 發訊息的玩家ID
         * @param { ReplyController } reply - 自身實例
         */
        function _auto_reply(playerId:string,reply:ReplyController):void 
        {
            logger.i("進入_auto_reply，自動回覆訊息")
            //取得現在的時間
            const today: Date = new Date();
            const weekRegex: RegExp = /[1-7]-[1-7]/;
            
            //是否為正確的格式
            if (weekRegex.test(settings.auto_reply_week)) 
            {
                logger.d("一周時間為正確格式")
                const s: string[] = settings.auto_reply_week.split("-");
                let min: number = parseInt(s[0]);
                let max: number = parseInt(s[1]);
                let day: number = today.getDay();

                //因為一周是0-6 所以禮拜天是0 為了計算方便改成7
                if (day === 0) 
                {
                    day = 7;
                }
                //如果有人寫錯位置的話，就交換位置
                if (min > max) {
                    const temp: number = max;
                    max = min;
                    min = temp;
                }
                //是否在指定的時間內
                if (day >= min && day <= max) 
                {
                    const hourRegex: RegExp = /[0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9]/;
                    //是否為正確的格式
                    if (hourRegex.test(settings.auto_reply_time)) 
                    {
                        //當前時間的0點
                        const today0: Date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 24, 0, 0, 0);
                        const x: string[] = settings.auto_reply_time.split("-");
                        let min_time: Date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(x[0].split(":")[0]), parseInt(x[0].split(":")[1]), 0, 0);
                        let max_time: Date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(x[1].split(":")[0]), parseInt(x[1].split(":")[1]), 0, 0);

                        //是否換日，如果換日就進行校正
                        if (today0 > min_time && max_time < min_time) 
                        {
                            max_time.setTime(max_time.getTime() + 86400000);
                        }

                        //如果有人寫錯位置的話，就交換位置
                        if (min_time > max_time) 
                        {
                            const temp: Date = max_time;
                            max_time = min_time;
                            min_time = temp;
                        }

                        //是否在指定的時間內
                        if (today >= min_time && today <= max_time) 
                        {   
                            //自動回覆訊息
                            bot.chat(`/m ${playerId} ${settings.auto_reply_content}`);
                        } 
                        else 
                        {
                            //轉發訊息
                            _forward_msg(reply);
                        }
                    } 
                    else 
                    {
                        logger.d("一日時間為不正確格式")
                        logger.e("Incorrect format at auto_reply_time in settings.json");
                    }
                } 
                else 
                {
                    _forward_msg(reply);
                }
            } 
            else 
            {
                logger.d("一周時間為不正確格式")
                logger.e("Incorrect format at auto_reply_week in settings.json");
            }
        }
    }
    
    /**
     * 白名單內的回覆
     * @param { string } playerId - 發送訊息的玩家ID
     * @param { string } msg - 原始訊息
     * @param { boolean | undefined } isfromdiscord - 是否從discord發送指令
     * @returns { string } 錯誤/成功訊息
     */
    whitelistedReply(playerId:string, msg:string, isfromdiscord:boolean = false):string
    {
        logger.i("進入whitelistedReply，處理白名單訊息")
        //是否開啟回覆訊息
        if (settings.enable_reply_msg) 
        {
            logger.d("有開啟回覆訊息")
            this._setMap();
            if (bot.username === playerId) 
            {
                logger.d("傳送訊息的為bot自己")
                //是否開啟discord機器人
                if (settings.enable_discord_bot) 
                {
                    logger.d("有開啟discord bot")
                    discordManager.send(playerId, msg.slice(8 + playerId.length));
                }
                return "";
            }
            if (this.replyId !== "") 
            {
                logger.d(`要回覆的ID不為空，回覆ID為: ${this.replyId}`)
                if(!isfromdiscord)
                {
                    bot.chat(`/m ${this.replyId} ${msg.slice(8 + playerId.length)}`);
                    bot.chat(`/m ${playerId} ${localizer.format("REPLIED",this.map)}`); 
                }
                else
                {
                    //如果從DC來的訊息，不需要切字串
                    if(playerId === "")
                    {
                        logger.d("沒有指定回覆哪個玩家")
                        bot.chat(`/m ${this.replyId} ${msg}`);  
                    }
                    else
                    {
                        logger.d("有指定回覆哪個玩家")
                        bot.chat(`/m ${playerId} ${msg}`); 
                    }
                    
                }
                return localizer.format("REPLIED",this.map) as string;
            } 
            else 
            {
                logger.d("要回覆的ID為空")
                if(!isfromdiscord)
                {
                    bot.chat(`/m ${playerId} ${localizer.format("NO_ONE_REPLIED",this.map)}`);
                }
                else
                {
                    if(playerId !== "")
                    {
                        logger.d("有指定回覆哪個玩家")
                        bot.chat(`/m ${playerId} ${msg}`);
                        return localizer.format("REPLIED",this.map) as string; 
                    }
                }
                return localizer.format("NO_ONE_REPLIED",this.map) as string;
            }
        }
        if(isfromdiscord)
        {
            return localizer.format("DC_COMMAND_EXECUTED_FAIL",this.map) as string;
        }
        return "";
    };

    /**
     * 內部函數，建立變數的映射值
     */
    _setMap() 
    {
        logger.i("進入_setMap，設定變數的映射值")
        this.map.set("forward_id", settings.forward_ID);
        this.map.set("player", this.replyId);
    }

    constructor()
    {
        logger.i("建立ReplyController物件")
        this._setMap();
    }
}

export default function setReplyManager()
{
    logger.i("進入setReplyManager，建立一個新的ReplyController物件")
    replyManager = new ReplyController()
}
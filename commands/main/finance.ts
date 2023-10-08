import { logger } from "../../utils/logger";
import { localizer } from "../../utils/localization";
import { formatThousandths, settings } from "../../utils/util";
import { bot } from "./bot";


export let financer:Financer


export class Financer
{
    map:Map<string,string> = new Map();
    balance:number = 0; //金錢餘額
    expence:number = 0; //轉帳金額
    playerId:string = ""; //發送指令的ID
    recipientId:string = ""; //轉帳對象ID
    reason:string = "無"; //轉帳理由
    transferTimeout:NodeJS.Timeout | undefined;
    isRepeatTransfer:boolean = false;

    /**
     * 轉出指定金額給指定玩家
     * @param { string } playerId - 下指令的玩家ID
     * @param { string[] } args - 指令參數 
     * @param { boolean } isfromdiscord - 是否從discord發送指令
     * @returns { Promise<string> } 錯誤/成功訊息
     */
    async pay(playerId: string, args: string[], isfromdiscord: boolean = false):Promise<string>
    {
        logger.i("進入pay，進行轉帳")
        const decimalPatternRegex = new RegExp(/^[+-]?\d+(\.\d+)?$/);
        if (args.length === 3 || args.length === 4) 
        {
            logger.i(`參數數量為3或4，參數數量為:${args.length}`)
            await this._getBalance();
            this.playerId = playerId;
            this.recipientId = args[1];
            this.expence = parseInt(args[2],10);
            this._setMap();
            //判斷輸入的是不是數字
            if(isNaN(this.expence))
            {
                logger.d(`無法轉換 ${this.expence} 成數字`)
                if(!isfromdiscord)
                {
                    bot.chat(`/m ${playerId} ${localizer.format("FINANCE_PAY_FORMAT_ERROR",this.map)}`);
                }
                return localizer.format("FINANCE_PAY_FORMAT_ERROR",this.map) as string 
            }
            else if(this.expence <= 0 || !decimalPatternRegex.test(args[2].toString())) //判斷輸入的是不是 <= 0 或者是小數 
            {
                logger.d(`不為大於0的數字或為小數`)
                if(!isfromdiscord)
                {
                    bot.chat(`/m ${playerId} ${localizer.format("FINANCE_ZERO_OR_NEGATIVE_EXPENCE_ERROR",this.map)}`);
                }
                return localizer.format("FINANCE_ZERO_OR_NEGATIVE_EXPENCE_ERROR",this.map) as string 
            }
            //判斷有沒有添加轉帳理由
            if(args.length === 4)
            {
                logger.d(`參數為4，有填入轉帳理由 ${args[3]}`)
                this.reason = args[3]
            }
            else
            {
                logger.d(`參數不為4，未填入轉帳理由，修改為預設值:"無"`)
                this.reason = "無"
                
            }
            this._setMap();
            //判斷是不是有足夠的錢轉帳
            if(this.balance >= this.expence)
            {
                return await this._transfer(isfromdiscord)
            }
            else
            {
                if(!isfromdiscord)
                {
                    bot.chat(`/m ${playerId} ${localizer.format("FINANCE_PAY_BALANCE_NOT_ENOUGH_ERROR",this.map)}`);
                }
                return localizer.format("FINANCE_PAY_BALANCE_NOT_ENOUGH_ERROR",this.map) as string;
            }
        } 
        else 
        {
            if(!isfromdiscord)
            {
                bot.chat(`/m ${playerId} ${localizer.format("FINANCE_PAY_FORMAT_ERROR",this.map)}`)
            }
            return localizer.format("FINANCE_PAY_FORMAT_ERROR",this.map) as string;
        }
    }

    /**
     * 轉出所有的餘額
     * @param { string } playerId - 下指令的玩家ID
     * @param { string[] } args - 指令參數 
     * @param { boolean } isfromdiscord - 是否從discord發送指令
     * @returns { Promise<string> } 錯誤/成功訊息
     */
    async payall(playerId: string, args: string[], isfromdiscord: boolean = false):Promise<string>
    {
        logger.i("進入payall，轉出所有錢")
        this.playerId = playerId;
        this.expence = await this._getBalance();
        this.reason = "無" //預設payall reason = "無"
        if(args.length === 2)
        {
            logger.d(`參數等於2，設定轉帳對象: ${args[1]}`);
            this.recipientId = args[1];
        }
        else
        {
            this.recipientId = this.playerId
        }
        this._setMap();
        if(this.balance !== 0)
        {
            logger.d("帳戶餘額不為0")
            return await this._transfer(isfromdiscord);
        }
        else
        {
           if(!isfromdiscord)
           {
                bot.chat(`/m ${playerId} ${localizer.format("FINANCE_PAY_BALANCE_NOT_ENOUGH_ERROR",this.map)}`);
           }
           return localizer.format("FINANCE_PAY_BALANCE_NOT_ENOUGH_ERROR",this.map) as string;
        }
    }

    /**
     * 取得金錢餘額
     * @param { string } playerId - 下指令的玩家ID
     * @param { boolean } isfromdiscord - 是否從discord發送指令
     * @returns { Promise<string> } 錯誤/成功訊息
     */
    async money(playerId:string | undefined,isfromdiscord:boolean = false):Promise<string>
    {
        logger.i("進入money，取得金錢餘額")
        await this._getBalance();
        this._setMap();
        if(!isfromdiscord)
        {
            bot.chat(`/m ${playerId} ${localizer.format("FINANCE_CHECK_BALANCE",this.map)}`)
        }
        return localizer.format("FINANCE_CHECK_BALANCE",this.map) as string;
    }

    /**
     * 取消轉帳(僅限跨分流轉帳)
     * @param playerId - 下指令的玩家ID
     * @param isfromdiscord - 是否從discord發送指令
     * @returns { Promise<string> } 錯誤/成功訊息
     */
    async cancelPay(playerId:string | undefined,isfromdiscord:boolean = false):Promise<string> 
    {
        if(this.transferTimeout)
        {
            clearTimeout(this.transferTimeout)
            this.transferTimeout = undefined
            if(this.recipientId !== playerId)
            {
                bot.chat(`/m ${this.recipientId} ${localizer.format("FINANCE_TRANSFER_MONEY_CANCELED",this.map)}`);
            }
            if(!isfromdiscord)
            {
                bot.chat(`/m ${playerId} ${localizer.format("FINANCE_TRANSFER_MONEY_CANCELED_TO_OWNER",this.map)}`);
            }
            return localizer.format("FINANCE_TRANSFER_MONEY_CANCELED_TO_OWNER",this.map) as string;
        }
        else
        {
            if(!isfromdiscord)
            {
                bot.chat(`/m ${playerId} ${localizer.format("FINANCE_NO_TRANSFER_MONEY_ACROSS_SERVER",this.map)}`);
            }
            return localizer.format("FINANCE_NO_TRANSFER_MONEY_ACROSS_SERVER",this.map) as string;
        }
    }

    /**
     * 內部函數，取得金錢餘額
     * @returns { Promise<number> } 金錢餘額
     */
    async _getBalance():Promise<number>
    {
        logger.i("進入_getBalance，取得金錢餘額")
        bot.chat("/money");
        let moneyString:string = await bot.awaitMessage(/^金錢：/)
        moneyString = moneyString.replaceAll(",","");
        this.balance = parseInt(moneyString.slice(4, moneyString.length));
        return this.balance;
    }

    /**
     * 內部函數，轉帳
     * @param { boolean } isfromdiscord - 是否從discord發送指令
     */
    async _transfer(isfromdiscord:boolean = false):Promise<string>
    {
        logger.i("進入_transfer，轉帳")
        const transferErrorRegex = new RegExp(/^\[系統\] 只能轉帳給同一分流的線上玩家\. 請檢查對方的ID與所在分流/)
        const transferSuccessRegex = new RegExp(/^\[系統\] 成功轉帳/)
        if(!isfromdiscord)
        {
            bot.chat(`/m ${this.playerId} ${localizer.format("FINANCE_PAY_PROCESSING",this.map)}`);
        }
        bot.chat(`/pay ${this.recipientId} ${this.expence}`); //轉帳指令
        const msg:string = await bot.awaitMessage(transferErrorRegex,transferSuccessRegex) //透過awaitMessage取得訊息
        if (transferErrorRegex.test(msg)) 
        {
            return await this._transferError(isfromdiscord)
        }
        else
        {
            logger.d("轉帳成功");
            this.balance = this.balance - this.expence;
            this._setMap();
            if(!isfromdiscord)
            {
                bot.chat(`/m ${this.playerId} ${localizer.format("FINANCE_PAY_COMPLETE",this.map)}`)
            }

            if (settings.enable_pay_log)
            {
                logger.d("有開啟轉帳紀錄");
                logger.writePayLog(this.playerId,this.recipientId,formatThousandths(this.expence),formatThousandths(this.balance),this.reason)
            }

            //設為預設值
            this.isRepeatTransfer = false;
            this.transferTimeout = undefined;
            this.reason = "無";
            this.balance = 0;
            this.expence = 0;
            this.playerId = ""; 
            this.recipientId = "";
            return localizer.format("FINANCE_PAY_COMPLETE",this.map) as string;
        }
    }
    
    /**
     * 內部函數，當非同分流轉帳時執行
     * @param { boolean } isfromdiscord - 是否從discord發送指令
     * @returns { string } 錯誤/成功訊息
     */
    async _transferError(isfromdiscord:boolean = false):Promise<string>
    {
        logger.i("進入_transferError，當非同分流轉帳執行")
        if(!this.isRepeatTransfer)
        {
            logger.d("尚未轉帳第二次，嘗試再次轉帳")
            if(this.recipientId === this.playerId)
            {
                logger.d("轉帳給自己")
                if(!isfromdiscord)
                {
                    bot.chat(`/m ${this.playerId} ${localizer.format("FINANCE_NOT_IN_THE_SAME_SERVER_ERROR",this.map)}`);
                }
            }
            else
            {
                logger.d("不是轉帳給自己")
                bot.chat(`/m ${this.recipientId} ${localizer.format("FINANCE_TRANSFER_MONEY_TO_SOMEONE",this.map)}`);
            }
            bot.chat(`/tpahere ${this.recipientId}`)
            bot.chat(`/m ${this.recipientId} ${localizer.format("FINANCE_PREPARE_TRANSFER_MONEY",this.map)}`);
            return await new Promise(resolve => {
                this.transferTimeout = setTimeout(async ()=> {
                    this.isRepeatTransfer = true;
                    resolve(await this._transfer(isfromdiscord))
                },settings.transfer_interval * 1000)
            })
        }
        else
        {
            logger.d("轉帳失敗")
            if(!isfromdiscord)
            {
                bot.chat(`/m ${this.playerId} ${localizer.format("FINANCE_PAY_FAIL_TO_OWNER",this.map)}`)
            }
            bot.chat(`/m ${this.recipientId} ${localizer.format("FINANCE_PAY_FAIL",this.map)}`)
            //設為預設值
            this.isRepeatTransfer = false;
            this.transferTimeout = undefined;
            this.reason = "無";
            this.balance = 0;
            this.expence = 0;
            this.playerId = ""; 
            this.recipientId = "";
            return localizer.format("FINANCE_PAY_FAIL_TO_OWNER",this.map) as string;
        }
    }

    /**
     * 內部函數，建立變數的映射值
     */
    _setMap()
    {
        logger.i("進入_setMap，設定變數的映射值")
        this.map.set("balance",formatThousandths(this.balance));
        this.map.set("expence",formatThousandths(this.expence));
        this.map.set("reason",this.reason);
        this.map.set("player",this.playerId)
        this.map.set("interval",settings.transfer_interval.toString());
        this.map.set("client",this.recipientId);
    }

    constructor()
    {
        logger.i("建立Financer物件");
    }
    
}

export default function setFinancer()
{
    logger.i("進入setFinancer，建立一個新的Financer物件");
    financer = new Financer();
}


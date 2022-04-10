let map = new Map()
let balance = 0
let expense = 0
let commander =""
let client = ""
let transfer_interval = 0
let no_transfer_twice = true
let isCommandedStop = false
module.exports = function (local,log,settings){
    initMap()
    transfer_interval = settings.transfer_balance_delayTime
    this.check_money = async function (bot,player){
        balance = formatPrice(await get_money(bot))
        bot.chat(`/m ${player} ${await get_content("FINANCE_CHECK_ASSET")}`)
    }

    this.pay = async function (bot,playerid,args){
        if (args.length === 3) {
            balance = await get_money(bot)
            client = args[1];
            expense= parseInt(args[2],10);
            no_transfer_twice = true
            commander = playerid
            if(balance >= expense)
            {
                await transfer(bot,playerid)
            }
            else
            {
                bot.chat(`/m ${playerid} ${await get_content("FINANCE_PAY_BALANCE_NOT_ENOUGH_ERROR")}`);
            }
        } else {
            bot.chat(`/m ${playerid} ${await get_content("FINANCE_PAY_FORMAT_ERROR")}`)
        }
    }

    this.payall = async function (bot,playerid){
        client = playerid
        commander = playerid
        expense = await get_money(bot)
        balance = expense
        no_transfer_twice = true
        if(balance !== 0)
        {
            await transfer(bot,playerid)
        }
        else
        {
            bot.chat(`/m ${playerid} ${await get_content("FINANCE_PAY_BALANCE_NOT_ENOUGH_ERROR")}`);
        }
    }

    this.cancel_pay = async function (bot,playerid) {
        if(this.transferTimeout)
        {
            isCommandedStop = true
            clearTimeout(this.transferTimeout)
            this.transferTimeout = undefined
            if(client !== playerid)
            {
                bot.chat(`/m ${client} ${await get_content("FINANCE_TRANSFER_MONEY_CANCELED")}`);
            }
            bot.chat(`/m ${playerid} ${await get_content("FINANCE_TRANSFER_MONEY_CANCELED_TO_OWNER")}`);
        }
        else
        {
            bot.chat(`/m ${playerid} ${await get_content("FINANCE_NO_TRANSFER_MONEY_ACROSS_SERVER")}`);
        }
    }

    async function transfer(bot,playerid){
        bot.chat(`/m ${playerid} ${await get_content("FINANCE_PAY_CONFIRM")}`);
        bot.on('message',confirm_transfer)
        bot.chat(`/pay ${client} ${expense}`);
        async function confirm_transfer(jsonMsg){
            let transfer_error_regex = new RegExp(/^\[系統\] 只能轉帳給同一分流的線上玩家\. 請檢查對方的ID與所在分流/)
            let transfer_success_regex = new RegExp(/^\[系統\] 成功轉帳/)
            if (transfer_error_regex.test(jsonMsg.toString())) {
                await transfer_error()
            }
            else if(transfer_success_regex.test(jsonMsg.toString())){
                await transfer_complete()
            }
            else if(this.transferTimeout === undefined && isCommandedStop)
            {
                isCommandedStop = false
                bot.removeListener('message',confirm_transfer)
            }
            async function transfer_error(){
                if(no_transfer_twice)
                {
                    if(client === playerid)
                    {
                        bot.chat(`/m ${playerid} ${await get_content("FINANCE_NOT_IN_THE_SAME_SERVER_ERROR")}`);
                    }
                    else
                    {
                        bot.chat(`/m ${client} ${await get_content("FINANCE_TRANSFER_MONEY_TO_SOMEONE")}`);
                    }
                    bot.chat(`/tpahere ${client}`)
                    bot.chat(`/m ${client} ${await get_content("FINANCE_PREPARE_TRANSFER_MONEY")}`);
                    this.transferTimeout = setTimeout(()=> {
                        no_transfer_twice = false
                        bot.chat(`/pay ${client} ${expense}`);
                        this.transferTimeout = undefined
                    },transfer_interval)
                }
                else
                {
                    await transfer_fail()
                }
            }
            async function transfer_complete(){
                balance = balance - expense
                bot.chat(`/m ${playerid} ${await get_content("FINANCE_PAY_COMPLETE")}`)
                if (settings.enable_pay_logs)
                {
                    log.writePayLog(playerid,client,formatPrice(expense),formatPrice(balance))
                }
                bot.removeListener('message',confirm_transfer)
            }
            async function transfer_fail(){
                bot.chat(`/m ${client} ${await get_content("FINANCE_PAY_FAIL")}`)
                bot.chat(`/m ${playerid} ${await get_content("FINANCE_PAY_FAIL_TO_OWNER")}`)
                bot.removeListener('message',confirm_transfer)
            }
        }
    }

    async function get_money(bot){
        return new Promise(resolve => {
            bot.chat("/money")
            bot.awaitMessage(/^金錢 ： /).then(string => {
                let m = string.replaceAll(",","")
                let money = parseInt(m.slice(6, m.length))
                resolve(money)
            })
        })
    }

    async function get_content(path)
    {
        return local.get_content(path,map,formatPrice(balance),formatPrice(expense),commander,transfer_interval/1000,client)
    }

    function formatPrice(price){
        let comma=/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g
        return price.toString().replace(comma, ',')
    }

    return this
}

function initMap(){
    map.set("0","balance")
    map.set("1","expense")
    map.set("2","player")
    map.set("3","interval")
    map.set("4","client")
}
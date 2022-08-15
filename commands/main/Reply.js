let reply_id = "" //回覆的ID
let clear_reply_id //清除ID延遲
let map = new Map()
module.exports = function (local,discord,settings){
    initMap()
    this.no_whitelisted_reply = async function (bot,playerid,msg){
        if (settings.enable_reply_msg) {
            if(settings.enable_auto_reply)
            {
                await auto_reply()
            }
            else
            {
                forward_msg()
            }
            if (reply_id !== playerid || reply_id === "") {
                reply_id = playerid
                if (settings.enable_discord_bot) {
                    discord.modify_reply_id(playerid)
                }
            }
            clearTimeout(clear_reply_id)
            clear_reply_id = setTimeout(() => {
                reply_id = ""
                if (settings.enable_discord_bot) {
                    discord.modify_reply_id("")
                }
            }, settings.clear_reply_id_delay_time)
        }
        async function Error(jsonMsg)
        {
            if (jsonMsg.toString().includes("的玩家資料，您打錯ID了嗎?")) {
                bot.chat(`/m ${playerid} ${get_content("OFFLINE")}`)
                bot.chat(`/m ${playerid} ${get_content("FORWARD_TO_DC")}`)
                discord.send(playerid, msg.slice(8 + playerid.length))
                bot.removeListener("message", Error)
            } else if (jsonMsg.toString().includes(`${playerid}發送訊息`))
            {
                bot.removeListener("message", Error)
            }
        }
        function forward_msg(){
            if (settings.directly_send_msg_to_dc) {
                bot.chat(`/m ${playerid} ${get_content("FORWARD_TO_DC")}`)
                discord.send(playerid, msg.slice(8 + playerid.length))
            } else {
                bot.chat(`/m ${settings.forward_ID} ${get_content("FORWARDED_IN_GAME")}: ${msg.slice(8 + playerid.length)}`)
                bot.on("message", Error)
            }
        }
        async function auto_reply()
        {
            let today = new Date()
            let week_regex = /[1-7]-[1-7]/
            if(week_regex.test(settings.auto_reply_week))
            {
                let s = settings.auto_reply_week.split("-")
                let min = s[0]
                let max = s[1]
                let day = today.getDay()
                if(day === 0)
                {
                    day = 7
                }
                if(min > max)
                {
                    let temp = max
                    max = min
                    min = temp
                }
                if(day >= min && day <= max)
                {
                    let hour_regex = /[0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9]/
                    if(hour_regex.test(settings.auto_reply_time))
                    {
                        let today_0 = new Date(today.getFullYear(),today.getMonth(),today.getDate(),24,0,0,0)
                        let x = settings.auto_reply_time.split("-")
                        let min_time = new Date(today.getFullYear(),today.getMonth(),today.getDate(),parseInt(x[0].split(":")[0]),parseInt(x[0].split(":")[1]),0,0)
                        let max_time = new Date(today.getFullYear(),today.getMonth(),today.getDate(),parseInt(x[1].split(":")[0]),parseInt(x[1].split(":")[1]),0,0)
                        if(today_0 > min_time && max_time < min_time)
                        {
                            max_time.setTime(max_time.getTime() + 86400000)
                        }
                        if(min_time > max_time)
                        {
                            let temp = max_time
                            max_time = min_time
                            min_time = temp
                        }
                        if (today >= min_time && today <= max_time)
                        {
                            bot.chat(`/m ${playerid} ${settings.auto_reply_content}`)
                        }
                        else
                        {
                            forward_msg()
                        }
                    }
                    else
                    {
                        console.log("Incorrect format at auto_reply_time in settings.json")
                    }
                }
                else
                {
                    forward_msg()
                }
            }
            else
            {
                console.log("Incorrect format at auto_reply_week in settings.json")
            }

        }
    }
    this.whitelisted_reply = function (bot,playerid,msg){
        if (settings.enable_reply_msg) {
            if(bot.username === playerid)
            {
                if(settings.enable_discord_bot)
                {
                    discord.send(playerid, msg.slice(8 + playerid.length))
                }
                return
            }
            if (reply_id !== "") {
                bot.chat(`/m ${reply_id} ${msg.slice(8 + playerid.length)}`)
                bot.chat(`/m ${playerid} ${get_content("REPLIED")}`)
            } else {
                bot.chat(`/m ${playerid} ${get_content("NO_ONE_REPLIED")}`)
            }
        }
    }
    function get_content(path)
    {
        return local.get_content(path,map,settings.forward_ID,reply_id)
    }
    function initMap(){
        map.set("0","forward_id")
        map.set("1","player")
    }

    return this
}
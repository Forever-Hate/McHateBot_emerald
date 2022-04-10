let trade_content = "" //宣傳文字
let trade_content_index = 0 //宣傳文字index
let skip_count = 0 //該訊息被跳過的次數
let now_trade_content_cycle_index = 0 //當前循環的 index
let dict = new Map()
module.exports = function (local){
    initMap()
    this.start = function (bot,settings){
        this.announcementInterval = setInterval(function () {
            trade_content = settings.trade_content[trade_content_index] //初始化宣傳文字
            trade_content.forEach((c,index)=>{
                setTimeout(()=>{
                    bot.chat(`${c}`)
                },500*(index+1))
            })
            if (settings.enable_trade_content_cycle && settings.content_skip_count === 1) {
                trade_content_index = trade_content_index + 1
                if (trade_content_index === settings.trade_content.length) {
                    trade_content_index = 0
                }
            } else if (settings.enable_trade_content_cycle && settings.content_skip_count !== 1) {
                skip_count = skip_count + 1
                if (skip_count === settings.content_skip_count) {
                    now_trade_content_cycle_index = trade_content_index
                    trade_content_index = 0
                    skip_count = 0
                } else {
                    if (skip_count === 1) //剛顯示過特殊訊息
                    {
                        trade_content_index = now_trade_content_cycle_index + 1
                        if (trade_content_index === settings.trade_content.length) {
                            trade_content_index = 1
                        }
                    } else {
                        trade_content_index = trade_content_index + 1
                        if (trade_content_index === settings.trade_content.length) {
                            trade_content_index = 1
                        }
                    }

                }
            }
        }, settings.trade_announce_cycleTime)
    }

    this.shut = function (){
        clearInterval(this.announcementInterval)
    }

    this.switch = function (bot,id,settings){
        if (settings.trade_content.length === 1) {
            bot.chat(`/m ${id} ${get_content("NEED_MORE_CONTENT")}`)
        } else {
            trade_content_index = trade_content_index + 1
            if (trade_content_index === settings.trade_content.length) {
                trade_content_index = 0
            }
            trade_content = settings.trade_content[trade_content_index]
            bot.chat(`/m ${id} ${get_content("NEXT_INDEX")}`)
            bot.chat(`/m ${id} ${get_content("CONTENT")}`)

        }
    }

    function get_content(path)
    {
        return local.get_content(path,dict,trade_content_index,trade_content)
    }
    return this
}
function initMap()
{
    dict.set("0","trade_content_index")
    dict.set("1","trade_content")
}


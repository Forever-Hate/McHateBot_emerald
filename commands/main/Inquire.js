let map = new Map()
let version = "v1.1.92"
let exp = 0
let author_dc = "I-love-minecraft#2437"
let author_id = "Forever_Hate"
module.exports = function (local){
    initMap()
    this.experience = function (bot,playerid){
        exp = Math.round(bot.experience.progress * 100);
        bot.chat(`/m ${playerid} ${get_content(bot,"EXP")}`);
    }

    this.h = function (bot,playerid){
        bot.chat(`/m ${playerid} ${get_content(bot,"HELP")}`)
    }

    this.i = function (bot,playerid) {
        bot.chat(`/m ${playerid} ${get_content(bot,"V")}`)
    }

    this.about = function (bot,playerid){
        let content =get_content(bot,"ABOUT")
        content.forEach((c,index)=>{
            setTimeout(()=>{
                bot.chat(`/m ${playerid} ${c}`)
            },500*(index+1))
        })
    }
    function get_content(bot,path){
        return local.get_content(path, map, bot.experience.level, bot.experience.points, exp, version, author_dc, author_id)
    }
    return this

}

function initMap(){
    map.set("0","level")
    map.set("1","points")
    map.set("2","percent")
    map.set("3","version")
    map.set("4","author_dc")
    map.set("5","author_id")

}
let afk_place_index = 0
let point = ""
let map = new Map()
module.exports = function (local,settings){
    initMap()
    this.afk = async function(bot,playerid,position){
        afk_place_index = 0
        await find_place(bot, position)

        async function find_place(abc,position) {
            point = settings.afk_place[afk_place_index]
            bot.chat(`/m ${playerid} ${await get_content("AFK_ON_THE_WAY")}`)
            if (check_category()) {
                find_can_store_warp(abc,position).then(async () => {
                    bot.chat(`/m ${playerid} ${await get_content("AFK_FOUND_PLACE")}`)
                   await find_minecart()
                }).catch(async () => {
                    await check_again(abc)
                })
            } else {
                find_can_store_home(abc,position).then(async () => {
                    bot.chat(`/m ${playerid} ${await get_content("AFK_FOUND_PLACE")}`)
                    await find_minecart()
                }).catch(async () => {
                    await check_again(abc)
                })
            }

            async function check_again(bot)
            {
                afk_place_index++
                if(afk_place_index === settings.afk_place.length)
                {
                    bot.chat(`/m ${playerid} ${await get_content("AFK_PLACE_NOT_FOUND")}`)
                }
                else
                {
                    bot.chat(`/m ${playerid} ${await get_content("AFK_CANT_GO_THETE_ERROR")}`)
                    await find_place(bot, bot.entity.position)
                }
            }

            async function find_can_store_warp(bot,position) {
                return new Promise(async function (resolve, reject) {
                    let checkTP = false
                    bot.on('message', check_and_tp_warp)
                    bot.chat(`/warp ${point}`)
                    let c = setInterval(()=> {
                        if (checkTP) {
                            clearInterval(c)
                            clearTimeout(warpError)
                            resolve()
                        }
                    }, 500)
                    let warpError = setTimeout(()=>{
                        clearInterval(c)
                        reject()
                    },15000)


                    async function check_and_tp_warp(jsonMsg) {
                        let warp_regex = new RegExp(/^\[系統\] 傳送您至公共傳送點/)
                        let no_warp_regex = new RegExp(/^\[系統\] 找不到公共傳送點/)
                        if (warp_regex.test(jsonMsg.toString())) {
                            setTimeout(function () {
                                    if (bot.entity.position.x !== position.x && bot.entity.position.z !== position.z) {
                                        bot.removeListener('message', check_and_tp_warp)
                                        checkTP = true
                                    } else {
                                        checkTP = false
                                    }
                                }
                                , 10000)
                        } else if (no_warp_regex.test(jsonMsg.toString())) {
                            checkTP = false
                        }
                    }
                })

            }

            async function find_can_store_home(bot,position) {
                return new Promise(async function (resolve, reject) {
                    let checkTPServer = false
                    let checkTPHome = false
                    let a
                    let c = setInterval(()=> {
                        if (checkTPServer) {
                            clearInterval(c)
                            clearTimeout(serverError)
                            a = setInterval(()=> {
                                if (checkTPHome) {
                                    clearInterval(a)
                                    clearTimeout(homeError)
                                    resolve()
                                }
                            }, 500)
                            tp_home(bot)
                        }
                    }, 500)
                    let serverError = setTimeout(()=>{
                        clearInterval(c)
                        reject()
                    },30000)
                    let homeError = setTimeout(()=>{
                        clearInterval(a)
                        reject()
                    },60000)
                    change_server(bot)

                    function change_server(bot) {
                        let server = settings.afk_place[afk_place_index].split(" ")[0]
                        bot.on('message', check_change_server)
                        bot.chat(`/ts ${server}`)
                        async function check_change_server(jsonMsg) {
                            let change_server_done = false
                            let change_server_done_regex = new RegExp(/^\[系統\] 讀取人物成功。/)
                            if (change_server_done_regex.test(jsonMsg.toString())) {
                                change_server_done = true
                                setTimeout(() => {
                                    bot.removeListener('message', check_change_server)
                                    if (bot.entity.position.x !== position.x && bot.entity.position.z !== position.z && change_server_done) {
                                        checkTPServer = true
                                    } else {
                                        checkTPServer = false
                                    }
                                }, 10000)
                            }
                        }
                    }


                    function tp_home(bot) {
                        let home_point = settings.afk_place[afk_place_index].split(" ")[1]
                        bot.on('message', check_tp_home)
                        bot.chat(`/homes ${home_point}`)
                        async function check_tp_home(jsonMsg) {
                            let no_home_regex = new RegExp(/^家點：/)
                            let no_home = false
                            if (no_home_regex.test(jsonMsg.toString())) {
                                no_home = true
                            }
                            setTimeout(function () {
                                    bot.removeListener('message', check_tp_home)
                                    if (bot.entity.position.x !== position.x && bot.entity.position.z !== position.z && !no_home) {
                                        checkTPHome = true
                                    } else {
                                        checkTPHome = false
                                    }
                                }
                                , 10000)
                        }
                    }


                })

            }

            function check_category(){
                let home_regex = new RegExp(/^[0-9]{1,2}\s\w/)
                if (home_regex.test(settings.afk_place[afk_place_index])) {
                    return false
                } else {
                    return true
                }

            } //true warp | false home

        }

        function find_minecart()
        {
            return new Promise(async resolve =>{
                let minecart
                for(let entity in bot.entities)
                {
                    if(bot.entities[entity].name === "minecart" && bot.entity.position.distanceTo(bot.entities[entity].position) <= 5)
                    {
                        minecart = bot.entities[entity]
                        break
                    }
                }
                if(minecart)
                {
                    bot.mount(minecart)
                    bot.chat(`/m ${playerid} ${await get_content("AFK_FOUND_MINECART")}`)
                }
                else
                {
                    bot.chat(`/m ${playerid} ${await get_content("AFK_NOT_FOUND_MINECART")}`)

                }
                resolve()
            })
        }
    }
    async function get_content(path) {
        return local.get_content(path,map,afk_place_index+1,point)
    }

    return this
}

function initMap()
{
    map.set("0","index")
    map.set("1","point")

}
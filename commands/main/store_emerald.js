let isCommandedStop = false //是否命令停下
let store_place_index = 0
let last_server = 0
let last_place = ""
let point =""
let map = new Map()
module.exports = function (local,afk, settings) {
    initMap()
    this.store_emerald = async function (bot, playerid, position) {
        isCommandedStop = false
        store_place_index = 0
        last_server = 0
        last_place = ""
        if (settings.enable_multiple_place_store) {
            if (settings.store_place.length === 0 || settings.store_place[0] === "") {
                bot.chat(`/m ${playerid} ${await get_content("STORE_NO_ENOUGH_PLACE_ERROR")}`)
            } else {
                await find_place(bot,playerid,position)
            }
        } else {
            await this.store(bot,playerid)
        }
    }

    this.store = async function (bot,playerid) {
        let another_item_list = []
        let empty_box = false
        let mcData = require("minecraft-data")(bot.version)
        let not_found_times = 0
        await bot.chat(`/m ${playerid} ${await get_content("STORE_FOUND_PLACE")}`)
        await bot.chat(`/m ${playerid} ${await get_content("STORE_START")}`)
        storeTimeout()

        async function storeTimeout() {
            try {
                empty_box = false
                another_item_list.length = 0
                let ShulkerboxToOpen = bot.findBlock({
                    matching: mcData.blocksByName["shulker_box"].id,
                    count: 1,
                    maxDistance: 5,
                })
                let shulker_box = await bot.openChest(ShulkerboxToOpen)
                not_found_times = 0 //有找到盒子 清除計數
                if (shulker_box.containerItems().length !== 0) {
                    for (let item of shulker_box.containerItems()) {
                        try {
                            await shulker_box.withdraw(item.type, item.metadata, item.count)
                            if (item.type !== 687) {
                                another_item_list.push(item)
                            }
                        } catch (e) {
                            console.log(`cant take it:${e}`)
                        }
                    }
                } else {
                    shulker_box.close()
                    await bot.dig(ShulkerboxToOpen).then(() => {
                        if (!isCommandedStop) {
                            setTimeout(storeTimeout, settings.store_emerald_cycle_delayTime)
                        }
                    })
                    empty_box = true
                }
                if (!empty_box) {
                    if (another_item_list.length !== 0) {
                        await ReplenishAndStore(bot, another_item_list)
                    } else {
                        await StoreToBank(bot)
                    }
                    if (!isCommandedStop) {
                        setTimeout(storeTimeout, settings.store_emerald_cycle_delayTime)
                    }
                }
            } catch (e) {
                not_found_times++
                console.log(`${await get_content("STORE_SHULKER_BOX_NOT_FOUND_ERROR")}`)
                if (not_found_times === settings.store_emerald_check_times) //前往下一個點
                {
                    await check_if_afk(bot, playerid)
                } else {
                    setTimeout(storeTimeout, settings.store_emerald_cycle_delayTime)
                }
            }
        }

        async function ReplenishAndStore(bot, item_list) {
            await tossItem(bot, item_list)
            let bank = await get_window(bot, "bank")
            let promise = []
            for (let i = 0; i < item_list.length; i++) {
                let p = new Promise(resolve => {
                    setTimeout(() => {
                        bot.clickWindow(20, 0, 0).then(() => {
                            resolve()
                        })
                    }, 500 * i)
                })
                promise.push(p)
            }
            await Promise.all(promise).then(() => {
                bot.closeWindow(bank)
                StoreToBank(bot)
            })


        }

        async function tossItem(bot, item_list) {
            for (let i of item_list) {
                await bot.tossStack(i).catch((err) => {
                    if (err) {
                        console.log("error:" + err)
                    }
                })
            }
        }

        async function StoreToBank(bot) {
            let bank = await get_window(bot, "bank")
            bot.clickWindow(30, 0, 0).then(() => {
                bot.closeWindow(bank)
            })
        }

        function get_window(bot, category) {
            return new Promise((resolve => {
                bot.chat(`/${category}`)
                bot.on("windowOpen", function o(window) {
                    bot.removeListener("windowOpen", o)
                    resolve(window)
                })
            }))

        }
    }

    this.down = function (bot,playerid) {
        isCommandedStop = true
        bot.chat(`/m ${playerid} ${local.get_content("STORE_STOP")}`)
    }

    async function find_place(abc,playerid,position) {
        point = settings.store_place[store_place_index]
        abc.chat(`/m ${playerid} ${await get_content("STORE_ON_THE_WAY")}`)
        if (check_category()) {
            await find_can_store_warp(abc).then(async () => {
                await this.store(abc,playerid)
            }).catch(async () => {
                abc.chat(`/m ${playerid} ${await get_content("STORE_CANT_GO_THETE_ERROR")}`)
                await check_if_afk(abc,playerid)
            })
        } else {
             await find_can_store_home(abc).then(async () => {
                await this.store(abc,playerid)
            }).catch(async () => {
                abc.chat(`/m ${playerid} ${await get_content("STORE_CANT_GO_THETE_ERROR")}`)
                await check_if_afk(abc,playerid)
            })
        }

        async function find_can_store_warp(bot) {
            return new Promise(async function (resolve, reject) {
                let checkTP = false
                if (last_place === settings.store_place[store_place_index]) {
                    resolve()
                }
                last_place = settings.store_place[store_place_index]
                bot.on('message', check_and_tp_warp)
                bot.chat(`/warp ${last_place}`)
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
                    let warp_regex = new RegExp(/^\[系統\] 傳送您到公共傳送點/)
                    let no_warp_regex = new RegExp(/^\[系統\] 這個公共傳送點不存在!/)
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

        async function find_can_store_home(bot) {
            return new Promise(async function (resolve, reject) {
                let checkTPServer = false
                let checkTPHome = false
                if (last_place === settings.store_place[store_place_index]) {
                    resolve()
                }
                last_place = settings.store_place[store_place_index]
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
                    let server = settings.store_place[store_place_index].split(" ")[0]
                    if (server !== last_server) {
                        bot.on('message', check_change_server)
                        bot.chat(`/ts ${server}`)
                        last_server = server
                    } else {
                        checkTPServer = true
                    }
                    async function check_change_server(jsonMsg) {
                        let change_server_done = false
                        let change_server_done_regex = new RegExp(/^\[系統\] 讀取統計資料成功./)
                        let same_server_regex = new RegExp(/You are already connected to this server!/)
                        if (change_server_done_regex.test(jsonMsg.toString())) {
                            change_server_done = true
                            setTimeout(() => {
                                bot.removeListener('message', check_change_server)
                                if (bot.entity.position.x !== position.x && bot.entity.position.z !== position.z && change_server_done) {
                                    checkTPServer = true
                                }
                                else {
                                    checkTPServer = false
                                }
                            }, 10000)
                        }
                        else if(same_server_regex.test(jsonMsg.toString()))
                        {
                            checkTPServer = true
                        }
                    }
                }

                function tp_home(bot) {
                    let home_point = settings.store_place[store_place_index].split(" ")[1]
                    bot.on('message', check_tp_home)
                    bot.chat(`/homes ${home_point}`)
                    async function check_tp_home(jsonMsg) {
                        let no_home_regex = new RegExp(/^家 ：/)
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
            let home_regex = new RegExp(/[0-9]{1,2} h[0-9]{1,2}_[0-9][0-9][0-9][0-9]/)
            if (home_regex.test(settings.store_place[store_place_index])) {
                return false
            } else {
                return true
            }

        } //true warp | false home

    }


    async function check_if_afk(bot,playerid)
    {
        store_place_index++
        if(store_place_index === settings.store_place.length)
        {
            await bot.chat(`/m ${playerid} ${await get_content("STORE_DONE")}`)
            if(settings.enable_afk_after_store)
            {
                await afk.afk(bot,playerid,bot.entity.position)
            }
        }
        else
        {
            await find_place(bot,playerid,bot.entity.position)
        }
    }
    async function get_content(path)
    {
        return local.get_content(path,map,(store_place_index+1),point)
    }

    return this
}

function initMap(){
    map.set("0","index")
    map.set("1","point")
}



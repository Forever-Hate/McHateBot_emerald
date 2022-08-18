let isCommandedStop = false //是否命令停下
let store_place_index = 0
let last_server = 0
let last_place = ""
let point = ""
let map = new Map()
module.exports = function (local, afk, settings) {
    initMap()
    this.store_emerald = async function (bot, playerid, position,args) {
        isCommandedStop = false
        if(args.length === 2)
        {
            store_place_index = parseInt(args[1])
            console.log(store_place_index)
            if(store_place_index < 0 || store_place_index >= settings.store_place.length || isNaN(store_place_index))
            {
                bot.chat(`/m ${playerid} ${await get_content("STORE_FORMAT_ERROR")}`)
                return
            }
        }
        else
        {
            store_place_index = 0
        }
        last_server = 0
        last_place = ""
        if (settings.enable_multiple_place_store) {
            if (settings.store_place.length === 0 || settings.store_place[0] === "") {
                bot.chat(`/m ${playerid} ${await get_content("STORE_NO_ENOUGH_PLACE_ERROR")}`)
            } else {
                await find_place(bot, playerid, position)
            }
        } else {
            await this.store(bot, playerid)
        }
    }

    this.store = async function (bot, playerid) {
        const another_item_list = []
        const mcData = require("minecraft-data")(bot.version)
        let not_found_times = 0
        await bot.chat(`/m ${playerid} ${await get_content("STORE_FOUND_PLACE")}`)
        await bot.chat(`/m ${playerid} ${await get_content("STORE_START")}`)
        await repair()
        bot.on("windowOpen", o)
        await find_box()
        async function o(window) {
            if (window.title === "{\"color\":\"dark_green\",\"text\":\" 綠寶石銀行\"}")
            {
                bot.clickWindow(30, 0, 0).then(async () => {
                    window.close()
                    if (!isCommandedStop) {
                        setTimeout(async () => {
                            await find_box()
                        }, settings.store_emerald_cycle_delayTime)
                    } else {
                        bot.removeListener("windowOpen", o)
                    }
                })

            }
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

        async function find_box() {
                let ShulkerboxToOpen = bot.findBlock({
                    matching: mcData.blocksByName["shulker_box"].id,
                    count: 1,
                    maxDistance: 5,
                })
                let window
                if(!ShulkerboxToOpen)
                {
                    not_found_times++
                    console.log(`${await get_content("STORE_SHULKER_BOX_NOT_FOUND_ERROR")}`)
                    if (not_found_times === settings.store_emerald_check_times)
                    {
                        bot.removeListener("windowOpen", o)
                        await check_if_afk(bot, playerid)
                    } else {
                        setTimeout(async ()=>{
                            await find_box()
                        },settings.store_emerald_cycle_delayTime)
                    }
                }
                else
                {
                    await bot.lookAt(ShulkerboxToOpen.position, false)
                    let delay_open = setTimeout(async ()=>{
                        window = await bot.openContainer(ShulkerboxToOpen)
                    },2500)
                    window = await bot.openContainer(ShulkerboxToOpen)
                    clearTimeout(delay_open)
                    not_found_times = 0
                    let count = 0
                    if (window.containerItems().length !== 0) {
                        for (let item of window.containerItems()) {
                            try {
                                await window.withdraw(item.type, item.metadata, item.count)
                                if (item.type !== 687) {
                                    another_item_list.push(item)
                                }
                                else
                                {
                                    count += item.count
                                }
                            } catch (e) {
                                console.log(`cant take it:${e}`)
                            }
                        }
                        if (another_item_list.length !== 0) {
                            await tossItem(bot, another_item_list)
                            another_item_list.splice(0,another_item_list.length)
                        }
                        if(count !== 1728)
                        {
                            bot.removeListener("windowOpen", o)
                            await compensation(count)
                            bot.on("windowOpen", o)
                        }
                        bot.chat('/bank')

                    } else {
                        window.close()
                        await bot.dig(ShulkerboxToOpen).then(async () => {
                            if (!isCommandedStop) {
                                setTimeout(async () => {
                                    await find_box()
                                }, settings.store_emerald_cycle_delayTime)
                            } else {
                                bot.removeListener("windowOpen", o)
                            }
                        })
                    }
                }
        }

        function compensation(count)
        {
            return new Promise((resolve => {
                if(count !== 0)
                {
                    let times = Math.floor(count / 64)
                    let amount =  count % 64
                    let promise = []
                    bot.chat("/bank")
                    bot.once("windowOpen",async (window)=>{
                        for (let i = 0; i < times; i++) {
                            let p = new Promise(resolve => {
                                setTimeout(() => {
                                    bot.clickWindow(29, 0, 0).then(() => {
                                        resolve()
                                    })
                                }, 1000 * (i+1))
                            })
                            promise.push(p)
                        }
                        for (let i = 0; i < amount; i++) {
                            let p = new Promise(resolve => {
                                setTimeout(() => {
                                    bot.clickWindow(27, 0, 0).then(() => {
                                        resolve()
                                    })
                                }, 1000 * (i+1))
                            })
                            promise.push(p)
                        }
                        await Promise.all(promise).then(()=>{
                            window.close()
                            resolve()
                        })
                    })
                }
                else
                {
                    resolve()
                }
            }))

        }

        function repair()
        {
            return new Promise(async (resolve)=>{
                let count = 0
                for (let item of bot.inventory.items()) {
                    if(item.type === 687)
                    {
                        count = count + item.count
                    }
                }
                await compensation(count).then(()=>{
                    resolve()
                })
            })
        }
    }

    this.down = function (bot, playerid) {
        isCommandedStop = true
        bot.chat(`/m ${playerid} ${local.get_content("STORE_STOP")}`)
    }

    async function find_place(abc, playerid, position) {
        point = settings.store_place[store_place_index]
        abc.chat(`/m ${playerid} ${await get_content("STORE_ON_THE_WAY")}`)
        if (check_category()) {
            await find_can_store_warp(abc).then(async () => {
                await this.store(abc, playerid)
            }).catch(async () => {
                abc.chat(`/m ${playerid} ${await get_content("STORE_CANT_GO_THETE_ERROR")}`)
                await check_if_afk(abc, playerid)
            })
        } else {
            await find_can_store_home(abc).then(async () => {
                await this.store(abc, playerid)
            }).catch(async () => {
                abc.chat(`/m ${playerid} ${await get_content("STORE_CANT_GO_THETE_ERROR")}`)
                await check_if_afk(abc, playerid)
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
                let c = setInterval(() => {
                    if (checkTP) {
                        clearInterval(c)
                        clearTimeout(warpError)
                        resolve()
                    }
                }, 500)
                let warpError = setTimeout(() => {
                    clearInterval(c)
                    reject()
                }, 15000)


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

        async function find_can_store_home(bot) {
            return new Promise(async function (resolve, reject) {
                let checkTPServer = false
                let checkTPHome = false
                if (last_place === settings.store_place[store_place_index]) {
                    resolve()
                }
                last_place = settings.store_place[store_place_index]
                let a
                let c = setInterval(() => {
                    if (checkTPServer) {
                        clearInterval(c)
                        clearTimeout(serverError)
                        a = setInterval(() => {
                            if (checkTPHome) {
                                clearInterval(a)
                                clearTimeout(homeError)
                                resolve()
                            }
                        }, 500)
                        tp_home(bot)
                    }
                }, 500)
                let serverError = setTimeout(() => {
                    clearInterval(c)
                    reject()
                }, 30000)
                let homeError = setTimeout(() => {
                    clearInterval(a)
                    reject()
                }, 60000)
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
                        let change_server_done_regex = new RegExp(/^\[統計系統\] 讀取統計資料成功./)
                        let same_server_regex = new RegExp(/You are already connected to this server!/)
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
                        } else if (same_server_regex.test(jsonMsg.toString())) {
                            checkTPServer = true
                        }
                    }
                }

                function tp_home(bot) {
                    let home_point = settings.store_place[store_place_index].split(" ")[1]
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

        function check_category() {
            let home_regex = new RegExp(/^[0-9]{1,2}\s\w/)
            if (home_regex.test(settings.store_place[store_place_index])) {
                return false
            } else {
                return true
            }

        } //true warp | false home

    }


    async function check_if_afk(bot, playerid) {
        store_place_index++
        if (store_place_index === settings.store_place.length || !settings.enable_multiple_place_store) {
            await bot.chat(`/m ${playerid} ${await get_content("STORE_DONE")}`)
            if (settings.enable_afk_after_store) {
                await afk.afk(bot, playerid, bot.entity.position)
            }
        } else {
            await find_place(bot, playerid, bot.entity.position)
        }
    }

    async function get_content(path) {
        return local.get_content(path, map, (store_place_index + 1), point)
    }

    return this
}

function initMap() {
    map.set("0", "index")
    map.set("1", "point")
}



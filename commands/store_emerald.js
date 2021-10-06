module.exports = async (bot,playerid,mcData) => {
    setInterval(async function () {
        try{
           let ShulkerboxToOpen = bot.findBlock({
                matching: mcData.blocksByName["shulker_box"].id,
                count:1,
                maxDistance : 5,
            })
            let shulker_box = await bot.openChest(ShulkerboxToOpen)
            await withdrawItem(shulker_box, "emerald", 1728)
            await store()
        }catch (err)
        {
            console.log(`找不到界伏盒 ${err}`)
        }
    }, 3000)
    async function withdrawItem (shulker_box,name, amount) {
        const item = itemByName(shulker_box.containerItems(), name)
        if (item) {
            try {
                await shulker_box.withdraw(item.type, null, amount)
            } catch (err) {
                bot.chat(`/m ${playerid} 無法取出${amount}個${item.name}`)
            }
        } else {
            bot.chat(`/m ${playerid} 未知的物品名稱${name}`)
        }
    }
    function itemByName (items, name) {
        let item
        let i
        for (i = 0; i < items.length; ++i) {
            item = items[i]
            if (item && item.name === name) return item
        }
        return null
    }
    async function store()
    {

        try
        {
            bot.chat("/bank")
            bot.on("windowOpen", function openBank(window) {
                //console.log(window)
                bot.clickWindow(30, 0, 0, () => {
                   // console.log("增加1728元")
                    bot.removeListener("windowOpen", openBank)
                })
            })
        }
        catch (err)
        {
            console.log(`存入銀行時發生錯誤${err}`)
        }
    }
}
module.exports = function (local){
    this.discard_item = async function (bot){
        console.log(`${local.get_content("DISCARD_MSG")}`)
        let inventory = bot.inventory
        for (let item of inventory.items()) {
            if (item !== null) {
                await bot.tossStack(item).then((err) => {
                    if (err) {
                        console.log("錯誤:" + err)
                    }
                })
            }
        }
    }

    return this
}
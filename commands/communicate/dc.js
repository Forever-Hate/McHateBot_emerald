const {
    Client,
    Intents
} = require('discord.js')
const intents = new Intents(['GUILDS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES'])
const client = new Client({
    intents: intents,
    partials: [
        'CHANNEL', // Required to receive DMs
    ]
})

let reply_id = ""
let error = ""
let username = ""
let command = ""
let map = new Map()
module.exports = function (local, settings) {
    let r = new RegExp("^" + settings.dc_cmd_prefix)
    initMap()
    this.modify_reply_id = function (id) {
        reply_id = id
    }
    this.send = function (sender, msg) {
        if (settings.enable_send_msg_to_channel) {
            let channel = client.channels.cache.get(settings.channel_ID)
            if (!channel) {
                console.log(get_content("DC_FORWARD_CHANNEL_NOT_FOUND"))
                return
            }
            if (sender === "") {
                channel.send(`${msg}`)
            } else {
                channel.send(`${sender} : ${msg}`)
            }
        } else {
            client.users.fetch(settings.forward_DC_ID).then((user) => {
                if (sender === "") {
                    user.send(msg).catch((err) => {
                        console.log(err)
                    })
                } else {
                    user.send(sender + " : " + msg).catch((err) => {
                        console.log(err)
                    })
                }
            })
        }
    }

    this.login = function (bot, enable_reply, token, DC_ID) {
        client.once('ready', () => {
            username = client.user.username
            console.log(`${get_content("DC_BANNER")}`)
            console.log(`${get_content("DC_BOT_ONLINE")}`)
            let user = client.users.fetch(DC_ID)
            if (!user) {
                console.log(`${get_content("DC_USER_NOT_FOUND")}`)
                throw new DiscordBotException("Discord User Not Found")
            } else {
                console.log(`${get_content("DC_USER_FOUND")}`)
            }
            console.log(`${get_content("DC_BANNER")}`)
        })
        if (enable_reply) {
            client.removeAllListeners('messageCreate')
            client.on('messageCreate', msg => {
                if (msg.author.id === client.user.id) return
                if (msg.channel.id !== settings.channel_ID && msg.channel.type !== "DM") return;
                if (msg.author.id !== settings.forward_DC_ID)
                {
                    msg.channel.send(`${get_content("DC_NO_PERMISSION")}`)
                    return;
                }
                if ((msg.channel.type === "DM" && !settings.enable_send_msg_to_channel)  || (msg.channel.type !== "DM" && settings.enable_send_msg_to_channel)) {
                    if (r.test(msg.content)) {
                        command = msg.content.replace(settings.dc_cmd_prefix, "").split(" ")[0]
                        switch (command) {
                            case "cmd":
                                bot.chat(msg.content.slice(4))
                                this.send("", get_content("DC_COMMAND_EXECUTED"))
                                break;
                            default: {
                                this.send("", get_content("DC_NO_MATCH_COMMAND"))
                                command = ""
                            }
                        }
                    }
                    else if (msg.reference !== null && msg.mentions.repliedUser !== null) //是否訊息有指定回覆哪則訊息
                    {
                        msg.channel.messages.fetch(msg.reference.messageId)  //取得回覆訊息的文字內容
                            .then(message => {
                                console.log(message.content)
                                let splited_msg = message.content.split(' ')
                                if (splited_msg.length >= 3) {
                                    reply_id = splited_msg[0]
                                } else if (splited_msg.length >= 1) {
                                    reply_id = splited_msg[0].substring(6)
                                }
                                if(msg.mentions.repliedUser.id === client.user.id)
                                {
                                    bot.chat(`/m ${reply_id} ${msg.content}`)
                                    this.send("", get_content("DC_RESPONSE_MSG"))
                                }
                            })
                            .catch(() => console.log("replied msg not found"));
                    }
                    else if (reply_id !== "") {
                        bot.chat(`/m ${reply_id} ${msg.content}`)
                        this.send("", get_content("DC_RESPONSE_MSG"))
                    }
                    else {
                        this.send("", get_content("NO_ONE_REPLIED"))
                    }
                }
            });
        }
        client.login(token).catch((e) => {
            error = e.toString()
            console.log(`${get_content("DC_BANNER")}`)
            console.log(`${get_content("DC_BOT_OFFLINE")}`)
            console.log(`${get_content("DC_BANNER")}`)
            throw new DiscordBotException(error)
        })
    }

    function get_content(path) {
        return local.get_content(path, map, username, error, reply_id, command)
    }

    function initMap() {
        map.set("0", "name")
        map.set("1", "error")
        map.set("2", "reply_id")
        map.set("3", "command")
    }

    return this
}

function DiscordBotException(message) {
    this.message = message;
    this.name = "DiscordBotException";
}

DiscordBotException.prototype.toString = function () {
    return this.name + ': "' + this.message + '"';
}











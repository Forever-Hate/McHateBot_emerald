import { Client, Partials,IntentsBitField, TextChannel, User, Collection, Events, REST, Routes, Embed } from 'discord.js';
import { localizer } from '../../utils/localization';
import { logger } from '../../utils/logger';
import fs from 'fs';
import path from 'path';
import { bot } from '../main/bot';
import { settings } from '../../utils/util';

const intents = new IntentsBitField(['Guilds', 'GuildMessages', 'DirectMessages']);
const client = new Client({ intents: intents, partials: [Partials.Channel] });
client.commands = new Collection();

class DiscordBotException extends Error 
{
    constructor(message: string) {
      super(message);
      this.name = "DiscordBotException";
    }
}

export let discordManager:DiscordManager;

export class DiscordManager
{

    replyId:string = ""; //回覆的玩家ID
    map:Map<string, string> = new Map(); 
    numOfCommand: number = 0; //slash指令總數
    username:string = ""; //DC bot名稱
    error:string = ""; //錯誤訊息
    
    /**
     * 更換回覆的ID
     * @param { string } id 要更換的ID
     */
    modifyReplyId(id: string):void
    {
        logger.i("進入modifyReplyId，更換回覆訊息ID")
        this.replyId = id;
    }

    /**
     * 發送訊息至Discord
     * @param { string } sender - 發送者ID 
     * @param { string } msg - 訊息內容 
    */
    send (sender: string, msg: string):void
    {
       logger.i("進入send，發送訊息至DC")
       if (settings.enable_send_msg_to_channel) 
       {
           logger.d("開啟訊息轉發至頻道")
            const channel: TextChannel | null = client.channels.cache.get(settings.channel_ID) as TextChannel | null;
            if (!channel) 
            {
                logger.d("找不到頻道")
                this._setMap();
                logger.l(localizer.format("DC_FORWARD_CHANNEL_NOT_FOUND",this.map) as string);
                return;
            }
            if (sender === "") 
            {
                logger.d("bot自己傳訊息")
                channel.send(`${msg}`).catch((error)=>{
                    logger.e(error)
                });
            } 
            else 
            {
                logger.d("其他人傳訊息")
                channel.send(`${sender} : ${msg}`).catch((error)=>{
                    logger.e(error)
                });
            }
        } 
        else 
        {
            logger.d("開啟訊息轉發至私訊")
            client.users.fetch(settings.forward_DC_ID[0]).then((user: User) => {
                if (sender === "") 
                {
                    logger.d("bot自己傳訊息")
                    user.send(msg).catch((err: Error) => {
                        logger.e(err.message);
                    });
                } 
                else 
                {
                    logger.d("其他人傳訊息")
                    user.send(sender + " : " + msg).catch((err: Error) => {
                        logger.e(err.message);
                    });
                }
            })
            .catch((error)=>{
                logger.e(error)
            })
        }
    }
    
    /**
     * 發送Embed至Discord
     * @param { Embed } embed - 內嵌內容
    */
    sendEmbed(embed:Embed)
    {
        logger.i("進入sendEmbed，發送Embed至DC")
        if (settings.enable_send_msg_to_channel) 
        {
            logger.d("開啟訊息轉發至頻道")
            const channel: TextChannel | null = client.channels.cache.get(settings.channel_ID) as TextChannel | null;
            if (!channel) 
            {
                logger.d("找不到頻道")
                this._setMap();
                logger.l(localizer.format("DC_FORWARD_CHANNEL_NOT_FOUND",this.map) as string);
                return;
            }
            channel.send({embeds:[embed]}).catch((error)=>{
                logger.e(error)
            });
        } 
        else 
        {
            logger.d("開啟訊息轉發至私訊")
            client.users.fetch(settings.forward_DC_ID[0]).then((user: User) => {
                user.send({embeds:[embed]}).catch((err: Error) => {
                    logger.e(err.message);
                });
            })
            .catch((error)=>{
                logger.e(error)
            })
        }
    }

    /**
     * 上線discord bot 
    */
    login() 
    {
        logger.i("進入login，上線discord bot")
        client.once(Events.ClientReady, async () => {    
            logger.i("discord bot 上線完成")
            this.username = client.user?.username || '';
            this._setMap();
            logger.l(`${localizer.format("DC_BANNER",this.map)}`);
            logger.l(`${localizer.format("DC_BOT_ONLINE",this.map)}`);
            const user = await client.users.fetch(settings.forward_DC_ID[0])
            if (!user) {
                logger.l(`${localizer.format("DC_USER_NOT_FOUND",this.map)}`);
                throw new DiscordBotException("Discord User Not Found");
            } else {
                logger.l(`${localizer.format("DC_USER_FOUND",this.map)}`);
            }
            if(settings.enable_slash_command)
            {
                logger.d("有開啟DC應用程式(/)指令")
                this.numOfCommand = await this._setSlashCommand();
                this._setMap();
                client.on(Events.InteractionCreate, async interaction => {
                    if (interaction.isChatInputCommand())
                    {
                        if(!settings.forward_DC_ID.includes(interaction.user.id))
                        {
                            interaction.reply({content:`${localizer.format("DC_NO_PERMISSION",this.map)}`,ephemeral:true})
                            return
                        }

                        const command = interaction.client.commands.get(interaction.commandName);
                 
                        if (!command) {
                            logger.e(`未找到指令 ${interaction.commandName} `);
                            return;
                        }
                 
                        try {
                            await command.execute(interaction,bot);
                        } catch (error) {
                            logger.e(error);
                            if (interaction.replied || interaction.deferred) {
                                await interaction.followUp({ content: '執行指令時發生錯誤!', ephemeral: true });
                            } else {
                                await interaction.reply({ content: '執行指令時發生錯誤!', ephemeral: true });
                            }
                        }
                    }
                    else if (interaction.isAutocomplete()) {
                        const command = interaction.client.commands.get(interaction.commandName);
                
                        if (!command) {
                            logger.e(`未找到指令 ${interaction.commandName} `);
                            return;
                        }
                
                        try {
                            await command.autocomplete(interaction);
                        } catch (error) {
                            logger.e(error);
                        }
                    }
                });
                logger.l(`${localizer.format("DC_SLASH_COMMAND_REGISTERED",this.map)}`)
            }
            else
            {
                logger.d("未開啟DC應用程式(/)指令")
                logger.l(`${localizer.format("DC_SLASH_COMMAND_NOT_REGISTERED",this.map)}`)
            }
            logger.l(`${localizer.format("DC_BANNER",this.map)}`);
        });

        client.login(settings.bot_token).catch((e: Error) => {
            this.error = e.toString();
            this._setMap();
            logger.l(`${localizer.format("DC_BANNER",this.map)}`);
            logger.l(`${localizer.format("DC_BOT_OFFLINE",this.map)}`);
            logger.l(`${localizer.format("DC_BANNER",this.map)}`);
            throw new DiscordBotException(this.error);
        });
    };

    /**
     * 內部函數，建立變數的映射值
     */
    _setMap()
    {
        logger.i("進入_setMap，設定變數的映射值")
        this.map.set("name",this.username)
        this.map.set("error",this.error)
        this.map.set("replyId",this.replyId)
        this.map.set("numOfCommand",this.numOfCommand.toString())
    }

    /**
     * 內部函數，註冊discord slash command
     */
    async _setSlashCommand():Promise<number>
    {
        logger.i("進入_setSlashCommand，註冊指令")
        let numOfCommand:number = 0;
        //指令暫存列表
        const commands = [];
        //抓取所有指令的根資料夾
        const foldersPath = path.join(__dirname, 'commands');
        const commandFolders = fs.readdirSync(foldersPath);
        //將指令從資料夾中個別讀取，並判斷是否符合格式
        for (const folder of commandFolders) 
        {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith(process.env.DEVELOP! == "true" ? '.ts' : '.js')); //因執行階段為js故修改為.js 開發階段就改回.ts
            for (const file of commandFiles) 
            {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) 
                {
                    //將指令存在一個暫存
                    commands.push(command.data.toJSON());
                    //將指令存在client物件上(需修改Client物件的index.d.ts，設定一個新的屬性)
                    client.commands.set(command.data.toJSON()['name'],command) 
                } 
                else 
                {
                    logger.e(`[警告] 指令路徑 ${filePath} 缺少必要的 "data" or "execute" 屬性`);
                }
            }
        }

        // 建構及準備一個REST實例
        const rest = new REST().setToken(settings.bot_token);

        // 建立slash commamd
        try 
        {
            logger.d(`開始更新 ${commands.length} 個應用程式(/)指令`);

            // 將會覆蓋bot所有的指令(目前是全域指令) 
            // 單一伺服器指令 Routes.applicationGuildCommands(settings.bot_application_ID,"guild_id"),
            const data = await rest.put(
                Routes.applicationCommands(settings.bot_application_ID),
                { body: commands },
            );
            numOfCommand = (data as Array<any>).length;
            logger.d(`成功更新 ${(data as Array<any>).length} 個應用程式(/)指令`);
        } 
        catch (error) 
        {
            logger.e(error);
        }

        return numOfCommand;
    }

    constructor()
    {
        logger.i("建立DiscordManager物件")
    }
}

export default function setDiscordManager()
{
    logger.i("進入setDiscord，建立一個新的DiscordManager物件")
    discordManager = new DiscordManager();
}
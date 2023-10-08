import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { logger } from '../../../../utils/logger';
import { storeEmeraldManager } from '../../../main/store_emerald';
import { localizer } from '../../../../utils/localization';
import { getDiscordStoreLogEmbed, settings } from '../../../../utils/util';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('currentlog')
		.setDescription('取得當前存綠紀錄'),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行currentlog指令")
		await interaction.deferReply({ephemeral:true});
        const storeLog = storeEmeraldManager.getCurrentLog()
        if(storeLog)
        {
            await interaction.followUp({embeds:[getDiscordStoreLogEmbed(storeLog,false)]});
        }
        else
        {
            await interaction.followUp({content:localizer.format("STORE_NOT_PROCESS_ERROR") as string});
        }
	},
};
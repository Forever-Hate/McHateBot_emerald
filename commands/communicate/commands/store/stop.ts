import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { logger } from '../../../../utils/logger';
import { storeEmeraldManager } from '../../../main/store_emerald';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('停止存綠'),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行stop指令")
		await interaction.deferReply({ephemeral:true});
        const msg = await storeEmeraldManager.stopStoreEmerald("",true)
		await interaction.followUp({content:msg});
	},
};
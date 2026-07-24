import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { informer } from '../../../main/inform.ts';
import { logger } from '../../../../utils/logger.ts';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('version')
		.setDescription('查詢bot的版本'),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行version指令")
		await interaction.deferReply({ ephemeral: true });
		await interaction.followUp({content:informer.version(undefined,true)});
	},
};
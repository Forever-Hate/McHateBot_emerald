import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { informer } from '../../../main/inform';
import { logger } from '../../../../utils/logger';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('exp')
		.setDescription('查詢bot當前經驗值'),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行exp指令")
		await interaction.deferReply({ ephemeral: true });
		await interaction.followUp({content:`\`\`\`${informer.experience(undefined,true)}\`\`\``});
	},
};
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { logger } from '../../../../utils/logger.ts';
import { financer } from '../../../main/finance.ts';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('money')
		.setDescription('獲得bot身上金錢餘額'),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行money指令");
        await interaction.deferReply({ ephemeral: true });
		const msg = await financer.money(undefined,true);
		await interaction.followUp({content:msg,ephemeral:true});
	},
};
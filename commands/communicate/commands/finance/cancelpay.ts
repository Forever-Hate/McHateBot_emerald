import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { logger } from '../../../../utils/logger.ts';
import { financer } from '../../../main/finance.ts';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cancelpay')
		.setDescription('取消轉帳(僅限跨分流)'),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行cancelpay指令");
        await interaction.deferReply({ ephemeral: true });
		const msg = await financer.cancelPay(undefined,true);
		await interaction.followUp({content:msg,ephemeral:true});
	},
};
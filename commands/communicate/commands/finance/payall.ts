import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { logger } from '../../../../utils/logger';
import { financer } from '../../../main/finance';
import { localizer } from '../../../../utils/localization';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('payall')
		.setDescription('轉帳身上所有錢給指定玩家')
		.addStringOption(option =>
			option.setName('playerid')
				.setDescription('接受轉帳玩家ID')
				.setRequired(true)),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行payall指令");
        await interaction.deferReply({ ephemeral: true });
		const playerid = interaction.options.getString("playerid")
        await interaction.followUp({content:localizer.format("FINANCE_PAY_PROCESSING") as string});
		const msg:string = await financer.payall(`Discord User: ${interaction.user.displayName}`,["",playerid!],true)
		await interaction.editReply({content:msg as string}); 
	},
};
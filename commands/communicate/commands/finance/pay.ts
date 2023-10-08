import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { logger } from '../../../../utils/logger';
import { localizer } from '../../../../utils/localization';
import { financer } from '../../../main/finance';


module.exports = {
	data: new SlashCommandBuilder()
		.setName('pay')
		.setDescription('轉帳給指定玩家')
		.addStringOption(option =>
			option.setName('playerid')
				.setDescription('接受轉帳玩家ID')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('expence')
				.setDescription('金額')
				.setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('理由')),
	async execute(interaction:ChatInputCommandInteraction) 
	{	logger.i("執行pay指令");
        await interaction.deferReply({ ephemeral: true });
		const playerid = interaction.options.getString("playerid")
		const expence = interaction.options.getString("expence")
        const reason = interaction.options.getString("reason") ?? "無"
        await interaction.followUp({content:localizer.format("FINANCE_PAY_PROCESSING") as string});
		const msg:string = await financer.pay(`discord user: ${interaction.user.displayName}`,["",playerid!,expence!,reason],true)
		await interaction.editReply({content:msg as string}); 
	},
};
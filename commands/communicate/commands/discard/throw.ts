import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { logger } from '../../../../utils/logger.ts';
import { localizer } from '../../../../utils/localization.ts';
import { discardItemer } from '../../../../utils/discarditem.ts'

module.exports = {
	data: new SlashCommandBuilder()
		.setName('throw')
		.setDescription('丟棄bot身上所有物品'),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行throw指令");
		await discardItemer.discardAllItems();
		await interaction.reply({content:localizer.format("DC_COMMAND_EXECUTED") as string,ephemeral:true}); 
	},
};
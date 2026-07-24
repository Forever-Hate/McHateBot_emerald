import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { logger } from '../../../../utils/logger.ts';
import { afkManager } from '../../../main/afk.ts';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('afk')
		.setDescription('開始掛機'),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行afk指令")
		await interaction.deferReply({});
        const msg = await afkManager.afk("",true)
		await interaction.followUp({content:msg});
	}
};
import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { logger } from '../../../../utils/logger';
import { storeEmeraldManager } from '../../../main/store_emerald';
import { settings } from '../../../../utils/util';
import { afkManager } from '../../../main/afk';

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
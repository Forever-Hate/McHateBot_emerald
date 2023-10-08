import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { logger } from '../../../../utils/logger';
import { bot } from '../../../main/bot';
import { localizer } from '../../../../utils/localization';
module.exports = {
	data: new SlashCommandBuilder()
		.setName('cmd')
		.setDescription('透過bot輸入指令')
		.addStringOption(option =>
			option.setName('msg')
				.setDescription('指令內容')
				.setRequired(true)),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行cmd指令");
		const msg = interaction.options.getString("msg");
        bot.chat(msg!)
		await interaction.reply({content:localizer.format("DC_COMMAND_EXECUTED") as string ,ephemeral:true}); 
	},
};
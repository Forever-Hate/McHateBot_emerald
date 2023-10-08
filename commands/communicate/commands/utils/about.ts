import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { informer } from '../../../main/inform';
import { logger } from '../../../../utils/logger';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('關於此bot'),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行about指令")
		await interaction.deferReply({ ephemeral: true });
		let content:string = "";
		informer.about(undefined,true).forEach((str, index) => {
			content = content + str + "\n"
        })
		await interaction.followUp({content:`\`\`\`${content}\`\`\``});
	},
};
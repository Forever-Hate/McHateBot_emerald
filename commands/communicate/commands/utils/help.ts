import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { informer } from '../../../main/inform';
import { logger } from '../../../../utils/logger';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('查詢bot的指令列表'),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行help指令")
		await interaction.deferReply({ ephemeral: true });
		let content:string = "";
		informer.help(undefined,true).forEach((str, index) => {
			content = content + str + "\n"
        })
		await interaction.followUp({content:`\`\`\`${content}\`\`\``});
	},
};
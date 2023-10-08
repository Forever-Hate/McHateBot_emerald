import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { logger } from '../../../../utils/logger';
import { announcer } from '../../../publicity/announcement';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('switch')
		.setDescription('強制切換至下一組宣傳詞'),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行switch指令");
		await interaction.deferReply({ ephemeral: true });
		let content = "";
		const msgList = announcer.switchAnnouncement(undefined,true);
		msgList.forEach((str,index)=>{
			content = content + str + "\n";
		})
		await interaction.followUp({content:content}); 
	},
};
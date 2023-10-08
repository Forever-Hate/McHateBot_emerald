import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { logger } from '../../../../utils/logger';
import { replyManager } from '../../../main/reply';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reply')
		.setDescription('回覆玩家訊息')
        .addStringOption(option =>
			option.setName('msg')
				.setDescription('訊息內容')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('playerid')
				.setDescription('要回覆的玩家ID(預設回覆給最後傳訊息的玩家)')),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行reply指令")
		await interaction.deferReply({ ephemeral: true });
        const msg = replyManager.whitelistedReply(interaction.options.getString("playerid") ?? "",interaction.options.getString("msg")!,true);
		await interaction.followUp({content:msg});
	},
};
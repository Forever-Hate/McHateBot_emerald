import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { logger } from '../../../../utils/logger';
import { storeEmeraldManager } from '../../../main/store_emerald';
import { settings } from '../../../../utils/util';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('store')
		.setDescription('開始存綠')
        .addStringOption(option =>
			option.setName('place')
				.setDescription('開始地點')
				.setAutocomplete(true))
		.addStringOption(option =>
			option.setName('reason')
				.setDescription('備註')),
	async execute(interaction:ChatInputCommandInteraction) 
	{
		logger.i("執行store指令")
		await interaction.deferReply();
		const args = [""]
		const place = interaction.options.getString("place") ?? "0";
		const reason = interaction.options.getString("reason") ?? "無";
		if(settings.enable_multiple_place_store)
		{
			logger.d("有開啟多點卸盒，參數正常順序")
			args.push(place,reason)
		}
		else
		{
			logger.d("未開啟多點卸盒，參數交換順序")
			args.push(reason,place)
		}
        const msg = await storeEmeraldManager.storeEmerald(`From Discord User:${interaction.user.displayName}`,args,true)
		await interaction.followUp({content:msg});
	},
	async autocomplete(interaction:AutocompleteInteraction) 
	{
		logger.i("執行store autocomplete");
		const storePlaceList = settings.store_place;
		//const focusedValue = interaction.options.getFocused();
		const choices = storePlaceList.map((storePlace,index) => `${index+1}. ${storePlace.includes("-") ? `分流: ${storePlace.split("-")[0]} 家點: ${storePlace.split("-")[1]}`: `公傳點:${storePlace}`}`)
		//const filtered = choices.filter(choice => choice.startsWith(focusedValue));
		await interaction.respond(
			settings.enable_multiple_place_store ? choices.map((choice,index) => ({ name: choice, value: (index+1).toString()})) : [({ name: "請先開啟多點存綠功能", value: "0"})],
		);
	},
};
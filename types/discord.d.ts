import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Collection,
    SlashCommandBuilder,
} from 'discord.js';

interface DiscordCommand {
    data: SlashCommandBuilder;
    execute(interaction: ChatInputCommandInteraction, bot: unknown): Promise<void>;
    autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, DiscordCommand>;
    }
}
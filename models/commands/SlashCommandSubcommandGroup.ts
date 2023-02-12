import {
    ChatInputCommandInteraction,
    SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import { SlashCommandSubcommand } from "./SlashCommandSubcommand";

export class SlashCommandSubcommandGroup {
    private commands: SlashCommandSubcommand[] = [];
    public builder = new SlashCommandSubcommandGroupBuilder();

    constructor(name: string, description: string) {
        this.builder.setName(name);
        this.builder.setDescription(description);
    }

    addCommand(subcommand: SlashCommandSubcommand) {
        this.commands.push(subcommand);
        this.builder.addSubcommand(subcommand.builder);

        return this;
    }

    get subcommands() {
        return this.commands;
    }

    runCommand(
        interaction: ChatInputCommandInteraction,
        subcommand?: { name: string; group: string }
    ) {
        const target = this.commands.find(
            (c) =>
                c.builder.name == subcommand?.name ||
                (interaction.commandName && subcommand?.group) ||
                interaction.options.getSubcommandGroup()
        );

        if (!target) return;

        target.run(interaction);
    }
}

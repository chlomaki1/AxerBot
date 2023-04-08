import { SlashCommand } from "../../models/commands/SlashCommand";
import config from "../../config.json";
import MissingPermissions from "../../responses/embeds/MissingPermissions";
import generateSuccessEmbed from "../../helpers/text/embeds/generateSuccessEmbed";
import { StatusManager } from "../../modules/status/StatusManager";
import { exec } from "child_process";

const shutdown = new SlashCommand(
    "rebuild",
    "Shutdown and build axer again",
    "Developers",
    true
);

shutdown.builder.addStringOption((o) =>
    o.setName("reason").setDescription("reason to shutdown").setRequired(false)
);

shutdown.setExecuteFunction(async (command) => {
    if (!config.owners.includes(command.user.id))
        return command.editReply({
            embeds: [MissingPermissions],
        });

    const reason = command.options.getString("reason") || undefined;

    const status = new StatusManager();

    status
        .sendOutageMessage(reason, command.user)
        .then(() => {
            command
                .editReply({
                    embeds: [generateSuccessEmbed("Done!")],
                })
                .then(() => executeBuild)
                .catch(() => executeBuild);
        })
        .catch(executeBuild);

    function executeBuild() {
        exec(`sudo sh ./bin/rebuild.sh`, (error, stdout, stderr) => {
            if (error === null) {
                status.sendBuildMessage(reason, command.user);
            } else {
                status.sendErrorMessage(error.message);
            }
        });
    }
});

export default shutdown;
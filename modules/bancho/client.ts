import { BanchoClient } from "bancho.js";
import {
    consoleCheck,
    consoleError,
    consoleLog,
} from "../../helpers/core/logger";
import { BanchoCommands } from "./commands";

export const bancho = new BanchoClient({
    username: process.env.IRC_USERNAME || "eae",
    password: process.env.IRC_PASSWORD || "eae",
    port: Number(process.env.IRC_PORT) || 6667,
    apiKey: process.env.OSU_API_KEY,
});

bancho.on("PM", (pm) => {
    if (pm.user.ircUsername == process.env.IRC_USERNAME) return;
    if (pm.content[0] != "!") return;

    const args = pm.content.split(" ");

    const commandName = args.splice(0, 1)[0].slice(1);

    const requestedCommand = BanchoCommands.find(
        (c) => c.settings.name == commandName
    );

    if (!requestedCommand) {
        consoleLog("BanchoCommandHandler", `Command ${commandName} not found!`);

        return;
    }

    requestedCommand.run(pm, bancho, args);
});

export function connectToBancho() {
    bancho
        .connect()
        .then((bancho) => {
            consoleCheck(
                "BanchoClient",
                `Connected to bancho as ${process.env.IRC_USERNAME}!`
            );
        })
        .catch((e) => {
            consoleError("BanchoClient", `${e}`);
        });
}

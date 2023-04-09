import "colors";
import { Client, IntentsBitField } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import eventHandler from "./helpers/core/eventHandler";
import { consoleCheck } from "./helpers/core/logger";
import registerCommands from "./helpers/interactions/registerCommands";
import { startAvatarListener } from "./modules/avatar/avatarManager";
import { connectToBancho } from "./modules/bancho/client";
import { listenMapperTracker } from "./modules/mappertracker/mapperTrackerManager";
import "./modules/osu/fetcher/startConnection";
import keepAlive from "./server";

const token = process.env.TOKEN;

export const bot = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.DirectMessageTyping,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.DirectMessageReactions,
        IntentsBitField.Flags.DirectMessageTyping,
    ],
});

keepAlive();

// ? create missing folders
if (!fs.existsSync("./cache")) fs.mkdirSync("./cache");
if (!fs.existsSync("./temp/spectro/audio"))
    fs.mkdirSync("./temp/spectro/audio", { recursive: true });
if (!fs.existsSync("./temp/spectro/images"))
    fs.mkdirSync("./temp/spectro/images", { recursive: true });

bot.login(token).then(() => {
    connectToBancho();
    eventHandler(bot);
    registerCommands(bot);
    startAvatarListener(bot);
    listenMapperTracker();
    consoleCheck("index.ts", "Running and listening to commands!");
});

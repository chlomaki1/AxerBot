import {
	Interaction,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
} from "discord.js";
import { users } from "../../database";
import createNewUser from "../../database/utils/createNewUser";
import { IVerificationObject } from "../../modules/verification/client/GenerateAuthToken";

export default async (interaction: Interaction) => {
	if (!interaction.isButton()) return;

	const targets = interaction.customId.split("|");

	if (targets[0] != "verification") return;

	if (interaction.user.id != targets[1])
		return interaction.reply({
			content: `**You're not allowed to use this!**`,
			ephemeral: true,
		});

	if (!interaction.guild) return;

	let user_db = await users.findById(targets[1]);

	if (!user_db == null) user_db = await createNewUser(interaction.user);

	const verification = user_db.pending_verifications.find(
		(v: IVerificationObject) => v.guild == targets[2]
	);

	if (!verification)
		return interaction.reply({
			content: `**You don't have any pending verification here... If this is an error, join on the server again!**)`,
			ephemeral: true,
		});

	// ? Message that will be sent in user dm
	const embed = new MessageEmbed({
		title: "osu! OAuth Verification Request",
		description: `The server **${interaction.guild.name}** wants to know who you are. You need to authorize with your osu! account so we can verify your identity from your read-only profile data (username, mode, usergroup, etc...).`,
		thumbnail: {
			url: interaction.guild.iconURL() || "",
		},
		color: "#f72a59",
	});

	const buttons = new MessageActionRow();
	buttons.addComponents([
		new MessageButton({
			style: "LINK",
			url: `https://axer-auth.herokuapp.com/authorize?code=${verification.token}&user=${interaction.user.id}`,
			label: "Verify my account",
		}),
	]);

	interaction.reply({
		embeds: [embed],
		components: [buttons],
		ephemeral: true,
	});
};
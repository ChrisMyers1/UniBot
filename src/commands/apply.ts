import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { ensureGuild, prisma } from "../lib/db";

export const data = new SlashCommandBuilder()
  .setName("apply")
  .setDescription("Start a request/application from this server's option list");

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  await ensureGuild(guildId);

  const options = await prisma.appOption.findMany({ where: { guildId } });

  if (options.length === 0) {
    await interaction.reply({
      content:
        "No application options have been configured yet. An admin can add some with /config add-app-option.",
      ephemeral: true,
    });
    return;
  }

  // Discord select menus support up to 25 options.
  const menu = new StringSelectMenuBuilder()
    .setCustomId("apply-select")
    .setPlaceholder("Choose an option...")
    .addOptions(
      options.slice(0, 25).map((o) => ({ label: o.label, value: o.value }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

  await interaction.reply({
    content: "What would you like to submit?",
    components: [row],
    ephemeral: true,
  });
}

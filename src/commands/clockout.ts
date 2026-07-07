import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { prisma, ensureGuild } from "../lib/db";
import { closeEntryAndAccumulate } from "../lib/timeTracking";
import { formatDuration } from "../lib/duration";

export const data = new SlashCommandBuilder()
  .setName("clockout")
  .setDescription("Clock yourself out");

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  await ensureGuild(guildId);

  const openEntry = await prisma.timeEntry.findFirst({
    where: { guildId, userId, status: "in" },
  });

  if (!openEntry) {
    await interaction.reply({
      content: "You're not currently clocked in.",
      ephemeral: true,
    });
    return;
  }

  const seconds = await closeEntryAndAccumulate(
    openEntry.id,
    guildId,
    userId,
    openEntry.clockInAt,
    new Date()
  );

  await interaction.reply(
    `🔴 <@${userId}> clocked out. Session: ${formatDuration(seconds)}`
  );
}

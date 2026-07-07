import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { ensureGuild, prisma } from "../lib/db";
import { formatDuration } from "../lib/duration";

export const data = new SlashCommandBuilder()
  .setName("mytime")
  .setDescription("Show your current week's total time");

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const guild = await ensureGuild(guildId);

  const total = await prisma.timeTotal.findUnique({
    where: {
      guildId_userId_weekStart: {
        guildId,
        userId,
        weekStart: guild.currentWeekStart,
      },
    },
  });

  const openEntry = await prisma.timeEntry.findFirst({
    where: { guildId, userId, status: "in" },
  });

  const seconds = total?.totalSeconds ?? 0;
  const status = openEntry ? " (currently clocked in)" : "";

  await interaction.reply({
    content: `🕐 Your total this week: **${formatDuration(seconds)}**${status}`,
    ephemeral: true,
  });
}

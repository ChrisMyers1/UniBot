import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { prisma, ensureGuild } from "../lib/db";

export const data = new SlashCommandBuilder()
  .setName("clockin")
  .setDescription("Clock yourself in");

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  await ensureGuild(guildId);

  const openEntry = await prisma.timeEntry.findFirst({
    where: { guildId, userId, status: "in" },
  });

  if (openEntry) {
    await interaction.reply({
      content: "You're already clocked in.",
      ephemeral: true,
    });
    return;
  }

  await prisma.timeEntry.create({
    data: { guildId, userId, clockInAt: new Date(), status: "in" },
  });

  await interaction.reply(`🟢 <@${userId}> clocked in.`);
}

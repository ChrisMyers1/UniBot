import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
} from "discord.js";
import { ensureGuild, prisma } from "../lib/db";
import { isTimeAdmin } from "../lib/permissions";
import { closeEntryAndAccumulate } from "../lib/timeTracking";

export const data = new SlashCommandBuilder()
  .setName("clockeveryone")
  .setDescription("Clock everyone in or out at once (admin only)")
  .addSubcommand((sub) =>
    sub.setName("in").setDescription("Clock in every server member")
  )
  .addSubcommand((sub) =>
    sub.setName("out").setDescription("Clock out everyone currently clocked in")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const guild = await ensureGuild(guildId);
  const member = interaction.member as GuildMember;

  if (!isTimeAdmin(member, guild.adminRoleId)) {
    await interaction.reply({
      content: "You don't have permission to do this.",
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();
  await interaction.deferReply();

  if (sub === "out") {
    const openEntries = await prisma.timeEntry.findMany({
      where: { guildId, status: "in" },
    });

    const now = new Date();
    for (const entry of openEntries) {
      await closeEntryAndAccumulate(
        entry.id,
        guildId,
        entry.userId,
        entry.clockInAt,
        now
      );
    }

    await interaction.editReply(
      `🔴 Clocked out ${openEntries.length} member(s).`
    );
    return;
  }

  // sub === "in": clock in every non-bot member not already clocked in
  const members = await interaction.guild!.members.fetch();
  const alreadyIn = new Set(
    (
      await prisma.timeEntry.findMany({
        where: { guildId, status: "in" },
        select: { userId: true },
      })
    ).map((e) => e.userId)
  );

  const toClockIn = members.filter(
    (m) => !m.user.bot && !alreadyIn.has(m.id)
  );
  const now = new Date();

  await prisma.timeEntry.createMany({
    data: toClockIn.map((m) => ({
      guildId,
      userId: m.id,
      clockInAt: now,
      status: "in",
    })),
  });

  await interaction.editReply(
    `🟢 Clocked in ${toClockIn.size} member(s).`
  );
}

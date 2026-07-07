import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
} from "discord.js";
import { ensureGuild, prisma } from "../lib/db";
import { isTimeAdmin } from "../lib/permissions";
import { parseDuration, formatDuration } from "../lib/duration";
import { adjustTotal } from "../lib/timeTracking";

export const data = new SlashCommandBuilder()
  .setName("addtime")
  .setDescription("Add time to a user's current-week total (admin only)")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("User to credit").setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("duration")
      .setDescription("e.g. 2h30m, 45m, 1h")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const guild = await ensureGuild(guildId);
  const member = interaction.member as GuildMember;

  if (!isTimeAdmin(member, guild.adminRoleId)) {
    await interaction.reply({
      content: "You don't have permission to adjust time.",
      ephemeral: true,
    });
    return;
  }

  const target = interaction.options.getUser("user", true);
  const durationStr = interaction.options.getString("duration", true);
  const seconds = parseDuration(durationStr);

  if (seconds === null) {
    await interaction.reply({
      content: 'Could not parse duration. Try formats like "2h30m", "45m", or "1h".',
      ephemeral: true,
    });
    return;
  }

  await adjustTotal(guildId, target.id, seconds);

  await interaction.reply(
    `➕ Added ${formatDuration(seconds)} to <@${target.id}>'s current week total.`
  );
}

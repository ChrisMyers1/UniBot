import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  PermissionFlagsBits,
} from "discord.js";
import { ensureGuild, prisma } from "../lib/db";
import { isTimeAdmin } from "../lib/permissions";

export const data = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Configure this bot for your server (admin only)")
  .addSubcommand((sub) =>
    sub
      .setName("set-admin-role")
      .setDescription("Set the role allowed to run admin time commands")
      .addRoleOption((opt) =>
        opt.setName("role").setDescription("Admin role").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("set-log-channel")
      .setDescription("Set the channel for weekly reset summaries")
      .addChannelOption((opt) =>
        opt.setName("channel").setDescription("Log channel").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("add-app-option")
      .setDescription("Add an option to the /apply select menu")
      .addStringOption((opt) =>
        opt
          .setName("value")
          .setDescription("Unique short key, e.g. leave-request")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("label")
          .setDescription("Text shown in the dropdown")
          .setRequired(true)
      )
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("Where submissions get posted")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("questions")
          .setDescription("Up to 5 questions, separated by | (pipe)")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove-app-option")
      .setDescription("Remove an application option")
      .addStringOption((opt) =>
        opt.setName("value").setDescription("The option's key").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("view").setDescription("View current configuration")
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const guild = await ensureGuild(guildId);
  const member = interaction.member as GuildMember;

  // Config changes require Manage Server explicitly, regardless of admin role,
  // since this controls who *becomes* an admin.
  if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: "You need the Manage Server permission to change config.",
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "set-admin-role") {
    const role = interaction.options.getRole("role", true);
    await prisma.guild.update({
      where: { id: guildId },
      data: { adminRoleId: role.id },
    });
    await interaction.reply(`Admin role set to <@&${role.id}>.`);
    return;
  }

  if (sub === "set-log-channel") {
    const channel = interaction.options.getChannel("channel", true);
    await prisma.guild.update({
      where: { id: guildId },
      data: { logChannelId: channel.id },
    });
    await interaction.reply(`Log channel set to <#${channel.id}>.`);
    return;
  }

  if (sub === "add-app-option") {
    const value = interaction.options.getString("value", true);
    const label = interaction.options.getString("label", true);
    const channel = interaction.options.getChannel("channel", true);
    const questionsRaw = interaction.options.getString("questions", true);
    const questions = questionsRaw
      .split("|")
      .map((q) => q.trim())
      .filter(Boolean)
      .slice(0, 5); // Discord modals allow max 5 fields

    if (questions.length === 0) {
      await interaction.reply({
        content: "You need at least one question.",
        ephemeral: true,
      });
      return;
    }

    await prisma.appOption.upsert({
      where: { guildId_value: { guildId, value } },
      update: { label, targetChannelId: channel.id, questions },
      create: {
        guildId,
        value,
        label,
        targetChannelId: channel.id,
        questions,
      },
    });

    await interaction.reply(
      `Added/updated application option **${label}** → <#${channel.id}> (${questions.length} question(s)).`
    );
    return;
  }

  if (sub === "remove-app-option") {
    const value = interaction.options.getString("value", true);
    await prisma.appOption
      .delete({ where: { guildId_value: { guildId, value } } })
      .catch(() => null);
    await interaction.reply(`Removed application option \`${value}\` if it existed.`);
    return;
  }

  if (sub === "view") {
    const options = await prisma.appOption.findMany({ where: { guildId } });
    const lines = [
      `Admin role: ${guild.adminRoleId ? `<@&${guild.adminRoleId}>` : "not set"}`,
      `Log channel: ${guild.logChannelId ? `<#${guild.logChannelId}>` : "not set"}`,
      `Application options (${options.length}):`,
      ...options.map(
        (o) => `  • \`${o.value}\` "${o.label}" → <#${o.targetChannelId}>`
      ),
    ];
    await interaction.reply({ content: lines.join("\n"), ephemeral: true });
  }
}

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
} from "discord.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const data = new SlashCommandBuilder()
  .setName("dashboard")
  .setDescription("Configure the UniBot dashboard")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName("setup")
      .setDescription("Customize the dashboard")
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("Dashboard title")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("subtitle")
          .setDescription("Dashboard subtitle")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("color")
          .setDescription("Dashboard color hex (example #5865F2)")
          .setRequired(false)
      )
  );

export async function execute(
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.guild) {
    return interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true,
    });
  }

  const title = interaction.options.getString("title", true);
  const subtitle =
    interaction.options.getString("subtitle") ??
    "Live Workforce Panel";

  const color =
    interaction.options.getString("color") ??
    "#5865F2";

  await prisma.guild.upsert({
    where: {
      id: interaction.guild.id,
    },
    update: {
      dashboardTitle: title,
      dashboardSubtitle: subtitle,
      dashboardColor: color,
    },
    create: {
      id: interaction.guild.id,
      dashboardTitle: title,
      dashboardSubtitle: subtitle,
      dashboardColor: color,
    },
  });

  await interaction.reply({
    content: "✅ Dashboard settings updated!",
    ephemeral: true,
  });
}
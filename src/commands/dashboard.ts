import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
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
      .setDescription("Create the UniBot dashboard")

      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Channel to place the dashboard")
          .setRequired(true)
      )

      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("Dashboard title")
          .setRequired(false)
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
          .setDescription("Embed color")
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


  const channel =
    interaction.options.getChannel("channel") as TextChannel;


  const title =
    interaction.options.getString("title")
    ?? "UniBot Dashboard";


  const subtitle =
    interaction.options.getString("subtitle")
    ?? "Live Workforce Panel";


  const color =
    interaction.options.getString("color")
    ?? "#5865F2";


  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      `${subtitle}\n\n🟢 **Currently Clocked In**\n\nNo users currently clocked in.`
    )
    .setColor(color as any)
    .setFooter({
      text: "UniBot Time Tracking",
    })
    .setTimestamp();



  const buttons =
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(

        new ButtonBuilder()
          .setCustomId("clock_in")
          .setLabel("Clock In")
          .setEmoji("🟢")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("clock_out")
          .setLabel("Clock Out")
          .setEmoji("🔴")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId("my_time")
          .setLabel("My Time")
          .setEmoji("⏱️")
          .setStyle(ButtonStyle.Primary)

      );


  const message =
    await channel.send({
      embeds:[embed],
      components:[buttons],
    });



  await prisma.guild.upsert({

    where:{
      id: interaction.guild.id,
    },

    update:{
      dashboardTitle:title,
      dashboardSubtitle:subtitle,
      dashboardColor:color,
      dashboardChannelId:channel.id,
      dashboardMessageId:message.id,
    },

    create:{
      id:interaction.guild.id,
      dashboardTitle:title,
      dashboardSubtitle:subtitle,
      dashboardColor:color,
      dashboardChannelId:channel.id,
      dashboardMessageId:message.id,
    }

  });



  await interaction.reply({
    content:
      `✅ Dashboard created in ${channel}`,
    ephemeral:true,
  });

}
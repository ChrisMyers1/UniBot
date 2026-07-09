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
      .setDescription("Create or update the UniBot dashboard")

      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Channel to place the dashboard")
          .setRequired(false)
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
          .setDescription("Dashboard color hex (example #5865F2)")
          .setRequired(false)
      )
  );


export async function execute(
  interaction: ChatInputCommandInteraction
) {

  if (!interaction.guild) {
    return interaction.reply({
      content: "❌ This command can only be used inside a server.",
      ephemeral: true,
    });
  }


  if (interaction.options.getSubcommand() !== "setup") {
    return interaction.reply({
      content: "❌ Unknown dashboard command.",
      ephemeral: true,
    });
  }


  const selectedChannel =
    interaction.options.getChannel("channel");


  const channel =
    selectedChannel ?? interaction.channel;


  if (!channel) {
    return interaction.reply({
      content:
        "❌ Could not determine a channel.",
      ephemeral: true,
    });
  }


  if (!("send" in channel)) {
    return interaction.reply({
      content:
        "❌ Please select a text channel.",
      ephemeral: true,
    });
  }


  const textChannel = channel as TextChannel;


  const title =
    interaction.options.getString("title")
    ?? "UniBot Dashboard";


  const subtitle =
    interaction.options.getString("subtitle")
    ?? "Live Workforce Panel";


  const color =
    interaction.options.getString("color")
    ?? "#5865F2";


  await interaction.deferReply({
    ephemeral: true,
  });



  try {

    const embed =
      new EmbedBuilder()
        .setTitle(title)
        .setDescription(
          [
            subtitle,
            "",
            "🟢 **Currently Clocked In**",
            "",
            "No users currently clocked in.",
          ].join("\n")
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
      await textChannel.send({
        embeds: [
          embed,
        ],
        components: [
          buttons,
        ],
      });



    await prisma.guild.upsert({

      where: {
        id: interaction.guild.id,
      },


      update: {

        dashboardTitle: title,
        dashboardSubtitle: subtitle,
        dashboardColor: color,
        dashboardChannelId: textChannel.id,
        dashboardMessageId: message.id,

      },


      create: {

        id: interaction.guild.id,

        dashboardTitle: title,
        dashboardSubtitle: subtitle,
        dashboardColor: color,

        dashboardChannelId: textChannel.id,
        dashboardMessageId: message.id,

      },

    });



    await interaction.editReply({
      content:
        `✅ UniBot dashboard created in ${textChannel}.`,
    });



  } catch (error) {

    console.error(
      "Dashboard setup error:",
      error
    );


    await interaction.editReply({
      content:
        "❌ Something went wrong creating the dashboard.",
    });

  }

}
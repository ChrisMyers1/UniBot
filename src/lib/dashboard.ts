import { EmbedBuilder } from "discord.js";
import { prisma } from "./db";
import { client } from "../index";

export async function updateDashboard(guildId: string) {
  try {
    const settings = await prisma.guild.findUnique({
      where: {
        id: guildId,
      },
    });

    if (
      !settings?.dashboardChannelId ||
      !settings?.dashboardMessageId
    ) {
      return;
    }

    const guild = await client.guilds.fetch(guildId);

    const channel = await guild.channels.fetch(
      settings.dashboardChannelId
    );

    if (!channel || !channel.isTextBased()) {
      return;
    }

    const message = await channel.messages.fetch(
      settings.dashboardMessageId
    );

    const clockedIn = await prisma.timeEntry.findMany({
      where: {
        guildId,
        status: "in",
      },
    });

    let userList = "No users currently clocked in.";

    if (clockedIn.length > 0) {
      userList = clockedIn
        .map((entry: { userId: string }) => `🟢 <@${entry.userId}>`)
        .join("\n");
    }

    const embed = new EmbedBuilder()
      .setTitle(settings.dashboardTitle)
      .setDescription(
        [
          settings.dashboardSubtitle,
          "",
          "🟢 **Currently Clocked In**",
          "",
          userList,
        ].join("\n")
      )
      .setColor(settings.dashboardColor as any)
      .setFooter({
        text: "UniBot Time Tracking",
      })
      .setTimestamp();

    await message.edit({
      embeds: [embed],
    });

  } catch (error) {
    console.error(
      "Dashboard update error:",
      error
    );
  }
}
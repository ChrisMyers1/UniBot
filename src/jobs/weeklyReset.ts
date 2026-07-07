import cron from "node-cron";
import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { prisma } from "../lib/db";
import { closeEntryAndAccumulate } from "../lib/timeTracking";
import { formatDuration } from "../lib/duration";

/**
 * Registers the Friday 3am reset job for every guild the bot is in.
 * Using the "America/New_York" IANA timezone (not a fixed UTC offset)
 * means this correctly fires at 3am EST or 3am EDT depending on the
 * time of year — the offset itself shifts, but "3am local" doesn't.
 */
export function scheduleWeeklyReset(client: Client) {
  // Cron format: second minute hour day-of-month month day-of-week
  // "0 3 * * 5" = every Friday at 3:00:00 AM in the given timezone.
  cron.schedule(
    "0 3 * * 5",
    async () => {
      console.log("[weeklyReset] Running Friday 3am reset for all guilds...");
      await runWeeklyReset(client);
    },
    { timezone: "America/New_York" }
  );

  console.log("[weeklyReset] Scheduled for every Friday 3:00 AM America/New_York.");
}

export async function runWeeklyReset(client: Client) {
  const guilds = await prisma.guild.findMany();
  const now = new Date();

  for (const guild of guilds) {
    try {
      // 1. Auto clock-out anyone still clocked in, folding their session
      //    into this week's total before we roll the week forward.
      const openEntries = await prisma.timeEntry.findMany({
        where: { guildId: guild.id, status: "in" },
      });

      for (const entry of openEntries) {
        await closeEntryAndAccumulate(
          entry.id,
          guild.id,
          entry.userId,
          entry.clockInAt,
          now
        );
      }

      // 2. Pull the totals for the week that just ended, for the summary.
      const totals = await prisma.timeTotal.findMany({
        where: { guildId: guild.id, weekStart: guild.currentWeekStart },
        orderBy: { totalSeconds: "desc" },
      });

      // 3. Post a summary to the configured log channel, if set.
      //    Historical TimeTotal rows are kept (not deleted) for records.
      if (guild.logChannelId) {
        const channel = await client.channels
          .fetch(guild.logChannelId)
          .catch(() => null);

        if (channel && channel instanceof TextChannel) {
          const embed = new EmbedBuilder()
            .setTitle("Weekly Time Summary")
            .setDescription(
              totals.length
                ? totals
                    .map(
                      (t, i) =>
                        `${i + 1}. <@${t.userId}> — ${formatDuration(t.totalSeconds)}`
                    )
                    .join("\n")
                : "No time was logged this week."
            )
            .setTimestamp(now);

          await channel.send({ embeds: [embed] });
        }
      }

      // 4. Roll this guild's tracking week forward. New clock-ins/adjustments
      //    will accumulate against a fresh weekStart from this point on.
      await prisma.guild.update({
        where: { id: guild.id },
        data: { currentWeekStart: now },
      });
    } catch (err) {
      console.error(`[weeklyReset] Failed for guild ${guild.id}:`, err);
      // Continue to the next guild even if one fails.
    }
  }

  console.log(`[weeklyReset] Completed for ${guilds.length} guild(s).`);
}

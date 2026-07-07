import { prisma } from "./db";

/**
 * Closes an open TimeEntry (sets clockOutAt, computes duration) and
 * folds that duration into the guild's current-week TimeTotal for the user.
 * Returns the number of seconds worked in this session.
 */
export async function closeEntryAndAccumulate(
  entryId: number,
  guildId: string,
  userId: string,
  clockInAt: Date,
  clockOutAt: Date
): Promise<number> {
  const seconds = Math.max(
    0,
    Math.floor((clockOutAt.getTime() - clockInAt.getTime()) / 1000)
  );

  await prisma.timeEntry.update({
    where: { id: entryId },
    data: { clockOutAt, status: "out" },
  });

  const guild = await prisma.guild.findUniqueOrThrow({ where: { id: guildId } });

  await prisma.timeTotal.upsert({
    where: {
      guildId_userId_weekStart: {
        guildId,
        userId,
        weekStart: guild.currentWeekStart,
      },
    },
    update: { totalSeconds: { increment: seconds } },
    create: {
      guildId,
      userId,
      weekStart: guild.currentWeekStart,
      totalSeconds: seconds,
    },
  });

  return seconds;
}

/** Adds (or subtracts, if negative) seconds to a user's current-week total directly. */
export async function adjustTotal(guildId: string, userId: string, deltaSeconds: number) {
  const guild = await prisma.guild.findUniqueOrThrow({ where: { id: guildId } });

  await prisma.timeTotal.upsert({
    where: {
      guildId_userId_weekStart: {
        guildId,
        userId,
        weekStart: guild.currentWeekStart,
      },
    },
    update: { totalSeconds: { increment: deltaSeconds } },
    create: {
      guildId,
      userId,
      weekStart: guild.currentWeekStart,
      totalSeconds: Math.max(0, deltaSeconds),
    },
  });
}

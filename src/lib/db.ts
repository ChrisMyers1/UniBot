import { PrismaClient } from "@prisma/client";

// Single shared Prisma client for the whole bot process.
export const prisma = new PrismaClient();

/**
 * Ensures a Guild row exists before any command touches it.
 * Every command handler should call this first thing.
 */
export async function ensureGuild(guildId: string) {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: {},
    create: { id: guildId },
  });
}

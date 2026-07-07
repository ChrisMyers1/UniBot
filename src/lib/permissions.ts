import { GuildMember, PermissionFlagsBits } from "discord.js";

/**
 * Returns true if the member can run admin time-tracking commands:
 * either they have the server's configured admin role, or they have
 * the native Discord "Manage Server" permission (so it always works
 * even before an admin role is configured).
 */
export function isTimeAdmin(member: GuildMember, adminRoleId: string | null): boolean {
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  if (adminRoleId && member.roles.cache.has(adminRoleId)) return true;
  return false;
}

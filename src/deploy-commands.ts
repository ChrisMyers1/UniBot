import "dotenv/config";
import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";

async function main() {
  const commandsPath = path.join(__dirname, "commands");

  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  const commandData = [];

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));

    if (command.data) {
      commandData.push(command.data.toJSON());
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  const clientId = process.env.CLIENT_ID!;
  const guildId = process.env.GUILD_ID;

  let route;

  if (guildId) {
    console.log(
      `Registering ${commandData.length} guild command(s) to ${guildId}...`
    );

    route = Routes.applicationGuildCommands(clientId, guildId);
  } else {
    console.log(`Registering ${commandData.length} global command(s)...`);

    route = Routes.applicationCommands(clientId);
  }

  await rest.put(route, {
    body: commandData,
  });

  if (guildId) {
    console.log("Done. Guild commands should update instantly.");
  } else {
    console.log(
      "Done. Global commands can take up to an hour to propagate."
    );
  }
}

main().catch(console.error);
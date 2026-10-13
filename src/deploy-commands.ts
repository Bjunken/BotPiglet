import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

async function main() {
  const commandsDir = path.join(__dirname, "commands");
  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  const commands = [];
  for (const file of files) {
    const command = require(path.join(commandsDir, file));
    commands.push(command.data.toJSON());
  }

  const rest = new REST().setToken(config.discordToken);

  const route = config.discordGuildId
    ? Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId)
    : Routes.applicationCommands(config.discordClientId);

  await rest.put(route, { body: commands });
  console.log(
    `Deployed ${commands.length} command(s) ${config.discordGuildId ? "to guild " + config.discordGuildId : "globally"}.`
  );
}

main().catch(console.error);

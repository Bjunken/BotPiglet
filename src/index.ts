import fs from "node:fs";
import path from "node:path";
import { Client, Collection, GatewayIntentBits, Interaction, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { config } from "./config";
import { startClassroomPolling } from "./classroom/poller";

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] }) as Client & {
  commands: Collection<string, Command>;
};
client.commands = new Collection();

const commandsDir = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith(".ts") || f.endsWith(".js"))) {
  const command: Command = require(path.join(commandsDir, file));
  client.commands.set(command.data.name, command);
}

client.once("ready", () => {
  console.log(`🐷 BotPiglet is online as ${client.user?.tag}`);
  if (config.classroomChannelId) {
    startClassroomPolling(client);
  } else {
    console.log("CLASSROOM_CHANNEL_ID not set — skipping Classroom polling.");
  }
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error running /${interaction.commandName}:`, err);
    const reply = { content: "Something went wrong running that command.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(config.discordToken);

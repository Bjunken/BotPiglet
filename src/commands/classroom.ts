import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { google } from "googleapis";
import { getAuthorizedClient } from "../classroom/auth";
import { checkClassroom } from "../classroom/poller";

export const data = new SlashCommandBuilder()
  .setName("classroom")
  .setDescription("Google Classroom controls")
  .addSubcommand((sub) => sub.setName("courses").setDescription("List your active Classroom courses (to find course IDs)"))
  .addSubcommand((sub) => sub.setName("check").setDescription("Check Classroom for new posts right now"));

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  await interaction.deferReply();

  if (sub === "courses") {
    const auth = getAuthorizedClient();
    const classroom = google.classroom({ version: "v1", auth });
    const res = await classroom.courses.list({ courseStates: ["ACTIVE"] });
    const courses = res.data.courses ?? [];
    if (courses.length === 0) {
      await interaction.editReply("No active courses found.");
      return;
    }
    const lines = courses.map((c) => `• **${c.name}** — \`${c.id}\``);
    await interaction.editReply(lines.join("\n"));
    return;
  }

  if (sub === "check") {
    const count = await checkClassroom(interaction.client);
    await interaction.editReply(
      count > 0 ? `Found and posted ${count} new item(s).` : "No new posts found."
    );
  }
}

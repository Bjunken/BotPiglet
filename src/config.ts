import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  discordToken: required("DISCORD_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  discordGuildId: process.env.DISCORD_GUILD_ID || undefined,

  classroomChannelId: process.env.CLASSROOM_CHANNEL_ID || undefined,
  classroomCourseIds: (process.env.CLASSROOM_COURSE_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  classroomPollIntervalMinutes: Number(process.env.CLASSROOM_POLL_INTERVAL_MINUTES || 10),
};

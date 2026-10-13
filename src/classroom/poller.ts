import { google, classroom_v1 } from "googleapis";
import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { getAuthorizedClient } from "./auth";
import { SeenStore, storeFileExists } from "./store";
import { config } from "../config";

const seenStore = new SeenStore();
let isFirstRun = !storeFileExists();

interface Post {
  id: string;
  courseName: string;
  title: string;
  link?: string | null;
  kind: "Announcement" | "Coursework" | "Material";
  updatedAt?: string | null;
}

async function getActiveCourses(classroom: classroom_v1.Classroom) {
  if (config.classroomCourseIds.length > 0) {
    const courses = await Promise.all(
      config.classroomCourseIds.map((id) => classroom.courses.get({ id }).then((r) => r.data))
    );
    return courses;
  }
  const res = await classroom.courses.list({ courseStates: ["ACTIVE"] });
  return res.data.courses ?? [];
}

async function fetchNewPosts(classroom: classroom_v1.Classroom): Promise<Post[]> {
  const courses = await getActiveCourses(classroom);
  const posts: Post[] = [];

  for (const course of courses) {
    if (!course.id) continue;
    const courseName = course.name ?? "Unknown course";

    const [announcements, courseWork, materials] = await Promise.all([
      classroom.courses.announcements.list({ courseId: course.id, orderBy: "updateTime desc", pageSize: 20 }),
      classroom.courses.courseWork.list({ courseId: course.id, orderBy: "updateTime desc", pageSize: 20 }),
      classroom.courses.courseWorkMaterials.list({ courseId: course.id, orderBy: "updateTime desc", pageSize: 20 }),
    ]);

    for (const a of announcements.data.announcements ?? []) {
      if (!a.id || seenStore.has(a.id)) continue;
      posts.push({
        id: a.id,
        courseName,
        title: a.text?.slice(0, 200) || "(announcement)",
        link: a.alternateLink,
        kind: "Announcement",
        updatedAt: a.updateTime,
      });
    }

    for (const w of courseWork.data.courseWork ?? []) {
      if (!w.id || seenStore.has(w.id)) continue;
      posts.push({
        id: w.id,
        courseName,
        title: w.title || "(coursework)",
        link: w.alternateLink,
        kind: "Coursework",
        updatedAt: w.updateTime,
      });
    }

    for (const m of materials.data.courseWorkMaterial ?? []) {
      if (!m.id || seenStore.has(m.id)) continue;
      posts.push({
        id: m.id,
        courseName,
        title: m.title || "(material)",
        link: m.alternateLink,
        kind: "Material",
        updatedAt: m.updateTime,
      });
    }
  }

  return posts;
}

async function announce(discord: Client, posts: Post[]) {
  if (!config.classroomChannelId || posts.length === 0) return;
  const channel = await discord.channels.fetch(config.classroomChannelId);
  if (!channel || !(channel instanceof TextChannel)) {
    console.warn("CLASSROOM_CHANNEL_ID does not point to a text channel");
    return;
  }

  for (const post of posts.sort((a, b) => (a.updatedAt ?? "").localeCompare(b.updatedAt ?? ""))) {
    const embed = new EmbedBuilder()
      .setTitle(`📚 ${post.kind}: ${post.title}`)
      .setDescription(post.courseName)
      .setColor(0x1abc9c);
    if (post.link) embed.setURL(post.link);
    await channel.send({ embeds: [embed] });
  }
}

export async function checkClassroom(discord: Client): Promise<number> {
  const auth = getAuthorizedClient();
  const classroom = google.classroom({ version: "v1", auth });

  const posts = await fetchNewPosts(classroom);

  if (isFirstRun) {
    // Seed the store silently so we don't dump every existing post on startup.
    seenStore.markSeen(posts.map((p) => p.id));
    isFirstRun = false;
    return 0;
  }

  if (posts.length > 0) {
    await announce(discord, posts);
    seenStore.markSeen(posts.map((p) => p.id));
  }

  return posts.length;
}

export function startClassroomPolling(discord: Client) {
  const intervalMs = config.classroomPollIntervalMinutes * 60 * 1000;
  checkClassroom(discord).catch((err) => console.error("Classroom check failed:", err));
  setInterval(() => {
    checkClassroom(discord).catch((err) => console.error("Classroom check failed:", err));
  }, intervalMs);
}

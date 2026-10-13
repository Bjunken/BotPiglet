import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

export const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.announcements.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
];

const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "token.json");

export function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      "credentials.json not found. Download an OAuth client (Desktop app) from Google Cloud Console " +
        "and save it as credentials.json in the project root. See README.md."
    );
  }
  const raw = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
  return raw.installed || raw.web;
}

export function createOAuthClient(): OAuth2Client {
  const { client_id, client_secret, redirect_uris } = loadCredentials();
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

export function saveToken(client: OAuth2Client) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(client.credentials, null, 2));
}

export function hasStoredToken(): boolean {
  return fs.existsSync(TOKEN_PATH);
}

export function getAuthorizedClient(): OAuth2Client {
  if (!hasStoredToken()) {
    throw new Error(
      "No Google Classroom token found. Run `npm run auth:google` once to authorize this app."
    );
  }
  const client = createOAuthClient();
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  client.setCredentials(token);
  client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      saveToken(client);
    }
  });
  return client;
}

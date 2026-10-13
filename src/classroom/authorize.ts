import http from "node:http";
import { URL } from "node:url";
import { createOAuthClient, saveToken, SCOPES } from "./auth";

/**
 * One-time interactive OAuth flow for Desktop-app credentials.
 * Spins up a temporary localhost server to catch Google's redirect.
 */
async function main() {
  const client = createOAuthClient();

  const server = http.createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Failed to start local server");
  const redirectUri = `http://127.0.0.1:${address.port}`;

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    redirect_uri: redirectUri,
  });

  console.log("\nOpen this URL in your browser and approve access:\n");
  console.log(authUrl, "\n");
  console.log("Waiting for you to finish signing in...");

  const code = await new Promise<string>((resolve, reject) => {
    server.on("request", (req, res) => {
      const url = new URL(req.url || "", redirectUri);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      res.end(error ? "Authorization failed, check the terminal." : "Success! You can close this tab.");
      if (error) reject(new Error(error));
      else if (code) resolve(code);
    });
  });
  server.close();

  const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
  client.setCredentials(tokens);
  saveToken(client);
  console.log("\n✅ Saved token.json — BotPiglet can now read your Google Classroom.");
}

main().catch((err) => {
  console.error("Authorization failed:", err);
  process.exit(1);
});

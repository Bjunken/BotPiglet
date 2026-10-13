import fs from "node:fs";
import path from "node:path";

const STORE_PATH = path.join(process.cwd(), "data", "classroom-seen.json");

function load(): string[] {
  if (!fs.existsSync(STORE_PATH)) return [];
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
}

function save(ids: string[]) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(ids, null, 2));
}

export function storeFileExists(): boolean {
  return fs.existsSync(STORE_PATH);
}

export class SeenStore {
  private seen: Set<string>;

  constructor() {
    this.seen = new Set(load());
  }

  has(id: string): boolean {
    return this.seen.has(id);
  }

  markSeen(ids: string[]) {
    for (const id of ids) this.seen.add(id);
    save([...this.seen]);
  }
}

import Database from "@tauri-apps/plugin-sql";
import * as Y from "yjs";
import { base64ToUint8, uint8ToBase64 } from "./base64";

export class TauriSqlitePersistence {
  private db: Database | null = null;
  private ydoc: Y.Doc;
  private collabId: string;
  private destroyed = false;
  private saveTimer: number | null = null;
  private onUpdate: () => void;
  public synced = false;

  constructor(collabId: string, ydoc: Y.Doc) {
    this.collabId = collabId;
    this.ydoc = ydoc;

    this.onUpdate = () => {
      if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
      this.saveTimer = window.setTimeout(() => {
        this.flushSave();
      }, 1500);
    };

    this.init();
  }

  private async init() {
    try {
      this.db = await Database.load("sqlite:zmark.db");
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS y_documents (
          id TEXT PRIMARY KEY,
          y_update TEXT NOT NULL
        )
      `);

      if (this.destroyed) return;

      const result = await this.db.select<{ y_update: string }[]>(
        "SELECT y_update FROM y_documents WHERE id = $1",
        [this.collabId],
      );

      if (result && result.length > 0 && result[0].y_update) {
        try {
          const yUpdateBase64 = result[0].y_update;
          Y.applyUpdate(this.ydoc, base64ToUint8(yUpdateBase64));
        } catch (e) {
          console.error("Failed to apply update from SQLite", e);
        }
      }

      this.synced = true;
      this.ydoc.emit("sync", [true, this.ydoc]);
      this.ydoc.on("update", this.onUpdate);
    } catch (e) {
      console.error("Failed to init TauriSqlitePersistence", e);
    }
  }

  private async flushSave() {
    if (!this.db || this.destroyed) return;
    try {
      const update = Y.encodeStateAsUpdate(this.ydoc);
      const base64 = uint8ToBase64(update);
      await this.db.execute(
        "INSERT INTO y_documents (id, y_update) VALUES ($1, $2) ON CONFLICT(id) DO UPDATE SET y_update = excluded.y_update",
        [this.collabId, base64],
      );
    } catch (e) {
      console.error("Failed to save to SQLite", e);
    }
  }

  public async destroy() {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.ydoc.off("update", this.onUpdate);
    await this.flushSave();
    this.destroyed = true;
  }
}

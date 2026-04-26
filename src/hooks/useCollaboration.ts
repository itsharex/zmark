import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import {
  base64ToUint8,
  toSync,
  uint8ToBase64,
} from "@/utils";
import { supabase } from "@/utils/supabase-client";
import { TauriSqlitePersistence } from "@/utils/y-sqlite";

export function useCollaboration(collabId: string | null) {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);

  const canUseSupabase = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );

  // 1. 本地 SQLite 持久化
  useEffect(() => {
    if (!collabId) return;
    const persistence = new TauriSqlitePersistence(
      `zmark-collab:${collabId}`,
      ydoc,
    );
    return () => {
      void persistence.destroy();
    };
  }, [collabId, ydoc]);

  // 2. 从 Supabase 恢复数据
  useEffect(() => {
    if (!collabId || !canUseSupabase) return;

    let cancelled = false;

    const restoreFromSupabase = async () => {
      const { data, error } = await supabase
        .from("collab_documents")
        .select("y_update")
        .eq("id", collabId)
        .maybeSingle();

      if (cancelled) return;
      if (error) return;

      const yUpdate = data?.y_update;
      if (!yUpdate) return;

      toSync(() => {
        Y.applyUpdate(ydoc, base64ToUint8(yUpdate));
      });
    };

    restoreFromSupabase();

    return () => {
      cancelled = true;
    };
  }, [collabId, canUseSupabase, ydoc]);

  // 3. 自动同步到 Supabase
  useEffect(() => {
    if (!collabId || !canUseSupabase) return;

    let saveTimer: number | null = null;
    let lastSavedBase64: string | null = null;

    const flushSave = async () => {
      saveTimer = null;
      const update = Y.encodeStateAsUpdate(ydoc);
      const base64 = uint8ToBase64(update);
      if (base64 === lastSavedBase64) return;

      const { error } = await supabase
        .from("collab_documents")
        .upsert({ id: collabId, y_update: base64 });

      if (!error) {
        lastSavedBase64 = base64;
      }
    };

    const onUpdate = () => {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        flushSave();
      }, 1500);
    };

    ydoc.on("update", onUpdate);

    return () => {
      ydoc.off("update", onUpdate);
      if (saveTimer) window.clearTimeout(saveTimer);
      flushSave();
    };
  }, [collabId, canUseSupabase, ydoc]);

  // 4. Hocuspocus 协作连接
  useEffect(() => {
    if (!collabId) {
      setProvider(null);
      return;
    }

    const collaborationUrl =
      import.meta.env.VITE_COLLAB_URL ?? "ws://localhost:1234";

    const prov = new HocuspocusProvider({
      url: collaborationUrl,
      name: collabId, // 使用文档ID作为房间号
      document: ydoc,
      onConnect() {},
      onSynced() {},
      onDisconnect() {
        console.log("CRDT Disconnected");
      },
    });

    setProvider(prov);

    return () => {
      prov.destroy();
      setProvider(null);
    };
  }, [ydoc, collabId]);

  return { ydoc, provider };
}

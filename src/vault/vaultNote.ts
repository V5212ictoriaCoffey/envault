import fs from "fs";
import path from "path";

export interface NoteStore {
  notes: Record<string, string>;
}

export function getNotePath(vaultDir: string): string {
  return path.join(vaultDir, ".envault-notes.json");
}

export function loadNoteStore(vaultDir: string): NoteStore {
  const notePath = getNotePath(vaultDir);
  if (!fs.existsSync(notePath)) {
    return { notes: {} };
  }
  const raw = fs.readFileSync(notePath, "utf-8");
  return JSON.parse(raw) as NoteStore;
}

export function saveNoteStore(vaultDir: string, store: NoteStore): void {
  const notePath = getNotePath(vaultDir);
  fs.writeFileSync(notePath, JSON.stringify(store, null, 2), "utf-8");
}

export function setNote(vaultDir: string, key: string, note: string): NoteStore {
  const store = loadNoteStore(vaultDir);
  store.notes[key] = note;
  saveNoteStore(vaultDir, store);
  return store;
}

export function removeNote(vaultDir: string, key: string): NoteStore {
  const store = loadNoteStore(vaultDir);
  delete store.notes[key];
  saveNoteStore(vaultDir, store);
  return store;
}

export function getNote(vaultDir: string, key: string): string | undefined {
  const store = loadNoteStore(vaultDir);
  return store.notes[key];
}

export function listNotes(vaultDir: string): Record<string, string> {
  return loadNoteStore(vaultDir).notes;
}

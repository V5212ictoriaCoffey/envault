import fs from "fs";
import os from "os";
import path from "path";
import {
  getNotePath,
  loadNoteStore,
  setNote,
  removeNote,
  getNote,
  listNotes,
} from "./vaultNote";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-note-test-"));
}

describe("vaultNote", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("getNotePath returns correct path", () => {
    expect(getNotePath(dir)).toBe(path.join(dir, ".envault-notes.json"));
  });

  it("loadNoteStore returns empty store when file missing", () => {
    const store = loadNoteStore(dir);
    expect(store.notes).toEqual({});
  });

  it("setNote adds a note and persists it", () => {
    setNote(dir, "DB_URL", "Primary database connection string");
    const store = loadNoteStore(dir);
    expect(store.notes["DB_URL"]).toBe("Primary database connection string");
  });

  it("setNote overwrites an existing note", () => {
    setNote(dir, "API_KEY", "old note");
    setNote(dir, "API_KEY", "new note");
    expect(getNote(dir, "API_KEY")).toBe("new note");
  });

  it("removeNote deletes a note", () => {
    setNote(dir, "SECRET", "some note");
    removeNote(dir, "SECRET");
    expect(getNote(dir, "SECRET")).toBeUndefined();
  });

  it("removeNote is a no-op for missing key", () => {
    expect(() => removeNote(dir, "NONEXISTENT")).not.toThrow();
  });

  it("listNotes returns all notes", () => {
    setNote(dir, "KEY_A", "note a");
    setNote(dir, "KEY_B", "note b");
    const notes = listNotes(dir);
    expect(notes["KEY_A"]).toBe("note a");
    expect(notes["KEY_B"]).toBe("note b");
    expect(Object.keys(notes)).toHaveLength(2);
  });

  it("getNote returns undefined for unknown key", () => {
    expect(getNote(dir, "UNKNOWN")).toBeUndefined();
  });
});

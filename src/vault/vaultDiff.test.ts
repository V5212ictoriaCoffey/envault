import { diffVaults, formatDiff } from "./vaultDiff";
import { Vault } from "./vault";

function makeVault(secrets: Record<string, string>): Vault {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    secrets,
  } as unknown as Vault;
}

describe("diffVaults", () => {
  it("detects added keys", () => {
    const base = makeVault({ A: "1" });
    const target = makeVault({ A: "1", B: "2" });
    const result = diffVaults(base, target);
    expect(result.added).toBe(1);
    expect(result.entries.find((e) => e.key === "B")?.status).toBe("added");
  });

  it("detects removed keys", () => {
    const base = makeVault({ A: "1", B: "2" });
    const target = makeVault({ A: "1" });
    const result = diffVaults(base, target);
    expect(result.removed).toBe(1);
    expect(result.entries.find((e) => e.key === "B")?.status).toBe("removed");
  });

  it("detects changed keys", () => {
    const base = makeVault({ A: "old" });
    const target = makeVault({ A: "new" });
    const result = diffVaults(base, target);
    expect(result.changed).toBe(1);
    const entry = result.entries.find((e) => e.key === "A");
    expect(entry?.status).toBe("changed");
    expect(entry?.oldValue).toBe("old");
    expect(entry?.newValue).toBe("new");
  });

  it("detects unchanged keys", () => {
    const base = makeVault({ A: "same" });
    const target = makeVault({ A: "same" });
    const result = diffVaults(base, target);
    expect(result.unchanged).toBe(1);
    expect(result.entries[0].status).toBe("unchanged");
  });

  it("returns sorted keys", () => {
    const base = makeVault({ Z: "1", A: "2" });
    const target = makeVault({ Z: "1", A: "2" });
    const result = diffVaults(base, target);
    expect(result.entries.map((e) => e.key)).toEqual(["A", "Z"]);
  });

  it("handles empty vaults", () => {
    const result = diffVaults(makeVault({}), makeVault({}));
    expect(result.entries).toHaveLength(0);
    expect(result.added + result.removed + result.changed + result.unchanged).toBe(0);
  });
});

describe("formatDiff", () => {
  it("hides unchanged entries by default", () => {
    const base = makeVault({ A: "1", B: "2" });
    const target = makeVault({ A: "1", C: "3" });
    const output = formatDiff(diffVaults(base, target));
    expect(output).toContain("- B");
    expect(output).toContain("+ C");
    expect(output).not.toContain(" A");
  });

  it("shows unchanged entries when requested", () => {
    const base = makeVault({ A: "1" });
    const target = makeVault({ A: "1" });
    const output = formatDiff(diffVaults(base, target), true);
    expect(output).toContain("  A");
  });

  it("includes summary line", () => {
    const result = diffVaults(makeVault({ A: "x" }), makeVault({ B: "y" }));
    const output = formatDiff(result);
    expect(output).toContain("Summary:");
    expect(output).toContain("+1 added");
    expect(output).toContain("-1 removed");
  });
});

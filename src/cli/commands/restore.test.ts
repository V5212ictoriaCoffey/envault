import { Command } from "commander";
import { registerRestoreCommand } from "./restore";
import * as vaultBackup from "../../vault/vaultBackup";
import * as vaultModule from "../../vault";

jest.mock("../../vault/vaultBackup");
jest.mock("../../vault");

const mockListBackups = vaultBackup.listBackups as jest.MockedFunction<typeof vaultBackup.listBackups>;
const mockRestoreBackup = vaultBackup.restoreBackup as jest.MockedFunction<typeof vaultBackup.restoreBackup>;
const mockLoadVault = vaultModule.loadVault as jest.MockedFunction<typeof vaultModule.loadVault>;

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerRestoreCommand(program);
  return program;
}

describe("restore command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists available backups with --list flag", async () => {
    mockListBackups.mockResolvedValue(["backup-1.json", "backup-2.json"]);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await buildProgram().parseAsync(["node", "test", "restore", "--list"]);

    expect(mockListBackups).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("Available backups:");
    expect(consoleSpy).toHaveBeenCalledWith("  [1] backup-1.json");
    expect(consoleSpy).toHaveBeenCalledWith("  [2] backup-2.json");
    consoleSpy.mockRestore();
  });

  it("exits with error when no backups exist", async () => {
    mockListBackups.mockResolvedValue([]);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

    await expect(buildProgram().parseAsync(["node", "test", "restore", "--list"])).rejects.toThrow("exit");
    expect(errorSpy).toHaveBeenCalledWith("No backups found for this vault.");

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("restores from specified backup with --force", async () => {
    mockListBackups.mockResolvedValue(["backup-1.json", "backup-2.json"]);
    mockRestoreBackup.mockResolvedValue(undefined);
    mockLoadVault.mockResolvedValue({ records: { KEY: "val" }, createdAt: "", updatedAt: "" } as any);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await buildProgram().parseAsync(["node", "test", "restore", "--backup", "backup-1.json", "--force"]);

    expect(mockRestoreBackup).toHaveBeenCalledWith(expect.any(String), "backup-1.json");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("restored"));
    consoleSpy.mockRestore();
  });

  it("exits with error when specified backup does not exist", async () => {
    mockListBackups.mockResolvedValue(["backup-1.json"]);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });

    await expect(
      buildProgram().parseAsync(["node", "test", "restore", "--backup", "missing.json", "--force"])
    ).rejects.toThrow("exit");

    expect(errorSpy).toHaveBeenCalledWith("Backup not found: missing.json");
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

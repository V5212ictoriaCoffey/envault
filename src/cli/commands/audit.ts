import { Command } from "commander";
import { appendAuditEntry, formatAuditLog, loadAuditLog } from "../../vault/vaultAudit";

export function registerAuditCommand(program: Command): void {
  const audit = program
    .command("audit")
    .description("View or manage the vault audit log");

  audit
    .command("log")
    .description("Display the audit log")
    .option("--last <n>", "Show only the last N entries", parseInt)
    .action((options) => {
      const log = loadAuditLog();
      let entries = log.entries;

      if (options.last && !isNaN(options.last)) {
        entries = entries.slice(-options.last);
      }

      const output = formatAuditLog({ entries });
      console.log(output);
    });

  audit
    .command("clear")
    .description("Clear the audit log")
    .option("--confirm", "Confirm clearing the audit log")
    .action((options) => {
      if (!options.confirm) {
        console.error("Use --confirm to clear the audit log.");
        process.exit(1);
      }
      const { saveAuditLog } = require("../../vault/vaultAudit");
      saveAuditLog({ entries: [] });
      console.log("Audit log cleared.");
    });

  audit
    .command("record <action>")
    .description("Manually record an audit entry (for scripting)")
    .option("--key <key>", "Env key involved")
    .option("--actor <actor>", "Actor performing the action")
    .option("--details <details>", "Additional details")
    .action((action, options) => {
      const validActions = ["add", "remove", "rotate", "export", "sync", "access_grant", "access_revoke"];
      if (!validActions.includes(action)) {
        console.error(`Invalid action. Must be one of: ${validActions.join(", ")}`);
        process.exit(1);
      }
      appendAuditEntry({
        action: action as any,
        key: options.key,
        actor: options.actor,
        details: options.details,
      });
      console.log(`Audit entry recorded: ${action}`);
    });
}

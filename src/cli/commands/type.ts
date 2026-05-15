import { Command } from "commander";
import {
  setType,
  removeType,
  getType,
  listTypedKeys,
  validateValueType,
  EnvValueType,
} from "../../vault/vaultType";

const VALID_TYPES: EnvValueType[] = ["string", "number", "boolean", "url", "email", "json"];

export function registerTypeCommand(program: Command, vaultDir: string = process.cwd()): void {
  const type = program
    .command("type")
    .description("Manage value type annotations for vault keys");

  type
    .command("set <key> <type>")
    .description(`Set the expected type for a key (${VALID_TYPES.join(", ")})`)
    .action((key: string, typeName: string) => {
      if (!VALID_TYPES.includes(typeName as EnvValueType)) {
        console.error(`Invalid type "${typeName}". Valid types: ${VALID_TYPES.join(", ")}`);
        process.exit(1);
      }
      setType(vaultDir, key, typeName as EnvValueType);
      console.log(`Type for "${key}" set to "${typeName}".`);
    });

  type
    .command("get <key>")
    .description("Get the type annotation for a key")
    .action((key: string) => {
      const t = getType(vaultDir, key);
      if (!t) {
        console.log(`No type annotation found for "${key}".`);
      } else {
        console.log(`${key}: ${t}`);
      }
    });

  type
    .command("remove <key>")
    .description("Remove the type annotation for a key")
    .action((key: string) => {
      removeType(vaultDir, key);
      console.log(`Type annotation for "${key}" removed.`);
    });

  type
    .command("list")
    .description("List all type annotations")
    .action(() => {
      const entries = listTypedKeys(vaultDir);
      if (entries.length === 0) {
        console.log("No type annotations defined.");
        return;
      }
      entries.forEach(({ key, type: t }) => console.log(`  ${key}: ${t}`));
    });

  type
    .command("check <key> <value>")
    .description("Check if a value matches the annotated type for a key")
    .action((key: string, value: string) => {
      const t = getType(vaultDir, key);
      if (!t) {
        console.log(`No type annotation for "${key}". Skipping validation.`);
        return;
      }
      const valid = validateValueType(value, t);
      if (valid) {
        console.log(`✔ Value is a valid ${t}.`);
      } else {
        console.error(`✘ Value does not match expected type "${t}" for key "${key}".`);
        process.exit(1);
      }
    });
}

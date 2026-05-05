/**
 * Parses a .env file string into a key-value record.
 * Supports:
 *  - KEY=VALUE pairs
 *  - Quoted values (single or double quotes)
 *  - Inline comments (# ...)
 *  - Blank lines and full-line comments are ignored
 */
export function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    if (!key) continue;

    let value = line.slice(eqIndex + 1).trim();

    // Strip inline comment (only outside quotes)
    value = stripInlineComment(value);

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function stripInlineComment(value: string): string {
  if (value.startsWith('"') || value.startsWith("'")) return value;
  const commentIndex = value.indexOf(' #');
  if (commentIndex !== -1) {
    return value.slice(0, commentIndex).trim();
  }
  return value;
}

/**
 * Serialises a key-value record back to .env file format.
 * Values containing spaces or special characters are double-quoted.
 */
export function stringifyEnv(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([key, value]) => {
      const needsQuotes = /[\s#"'\\]/.test(value) || value === '';
      const serialisedValue = needsQuotes ? `"${value}"` : value;
      return `${key}=${serialisedValue}`;
    })
    .join('\n');
}

import { describe, it, expect } from 'vitest';
import { parseEnv, stringifyEnv } from './parser';

describe('parseEnv', () => {
  it('parses simple KEY=VALUE pairs', () => {
    const result = parseEnv('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores blank lines and full-line comments', () => {
    const content = '\n# This is a comment\nKEY=value\n';
    expect(parseEnv(content)).toEqual({ KEY: 'value' });
  });

  it('strips double-quoted values', () => {
    expect(parseEnv('DB_URL="postgres://localhost/db"')).toEqual({
      DB_URL: 'postgres://localhost/db',
    });
  });

  it('strips single-quoted values', () => {
    expect(parseEnv("SECRET='my secret'")).toEqual({ SECRET: 'my secret' });
  });

  it('strips inline comments from unquoted values', () => {
    expect(parseEnv('PORT=3000 # app port')).toEqual({ PORT: '3000' });
  });

  it('does not strip inline comments inside quoted values', () => {
    expect(parseEnv('MSG="hello # world"')).toEqual({ MSG: 'hello # world' });
  });

  it('handles empty values', () => {
    expect(parseEnv('EMPTY=')).toEqual({ EMPTY: '' });
  });

  it('handles Windows-style CRLF line endings', () => {
    expect(parseEnv('A=1\r\nB=2')).toEqual({ A: '1', B: '2' });
  });

  it('ignores lines without an equals sign', () => {
    expect(parseEnv('NOEQUALS\nKEY=val')).toEqual({ KEY: 'val' });
  });
});

describe('stringifyEnv', () => {
  it('serialises a record to KEY=VALUE lines', () => {
    const result = stringifyEnv({ FOO: 'bar', BAZ: 'qux' });
    expect(result).toBe('FOO=bar\nBAZ=qux');
  });

  it('quotes values that contain spaces', () => {
    expect(stringifyEnv({ MSG: 'hello world' })).toBe('MSG="hello world"');
  });

  it('quotes empty string values', () => {
    expect(stringifyEnv({ EMPTY: '' })).toBe('EMPTY=""');
  });

  it('round-trips a parsed env file', () => {
    const original = 'DB_URL=postgres://localhost/db\nAPI_KEY=abc123\nPORT=3000';
    const parsed = parseEnv(original);
    const stringified = stringifyEnv(parsed);
    const reparsed = parseEnv(stringified);
    expect(reparsed).toEqual(parsed);
  });
});

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getLinkedPath,
  loadLinkedStore,
  linkKeys,
  unlinkKeys,
  getLinksForKey,
  getAllLinks,
} from './vaultLinked';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-linked-'));
}

describe('vaultLinked', () => {
  it('returns empty store when file does not exist', () => {
    const dir = makeTempDir();
    const store = loadLinkedStore(dir);
    expect(store.links).toEqual([]);
  });

  it('getLinkedPath returns correct path', () => {
    const dir = makeTempDir();
    expect(getLinkedPath(dir)).toBe(path.join(dir, '.envault', 'linked.json'));
  });

  it('linkKeys creates a link entry', () => {
    const dir = makeTempDir();
    linkKeys(dir, 'DB_HOST', 'DB_REPLICA_HOST', 'replica of DB_HOST');
    const links = getAllLinks(dir);
    expect(links).toHaveLength(1);
    expect(links[0].sourceKey).toBe('DB_HOST');
    expect(links[0].targetKey).toBe('DB_REPLICA_HOST');
    expect(links[0].description).toBe('replica of DB_HOST');
    expect(links[0].createdAt).toBeDefined();
  });

  it('linkKeys does not duplicate existing links', () => {
    const dir = makeTempDir();
    linkKeys(dir, 'A', 'B');
    linkKeys(dir, 'A', 'B');
    expect(getAllLinks(dir)).toHaveLength(1);
  });

  it('unlinkKeys removes the link', () => {
    const dir = makeTempDir();
    linkKeys(dir, 'A', 'B');
    linkKeys(dir, 'A', 'C');
    unlinkKeys(dir, 'A', 'B');
    const links = getAllLinks(dir);
    expect(links).toHaveLength(1);
    expect(links[0].targetKey).toBe('C');
  });

  it('getLinksForKey returns links where key is source or target', () => {
    const dir = makeTempDir();
    linkKeys(dir, 'DB_HOST', 'DB_REPLICA');
    linkKeys(dir, 'REDIS_URL', 'DB_HOST');
    linkKeys(dir, 'API_KEY', 'SECRET_KEY');
    const links = getLinksForKey(dir, 'DB_HOST');
    expect(links).toHaveLength(2);
  });

  it('unlinkKeys is a no-op when link does not exist', () => {
    const dir = makeTempDir();
    expect(() => unlinkKeys(dir, 'X', 'Y')).not.toThrow();
  });
});

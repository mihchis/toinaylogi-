import {
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
  open,
} from 'node:fs/promises';
import { join } from 'node:path';
import {
  SNAPSHOT_SCHEMA_VERSION,
  validateSnapshot,
  type ActressSnapshot,
  type CurrentSnapshot,
  type RefreshStatus,
} from '@/lib/actresses';

const publicRoot = join(process.cwd(), 'public', 'actress-cache');
const snapshotsRoot = join(publicRoot, 'snapshots');
const workRoot = join(process.cwd(), '.cache', 'jav-crawler');
const lockPath = join(workRoot, 'refresh.lock');
export const paths = { publicRoot, snapshotsRoot, workRoot, lockPath };

export async function ensureRoots() {
  await Promise.all([
    mkdir(snapshotsRoot, { recursive: true }),
    mkdir(workRoot, { recursive: true }),
  ]);
}
export async function writeStatus(
  status: Omit<RefreshStatus, 'schemaVersion' | 'updatedAt'>,
) {
  await ensureRoots();
  const body: RefreshStatus = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    ...status,
  };
  const tmp = join(workRoot, `status-${process.pid}.tmp`);
  await writeFile(tmp, JSON.stringify(body), 'utf8');
  await rename(tmp, join(publicRoot, 'status.json'));
}
export async function currentSnapshot(): Promise<CurrentSnapshot | null> {
  try {
    const raw = JSON.parse(
      await readFile(join(publicRoot, 'current.json'), 'utf8'),
    ) as CurrentSnapshot;
    return raw.schemaVersion === SNAPSHOT_SCHEMA_VERSION &&
      typeof raw.snapshotPath === 'string'
      ? raw
      : null;
  } catch {
    return null;
  }
}
export async function isDue() {
  const current = await currentSnapshot();
  return (
    !current ||
    Date.now() - Date.parse(current.createdAt) >= 7 * 24 * 60 * 60 * 1000
  );
}
export async function takeLock() {
  await ensureRoots();
  try {
    const file = await open(lockPath, 'wx');
    await file.writeFile(
      JSON.stringify({ pid: process.pid, startedAt: Date.now() }),
    );
    return async () => {
      await file.close();
      await rm(lockPath, { force: true });
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    try {
      if (Date.now() - (await stat(lockPath)).mtimeMs > 60 * 60 * 1000) {
        await rm(lockPath, { force: true });
        return takeLock();
      }
    } catch {}
    return null;
  }
}
export async function makeStaging(snapshotId: string) {
  const directory = join(workRoot, `staging-${snapshotId}`);
  await rm(directory, { recursive: true, force: true });
  await mkdir(join(directory, 'images'), { recursive: true });
  return directory;
}
export async function publishSnapshot(
  snapshot: ActressSnapshot,
  staging: string,
) {
  if (!validateSnapshot(snapshot)) throw new Error('Refusing invalid snapshot');
  const finalDirectory = join(snapshotsRoot, snapshot.snapshotId);
  await rm(finalDirectory, { recursive: true, force: true });
  await rename(staging, finalDirectory);
  const manifest: CurrentSnapshot = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    snapshotId: snapshot.snapshotId,
    snapshotPath: `/actress-cache/snapshots/${snapshot.snapshotId}/snapshot.json`,
    createdAt: snapshot.createdAt,
  };
  const temp = join(workRoot, `current-${process.pid}.tmp`);
  await writeFile(temp, JSON.stringify(manifest), 'utf8');
  await rename(temp, join(publicRoot, 'current.json'));
  await writeStatus({ state: 'idle', message: 'Ready' });
}

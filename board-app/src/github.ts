export interface Repo {
  repo: string;
  branch: string;
  token: string;
}

export interface TreeChange {
  path: string;
  /** Blob sha to write, or null to delete the file */
  sha: string | null;
}

const API = 'https://api.github.com';

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function gh<T>({ repo, token }: Repo, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}/repos/${repo}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new GitHubError(res.status, `GitHub ${res.status}: ${body.message ?? res.statusText}`);
  }
  return res.json();
}

const send = <T>(cfg: Repo, method: string, path: string, body: unknown) =>
  gh<T>(cfg, path, { method, body: JSON.stringify(body) });

export function utf8ToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function base64ToUtf8(base64: string): string {
  const binary = atob(base64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function rawUrl(repo: string, branch: string, path: string): string {
  return `https://raw.githubusercontent.com/${repo}/${branch}/${path.replace(/^\//, '')}`;
}

export async function createBlob(cfg: Repo, base64: string): Promise<string> {
  return (await send<{ sha: string }>(cfg, 'POST', '/git/blobs', { content: base64, encoding: 'base64' })).sha;
}

// Repo metadata reports the account's access, not the token's, so probe with a real (unreferenced) write
export async function canWrite(cfg: Repo): Promise<boolean> {
  try {
    await createBlob(cfg, utf8ToBase64('board token check\n'));
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(
  cfg: Repo,
  path: string,
  ref = cfg.branch,
): Promise<{ text: string; sha: string } | undefined> {
  try {
    const data = await gh<{ content: string; sha: string }>(cfg, `/contents/${path}?ref=${ref}`);
    return { text: base64ToUtf8(data.content), sha: data.sha };
  } catch (err) {
    if (err instanceof GitHubError && err.status === 404) return undefined;
    throw err;
  }
}

export async function headCommit(cfg: Repo): Promise<string> {
  return (await gh<{ object: { sha: string } }>(cfg, `/git/ref/heads/${cfg.branch}`)).object.sha;
}

// Writes all changes as a single commit on top of `parent`; the ref update fails (422) if the branch moved
export async function commitChanges(
  cfg: Repo,
  parent: string,
  changes: TreeChange[],
  message: string,
): Promise<string> {
  const { tree: base } = await gh<{ tree: { sha: string } }>(cfg, `/git/commits/${parent}`);
  const tree = await send<{ sha: string }>(cfg, 'POST', '/git/trees', {
    base_tree: base.sha,
    tree: changes.map(({ path, sha }) => ({ path, mode: '100644', type: 'blob', sha })),
  });
  const commit = await send<{ sha: string }>(cfg, 'POST', '/git/commits', {
    message,
    tree: tree.sha,
    parents: [parent],
  });
  await send(cfg, 'PATCH', `/git/refs/heads/${cfg.branch}`, { sha: commit.sha });
  return commit.sha;
}

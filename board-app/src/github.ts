export interface Repo {
  repo: string;
  branch: string;
  token: string;
}

const API = 'https://api.github.com';

function headers(token: string): HeadersInit {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

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

// Reads a text file from the branch; the API (unlike the Pages site) reflects commits immediately
export async function getTextFile(
  { repo, branch, token }: Repo,
  path: string,
): Promise<{ text: string; sha: string } | undefined> {
  const res = await fetch(`${API}/repos/${repo}/contents/${path}?ref=${branch}`, {
    headers: headers(token),
    cache: 'no-store',
  });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { text: base64ToUtf8(data.content), sha: data.sha };
}

export function rawUrl(repo: string, branch: string, path: string): string {
  return `https://raw.githubusercontent.com/${repo}/${branch}/${path.replace(/^\//, '')}`;
}

export async function canPush({ repo, token }: Repo): Promise<boolean> {
  const res = await fetch(`${API}/repos/${repo}`, { headers: headers(token) });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.permissions?.push);
}

async function getSha({ repo, branch, token }: Repo, path: string): Promise<string | undefined> {
  const res = await fetch(`${API}/repos/${repo}/contents/${path}?ref=${branch}`, { headers: headers(token) });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return (await res.json()).sha;
}

// Creates or updates a file; returns the new blob sha so repeated saves don't need a lookup
export async function putFile(
  cfg: Repo,
  path: string,
  base64: string,
  message: string,
  sha?: string,
): Promise<string> {
  const currentSha = sha ?? (await getSha(cfg, path));
  const res = await fetch(`${API}/repos/${cfg.repo}/contents/${path}`, {
    method: 'PUT',
    headers: headers(cfg.token),
    body: JSON.stringify({ message, content: base64, branch: cfg.branch, sha: currentSha }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return (await res.json()).content.sha;
}

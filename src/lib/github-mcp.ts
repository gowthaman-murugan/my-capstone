import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface GitHubRepoInfo {
  id: number;
  fullName: string;
  description: string | null;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  defaultBranch: string;
  visibility: string;
  htmlUrl: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  htmlUrl: string;
  user: string;
  createdAt: string;
  updatedAt: string;
  mergeable: boolean | null;
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
}

function createMcpClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required for GitHub MCP integration');
  }

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      ...process.env as Record<string, string>,
      GITHUB_PERSONAL_ACCESS_TOKEN: token,
    },
  });

  const client = new Client({ name: 'codereview-bot', version: '1.0.0' });
  return { client, transport };
}

function extractText(result: { content: Array<{ type: string; text?: string }> }): string {
  const textContent = result.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text' || !textContent.text) {
    throw new Error('MCP tool returned no text content');
  }
  return textContent.text;
}

export async function fetchGitHubRepoInfo(owner: string, repo: string): Promise<GitHubRepoInfo> {
  const { client, transport } = createMcpClient();

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: 'get_repository',
      arguments: { owner, repo },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = JSON.parse(extractText(result as any)) as Record<string, unknown>;

    return {
      id: data.id as number,
      fullName: data.full_name as string,
      description: (data.description as string | null) ?? null,
      language: (data.language as string | null) ?? null,
      stargazersCount: (data.stargazers_count as number) ?? 0,
      forksCount: (data.forks_count as number) ?? 0,
      openIssuesCount: (data.open_issues_count as number) ?? 0,
      defaultBranch: (data.default_branch as string) ?? 'main',
      visibility: (data.visibility as string) ?? 'public',
      htmlUrl: data.html_url as string,
    };
  } finally {
    await client.close();
  }
}

export async function fetchGitHubPullRequest(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<GitHubPullRequest> {
  const { client, transport } = createMcpClient();

  try {
    await client.connect(transport);

    const result = await client.callTool({
      name: 'get_pull_request',
      arguments: { owner, repo, pullNumber },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = JSON.parse(extractText(result as any)) as Record<string, unknown>;
    const user = data.user as Record<string, unknown> | null;

    return {
      number: data.number as number,
      title: data.title as string,
      state: data.state as string,
      htmlUrl: data.html_url as string,
      user: (user?.login as string) ?? 'unknown',
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
      mergeable: (data.mergeable as boolean | null) ?? null,
      additions: (data.additions as number | null) ?? null,
      deletions: (data.deletions as number | null) ?? null,
      changedFiles: (data.changed_files as number | null) ?? null,
    };
  } finally {
    await client.close();
  }
}

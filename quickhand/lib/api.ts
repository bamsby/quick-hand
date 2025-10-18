import type { Message } from "./types";
import type { RoleKey } from "./roles";

export async function runAgent(params:{ role: RoleKey; history: Message[] }) {
  // TODO: later call backend (OpenAI/Gemini) + Exa + MCP. For now: echo.
  const last = params.history.at(-1);
  return { id: String(Date.now()), content: `(${params.role}) Stub reply to: "${last?.content}"` };
}

export async function exaSearch(query:string) {
  // TODO: integrate Exa; return mocked results now.
  return [{ title:"Mock Result", url:"https://example.com", snippet:"This is a placeholder." }];
}

export async function notionCreatePage(title:string, contentMD:string) {
  // TODO: call Smithery MCP for Notion. Return mocked link.
  return { pageUrl: "https://notion.so/mock-page" };
}

export async function gmailCreateDraft(to:string, subject:string, bodyHTML:string) {
  // TODO: call Smithery MCP Gmail. Return mocked link.
  return { threadUrl: "https://mail.google.com/mock-thread" };
}


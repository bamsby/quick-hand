import type { Message, Citation, ActionPlan } from "./types";
import type { RoleKey } from "./roles";
import { supabase } from "./supabase";

interface AgentResponse {
  id: string;
  content: string;
  citations?: Citation[];
  plan?: ActionPlan[];
}

export async function runAgent(params: { role: RoleKey; history: Message[] }): Promise<Message> {
  try {
    const { data, error } = await supabase.functions.invoke<AgentResponse>("plan", {
      body: {
        role: params.role,
        history: params.history,
      },
    });

    if (error) {
      console.error("Supabase function error:", error);
      throw new Error(error.message || "Failed to get response from server");
    }

    if (!data) {
      throw new Error("No data received from server");
    }

    // Convert response to Message format
    const message: Message = {
      id: data.id,
      role: "assistant",
      content: data.content,
      citations: data.citations,
      plan: data.plan?.map(p => ({ ...p, status: "pending" as const })),
    };

    return message;
  } catch (error) {
    console.error("runAgent error:", error);
    // Return error message as assistant message
    return {
      id: String(Date.now()),
      role: "assistant",
      content: "Couldn't reach the server. Check your connection and try again.",
    };
  }
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


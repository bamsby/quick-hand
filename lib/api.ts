import type { Message, Citation, ActionPlan, IntegrationStatus, StructuredAnswer, NextAction } from "./types";
import type { RoleKey } from "./roles";
import { supabase } from "./supabase";
import { z } from "zod";

// Zod schemas for structured response validation
const CitationSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
});

const NextActionSchema = z.object({
  tool: z.string(),
  params: z.record(z.any()),
});

const StructuredAnswerSchema = z.object({
  answer: z.string(),
  bullets: z.array(z.string()),
  citations: z.array(CitationSchema),
  followups: z.array(z.string()),
  next_actions: z.array(NextActionSchema),
});

interface AgentResponse {
  id: string;
  content: string;
  citations?: Citation[];
  plan?: ActionPlan[];
  structured?: StructuredAnswer;
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

    // Validate structured response if present
    let structured: StructuredAnswer | undefined;
    if (data.structured) {
      try {
        structured = StructuredAnswerSchema.parse(data.structured);
      } catch (error) {
        console.error("Structured response validation failed:", error);
        // Continue without structured data
      }
    }

    // Convert response to Message format
    const message: Message = {
      id: data.id,
      role: "assistant",
      content: data.content,
      citations: data.citations,
      plan: data.plan?.map(p => ({ ...p, status: "pending" as const })),
      structured,
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

export async function checkNotionConnection(): Promise<IntegrationStatus> {
  try {
    const { data, error } = await supabase.functions.invoke<IntegrationStatus>(
      "notion-auth-status"
    );

    if (error) {
      console.error("Check Notion connection error:", error);
      return { connected: false };
    }

    return data || { connected: false };
  } catch (error) {
    console.error("Check Notion connection failed:", error);
    return { connected: false };
  }
}

export async function checkGmailConnection(): Promise<IntegrationStatus> {
  try {
    const { data, error } = await supabase.functions.invoke<IntegrationStatus>(
      "gmail-auth-status"
    );

    if (error) {
      console.error("Check Gmail connection error:", error);
      return { connected: false };
    }

    return data || { connected: false };
  } catch (error) {
    console.error("Check Gmail connection failed:", error);
    return { connected: false };
  }
}

export async function notionListPages() {
  try {
    const { data, error } = await supabase.functions.invoke<{
      pages: Array<{ id: string; title: string; url: string }>;
    }>("notion-list-pages");

    if (error) {
      console.error("Notion list pages error:", error);
      throw new Error(error.message || "Failed to fetch Notion pages");
    }

    if (!data) {
      throw new Error("No data received from server");
    }

    return data.pages;
  } catch (error) {
    console.error("notionListPages error:", error);
    throw error;
  }
}

export async function notionCreatePage(
  title: string, 
  contentMD: string, 
  citations?: Citation[],
  parentPageId?: string
) {
  try {
    const { data, error } = await supabase.functions.invoke<{
      pageUrl: string;
      pageId: string;
    }>("notion-create-page", {
      body: { title, content: contentMD, citations, parentPageId },
    });

    if (error) {
      console.error("Notion create page error:", error);
      throw new Error(error.message || "Failed to create Notion page");
    }

    if (!data) {
      throw new Error("No data received from server");
    }

    return { pageUrl: data.pageUrl, pageId: data.pageId };
  } catch (error) {
    console.error("notionCreatePage error:", error);
    throw error;
  }
}

export async function gmailCreateDraft(to: string, subject: string, bodyHTML: string) {
  try {
    const { data, error } = await supabase.functions.invoke<{
      draftUrl: string;
      messageId: string;
      threadId: string;
    }>("gmail-create-draft", {
      body: { to, subject, body: bodyHTML },
    });

    if (error) {
      console.error("Gmail create draft error:", error);
      throw new Error(error.message || "Failed to create Gmail draft");
    }

    if (!data) {
      throw new Error("No data received from server");
    }

    return { threadUrl: data.draftUrl, messageId: data.messageId };
  } catch (error) {
    console.error("gmailCreateDraft error:", error);
    throw error;
  }
}

export async function disconnectNotion() {
  try {
    const { data, error } = await supabase.functions.invoke<{
      success: boolean;
      message: string;
    }>("notion-disconnect");

    if (error) {
      console.error("Notion disconnect error:", error);
      throw new Error(error.message || "Failed to disconnect Notion");
    }

    if (!data) {
      throw new Error("No data received from server");
    }

    return { success: data.success, message: data.message };
  } catch (error) {
    console.error("disconnectNotion error:", error);
    throw error;
  }
}

export async function disconnectGmail() {
  try {
    const { data, error } = await supabase.functions.invoke<{
      success: boolean;
      message: string;
    }>("gmail-disconnect");

    if (error) {
      console.error("Gmail disconnect error:", error);
      throw new Error(error.message || "Failed to disconnect Gmail");
    }

    if (!data) {
      throw new Error("No data received from server");
    }

    return { success: data.success, message: data.message };
  } catch (error) {
    console.error("disconnectGmail error:", error);
    throw error;
  }
}


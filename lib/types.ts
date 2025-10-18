export type Role = "system" | "user" | "assistant";
export type RoleKey = import("./roles").RoleKey;

export type Citation = {
  id: number;
  title: string;
  url: string;
  snippet: string;
};

export type ActionPlan = {
  id: string;
  action: "summarize" | "notion" | "gmail";
  label: string;
  params?: any;
  status: "pending" | "running" | "done" | "error";
  result?: string;
};

export type NextAction = {
  tool: string;
  params: Record<string, any>;
};

export type StructuredAnswer = {
  answer: string;
  bullets: string[];
  citations: Citation[];
  followups: string[];
  next_actions: NextAction[];
};

export type Message = {
  id: string;
  role: Role;
  content: string;
  citations?: Citation[];
  plan?: ActionPlan[];
  structured?: StructuredAnswer;
  metadata?: {
    intent?: string;
    topic?: string;
    toolCalls?: string[]; // Track which tools were called
  };
};

export type PlanStep = { id:string; title:string; status:"pending"|"running"|"done"|"error"; };

export type IntegrationStatus = {
  connected: boolean;
  workspaceName?: string;
  workspaceId?: string;
};

export type IntegrationType = "notion" | "gmail";


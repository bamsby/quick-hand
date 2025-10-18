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

export type Message = {
  id: string;
  role: Role;
  content: string;
  citations?: Citation[];
  plan?: ActionPlan[];
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


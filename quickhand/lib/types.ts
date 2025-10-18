export type Role = "system" | "user" | "assistant";
export type Message = { id:string; role:Role; content:string; };
export type PlanStep = { id:string; title:string; status:"pending"|"running"|"done"|"error"; };
export type RoleKey = import("./roles").RoleKey;


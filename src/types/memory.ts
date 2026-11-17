export type MemoryCategory = "project" | "preference" | "relationship" | "general";

export interface UserMemory {
  id: string;
  category: MemoryCategory;
  title: string;
  content: string;
  updated_at: string;
}

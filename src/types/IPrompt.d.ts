import { Document } from "mongoose";

export type IPromptFields = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type IPrompt = Document & IPromptFields;

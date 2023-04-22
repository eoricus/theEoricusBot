import { Document } from "mongoose";

export interface IConvFields {
  userID: number;
  title: string;
  mode: "eoricus" | "linux" | "coder" | "assistant";
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
  }[];
  isDeleted?: boolean;
}

export interface IConv extends IConvFields, Document {}

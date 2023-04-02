import { Schema, model } from "mongoose";
import { IPrompt } from "../types/IPrompt";

export const promptSchema: Schema<IPrompt> = new Schema<IPrompt>({
  role: {
    type: String,
    default: "system",
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: String,
});

export default model<IPrompt>("Prompt", promptSchema);

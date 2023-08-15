import { Schema, model } from "mongoose";
import { IPost } from "../types/IPost";

const postSchema = new Schema<IPost>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  url: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  abridged: {
    type: String,
    required: true,
  },
  wasCreatedAt: {
    type: Date,
    default: Date.now,
  },
});

postSchema.index({ content: "text" });

export default model<IPost>("Post", postSchema);

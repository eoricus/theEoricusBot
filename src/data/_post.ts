import { Schema, model } from "mongoose";
import { IPost } from "../types/IPost";

const postSchema = new Schema<IPost>({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
});

export default model<IPost>("Post", postSchema);
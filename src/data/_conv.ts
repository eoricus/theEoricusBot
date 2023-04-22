import { Schema, model } from "mongoose";

import { IConv } from "../types/IConv";

const convSchema = new Schema<IConv>({
  _id: {
    type: String,
    // TODO is not work
    default: function () {
      let result = "";
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (let i = 0; i < 8; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return result;
    },
    unique: true,
  },
  userID: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ["eoricus", "linux", "coder", "assistant"],
    required: true,
  },
  messages: [
    {
      role: {
        type: String,
        enum: ["user", "assistant", "system"],
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
    },
  ],
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

export default model<IConv>("Conversation", convSchema);

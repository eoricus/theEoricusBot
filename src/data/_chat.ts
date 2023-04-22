import { Schema, model } from "mongoose";
import { IChat } from "../types/IChat";

export const chatSchema: Schema<IChat> =
  new Schema<IChat>({
    chatID: {
      type: Number,
      required: true,
    },
    isPremium: {
      type: Boolean,
      required: true,
    },
    premiumWasActivated: {
      type: Date,
    },
    mailing: {
      type: Boolean,
      required: true,
      default: true,
    },
  });

export default model<IChat>("Chat", chatSchema);

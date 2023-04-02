import { Schema, model } from "mongoose";
import { IConversation } from "../types/IConversation";

export const conversationSchema: Schema<IConversation> =
  new Schema<IConversation>({
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

export default model<IConversation>("Conversation", conversationSchema);

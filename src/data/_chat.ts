import { Schema, Document, model } from "mongoose";

export interface IChat extends Document {
  chatID: number;
  isPremium: boolean;
  premiumWasActivated: Date;
  requests: { text: string; wasSendAt: Date; answer: string }[];
  delay: number;
  offset: number;
  mailing: boolean;
}

export const chatSchema: Schema<IChat> = new Schema<IChat>({
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
  delay: {
    type: Number,
    required: true,
    default: 40,
  },
  offset: {
    type: Number,
    required: true,
    default: 0,
  },
  mailing: {
    type: Boolean,
    required: true,
    default: true
  }
});

export default model<IChat>("Chat", chatSchema);

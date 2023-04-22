import { Schema, model } from "mongoose";
import IUser from "../types/IUser";

const userSchema = new Schema<IUser>({
  userID: {
    type: Number,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  isPremium: {
    type: Boolean,
    required: true,
  },
  wasPremiumActivated: {
    type: Date,
  },
  conversations: [
    {
      type: String,
    },
  ],
  actualConversation: {
    type: String,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  wasSentLastRequest: {
    type: Date,
  },
});

export default model<IUser>("User", userSchema);

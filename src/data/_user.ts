import { Schema, model } from "mongoose";
import IUser from "../types/IUser";

export const userSchema: Schema<IUser> = new Schema<IUser>({
  userID: {
    type: Number,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  isPremium: {
    type: Boolean,
    required: true,
  },
  premiumWasActivated: {
    type: Date,
  },
  requests: [
    {
      role: {
        type: String,
        enum: ["user", "assistant", "system"],
        required: true,
        default: "user",
      },
      content: {
        type: String,
        required: true,
      },
      wasSendAt: {
        type: Date,
        required: true,
      },
    },
  ],
  total: {
    type: Number,
    required: true,
    default: 0,
  },
});

export default model<IUser>("User", userSchema);

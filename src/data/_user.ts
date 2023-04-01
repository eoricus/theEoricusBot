import { Schema, Document, model } from "mongoose";

export interface IUser extends Document {
  userID: number;
  isPremium: boolean;
  premiumWasActivated: Date;
  requests: { text: string; wasSendAt: Date; answer: string }[];
  total: number;
}

export const userSchema: Schema<IUser> = new Schema<IUser>({
  userID: {
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
  requests: [
    {
      text: {
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
    default: 0
  },
});

export default model<IUser>("User", userSchema);

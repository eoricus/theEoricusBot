import { Document } from "mongoose";

export default interface IUser extends Document {
  userID: number;
  username: string;
  isPremium: boolean;
  premiumWasActivated: Date;
  requests: {
    role: "user" | "assistant" | "system";
    content: string;
    wasSendAt: Date;
  }[];
  total: number;
}

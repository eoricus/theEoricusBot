import { Document } from "mongoose";

export interface IConversation extends Document {
  chatID: number;
  isPremium: boolean;
  premiumWasActivated?: Date;
  mailing: boolean;
}
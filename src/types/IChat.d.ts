import { Document } from "mongoose";

export interface IChat extends Document {
  chatID: number;
  isPremium: boolean;
  premiumWasActivated?: Date;
  mailing: boolean;
}
import { Document, ObjectId } from "mongoose";

export default interface IUser extends Document {
  userID: number;
  username: string;
  isPremium: boolean;
  wasPremiumActivated?: Date;
  conversations?: string[];
  actualConversation?: string;
  total: number;
  wasSentLastRequest?: Date;
}

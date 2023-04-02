import { MessageContext } from "puregram";
import { IUser } from "../data/_user";
import { IConversation } from "../data/_conversation";

export default interface IExtraCtx extends MessageContext {
  user: IUser;
  conversation: IConversation;
}

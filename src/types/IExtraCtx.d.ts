import { MessageContext } from "puregram";
import IUser from "./IUser";
import { IChat } from "./IChat";
import { IConv } from "./IConv";

export default interface IExtraCtx extends MessageContext {
  user: IUser;
  chatData: IChat;
  conv: IConv | null;
}

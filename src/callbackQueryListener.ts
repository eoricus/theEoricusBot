import { CallbackQueryContext } from "puregram";
import data from "./data";

interface QueryPayload {
  command: "to" | "clear" | string;
  id: string;
}

export default async (context: CallbackQueryContext) => {
  const queryPayload = context.queryPayload as QueryPayload;

  switch (queryPayload.command) {
    case "to":
      await data.user.findOneAndUpdate(
        { userID: context.senderId },
        { $set: { actualConversation: queryPayload.id } }
      );
      context.message?.editMessageText(
        `Вы переключились к диалогу "${
          (await data.conv.findById(queryPayload.id))?.title
        }"`
      );
      return;
    case "clear":
      const user = await data.user.findOne({ userID: context.senderId });

      if (!user) {
        console.log("dw");
        return context.message?.editMessageText("Неизвестная ошибка");
      }

      const conversationIndex = user.conversations?.indexOf(queryPayload.id);

      if (conversationIndex === -1 || conversationIndex === undefined) {
        console.log(user.conversations?.indexOf(queryPayload.id));
        return context.message?.editMessageText("Неизвестная ошибка");
      }

      user.conversations?.splice(conversationIndex, 1);

      if (
        user.actualConversation &&
        user.actualConversation == queryPayload.id
      ) {
        user.actualConversation = "";
      }

      await user.save();
      let conv = await data.conv.findByIdAndUpdate(queryPayload.id, {
        $set: {
          isDeleted: true,
        },
      });
      context.message?.editMessageText(`Диалог <<${conv?.title}>> почищен!`);
      return;
    default:
      break;
  }
};

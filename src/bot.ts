/** */
import data from "./data";

/** */
import { Telegram } from "puregram";
/** */
import { HearManager as TelegramHearManager } from "@puregram/hear";

/** */
import IExtraCtx from "./types/IExtraCtx";

/** */
import registerListeners from "./messageListeners";
import { ask, GPTMode } from "./messageListeners/_gpt";

/** */
import env from "../env.json";

const bot = Telegram.fromToken(env.tg.bot.token),
  logger = Telegram.fromToken(env.tg.logger.token);

const botHearManager = new TelegramHearManager<IExtraCtx>();

registerListeners(botHearManager, logger);

/**
 * Modifies the context by adding user fields from the database
 */
bot.updates.on("message", async (context: IExtraCtx, next) => {
  let user = await data.user.findOne({ userID: context.senderId });

  if (!user) {
    user = await data.user.create({
      userID: context.senderId,
      username: context.from
        ? context.from.username
        : context.isPM()
        ? context.chat.username
        : "",
      isPremium: false,
      conversations: [],
      total: 0,
    });
  }
  context.user = user;

  if (user.actualConversation) {
    if (user.conversations && user.conversations.length > 0) {
      user.actualConversation = user.conversations[0];
    }

    context.conv = await data.conv.findById(user.actualConversation);
  }

  if (!context.isPM()) {
    let chat;
    if (!(chat = await data.chat.findOne({ chatID: context.chatId }))) {
      chat = await data.chat.create({
        chatID: context.chatId,
        isPremium: false,
        mailing: true,
      });
    }
    context.chatData = chat;
  }
  return next();
});

bot.updates.on("message", botHearManager.middleware);

/**
 * Handles button presses
 */
bot.updates.on("callback_query", async (context) => {
  const queryPayload = context.queryPayload as {
    [key: string]: string;
  };

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
});

export default bot;

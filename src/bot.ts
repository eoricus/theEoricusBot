/** */
import data from "./data";

/** */
import { InlineQueryContext, Telegram } from "puregram";
/** */
import { HearManager as TelegramHearManager } from "@puregram/hear";

/** */
import IExtraCtx from "./types/IExtraCtx";

/** */
import messageListeners from "./messageListeners";
// import { ask, GPTMode } from "./messageListeners/gpt/utils";

/** */
import env from "../env.json";
/** */
import callbackQueryListener from "./callbackQueryListener";

/**
 *
 */
const bot = Telegram.fromToken(env.tg.bot.token);

/**
 *
 */
const botHearManager = new TelegramHearManager<IExtraCtx>();

messageListeners.forEach((register) => {
  register(botHearManager);
});

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
bot.updates.on("callback_query", callbackQueryListener);

// bot.updates.on("inline_query", (context: InlineQueryContext) => {
//   console.log(context);
//   return context.answerInlineQuery([
//     {
//       id: "dwdw",
//       type: "article",
//       title: "foo bar baz",
//       input_message_content: {
//         message_text: "fiz",
//       },
//     },
//   ]);
// });

export default bot;

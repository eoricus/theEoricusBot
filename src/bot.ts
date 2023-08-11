/**
 * TODO: Change it to dotenv
 */
import env from "../env.json";

import data from "./data";

import { InlineQueryContext, Telegram } from "puregram";
import { HearManager as TelegramHearManager } from "@puregram/hear";

/**
 * MessageContext interface from puregram, with new fields added
 * from database. The context is modified in the intermediate handler.
 */
import IExtraCtx from "./types/IExtraCtx";

/**
 * An array of handler registration functions, each of which
 * contains command handlers
 */
import messageListeners from "./messageListeners";
// import { ask, GPTMode } from "./messageListeners/gpt/utils";

import callbackQueryListener from "./callbackQueryListener";

const bot = Telegram.fromToken(env.tg.bot.token);

/**
 * Modifies the context by adding user fields from the database
 */
bot.updates.on("message", async (ctx: IExtraCtx, next) => {
  ctx.user =
    (await data.user.findOne({ userID: ctx.senderId })) ||
    (await data.user.create({
      userID: ctx.senderId,
      // TODO: minimize
      username: ctx.from
        ? ctx.from.username
        : ctx.isPM()
        ? ctx.chat.username
        : "",
      isPremium: false,
      conversations: [],
      total: 0,
    }));

  // bruh
  ctx.user.actualConversation ??= ctx.user?.conversations?.[0];

  ctx.conv = await data.conv.findById(ctx.user.actualConversation);

  // TODO: maybe is not work
  ctx.chatData =
    (await data.chat.findOne({ chatID: ctx.chatId })) ||
    (await data.chat.create({
      chatID: ctx.chatId,
      isPremium: false,
      mailing: true,
    }));

  return next();
});

const botHearManager = new TelegramHearManager<IExtraCtx>();

messageListeners.forEach((register) => {
  register(botHearManager);
});

bot.updates.on("message", botHearManager.middleware);

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

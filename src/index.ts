import "paint-console";

import data from "./data";

import { Telegram } from "puregram";
import { HearManager } from "@puregram/hear";
import IExtraCtx from "./types/IExtraCtx";

import { Configuration, OpenAIApi } from "openai";

import env from "../env.json";
import { IPromptFields } from "./types/IPrompt";

const telegram = Telegram.fromToken(env.tg.token);
const hearManager = new HearManager<IExtraCtx>();

const openai = new OpenAIApi(
  new Configuration({
    apiKey: env.openai.token,
  })
);

/**
 * Modifies the context by adding user fields from the database
 */
telegram.updates.on("message", async (context: IExtraCtx, next) => {
  let user;
  if (!(user = await data.user.findOne({ userID: context.senderId }))) {
    user = await data.user.create({
      userID: context.senderId,
      username: context.from
        ? context.from.username
        : context.isPM()
        ? context.chat.username
        : "",
      isPremium: false,
      requests: [],
      total: 0,
    });
  }
  context.user = user;

  if (!context.isPM()) {
    let conversation;
    if (!(conversation = await data.chat.findOne({ chatID: context.chatId }))) {
      conversation = await data.chat.create({
        chatID: context.chatId,
        isPremium: false,
        mailing: true,
      });
    }
    context.conversation = conversation;
  }
  return next();
});
telegram.updates.on("message", hearManager.middleware);

/**
 * Sends the user an start message with a list of commands
 */
hearManager.hear(/^(\/)?(start|начать)/i, async (context: IExtraCtx) =>
  context.reply(env.default.start, { parse_mode: "HTML" })
);

/**
 * Sends the user a message with a list of commands
 */
hearManager.hear(/^(\/)?help/i, (context: IExtraCtx) =>
  context.reply(env.default.help, { parse_mode: "HTML" })
);

/**
 * Turns on messages from the Telegram chat channel
 */
hearManager.hear(/^(\/)?on/i, async (context: IExtraCtx) => {
  if (context.isPM()) {
    return context.reply(env.default.mailing.on.fromPM);
  }

  let chat = await data.chat.findOneAndUpdate(
    { chatID: context.chatId },
    {
      $set: {
        mailing: true,
      },
    }
  );

  context.reply(
    chat?.mailing
      ? env.default.mailing.on.isMailingAlreadyOn
      : env.default.mailing.on.isMailingOn,
    { parse_mode: "HTML" }
  );
});

/**
 * Turns off messages from the Telegram chat channel
 */
hearManager.hear(/^(\/)?off/i, async (context: IExtraCtx) => {
  if (context.isPM()) {
    return context.reply(env.default.mailing.off.fromPM);
  }

  let chat = await data.chat.findOneAndUpdate(
    { chatID: context.chatId },
    {
      $set: {
        mailing: false,
      },
    }
  );

  context.send(
    !chat?.mailing
      ? env.default.mailing.off.isMailingAlreadyOff
      : env.default.mailing.off.isMailingOff,
    { parse_mode: "HTML" }
  );
});

/**
 * Set prompts for chatGPT.
 * Available only to admins
 *
 * TODO:
 * - [ ]  Adding a lot of prompts at once.
 *        Ability to use forwarded messages to generate prompts
 */
hearManager.hear(
  { text: /^(\/)?setPrompt/i, senderId: env.tg.adminIDs },
  async (context: IExtraCtx) => {
    /**
     * If the message is a reply, then prompt is taken from the message
     * in response to which the message was sent.
     *
     * Otherwise the prompt is taken from a user-specified prompt
     */
    let request;
    if (context.hasReplyMessage() && context.replyMessage.text) {
      request = context.replyMessage.text;
    } else if (
      !(request = context.text?.match(/^(\/)?setPrompt\s*(?<Prompt>.*)/i)
        ?.groups?.Prompt)
    ) {
      return context.reply(env.default.setPrompt.errorIncorrectPrompt);
    }

    try {
      // TODO minimize and refactor
      let prompt = JSON.parse(request);
      if (!(prompt.role && prompt.content))
        return context.reply(env.default.setPrompt.errorIncorrectPrompt);
      let newPropmpt = await data.prompt.findOneAndUpdate(
        { role: prompt.role },
        prompt,
        { upsert: true, new: true }
      );

      return context.reply(
        newPropmpt
          ? `Назначена новая подсказка:\n <code>{"role": ${prompt.role}, "content": ${prompt.content}}</code>`
          : "Неизвестная ошибка!",
        { parse_mode: "HTML" }
      );
    } catch (e) {
      return context.reply(env.default.setPrompt.errorIncorrectPrompt);
    }
  }
);

/**
 * Set premium statos for user.
 * Available only to admins
 */
hearManager.hear(
  { text: /^(\/)?setPremium/i, senderId: env.tg.adminIDs },
  async (context: IExtraCtx) => {
    /**
     * If the message is a reply, then premium status
     * is assigned to the user whose message is replied to.
     *
     * Otherwise the identifier entered by the user in the message body is used
     */
    let userID;

    if (context.hasReplyMessage()) {
      userID = context.replyMessage.from?.id;
    } else {
      userID = context.text?.match(/^(\/)?setPremium\s*(?<userID>\d*)/i)?.groups
        ?.userID;
    }

    if (!userID) {
      return context.reply(env.default.setPremium.errorIncorrectUserID);
    }

    /**
     * The document of the user to whom premium status is assigned.
     * If the document is not found, then a message is sent that the user is not found
     */
    let premiumUser = await data.user.findOneAndUpdate(
      !isNaN(Number(userID)) ? { userID: userID } : { userName: userID },
      {
        $set: {
          isPremium: true,
          premiumWasActivated: new Date(),
        },
      },
      { new: true }
    );

    if (premiumUser) {
      return context.reply(
        `Теперь ${premiumUser.username} может делать неограниченное количество запросов!`
      );
    } else {
      return context.reply(env.default.setPremium.errorUnfoundedUser);
    }
  }
);

/**
 * Talk with AI
 * TODO:
 * - [ ] Simplify adding prompts;
 * - [ ] Add 3 random user prompts;
 */
hearManager.hear(/^(\/)?ai/i, async (context: IExtraCtx) => {
  let request: string | undefined;
  if (context.hasReplyMessage() && context.replyMessage.text) {
    request = context.replyMessage.text;
  } else {
    request = context.text?.match(/ai(?<Request>.*)/i)?.groups?.Request;
  }

  // Incorrect request
  if (!request) {
    return context.reply(env.default.ai.errorRequestIsEmpty);
  }

  // Too many request
  if (
    context.user.requests.length >= 30 &&
    context.user.requests[
      context.user.requests.length - 30
    ].wasSendAt.getTime() -
      new Date().getTime() <=
      86400
  ) {
    return context.reply(env.default.ai.errorTooManyRequest);
  }

  const systemPromptFromDB = await data.prompt.findOne({ role: "system" });
  let systemPrompt: IPromptFields = {
    role: "system",
    content: systemPromptFromDB
      ? systemPromptFromDB.content
      : env.openai.defaultPrompt.content,
  };

  const resp = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      systemPrompt,
      ...context.user.requests.slice(0, 3).map((i: IPromptFields) => {
        console.log(i.role);
        return { role: i.role, content: i.content };
      }),
      {
        role: "user",
        content: request,
      },
    ],
  });

  context.send(resp.data.choices[0].message?.content || "Неизвестная ошибка");
  return await data.user.updateOne(
    {
      userID: context.senderId,
    },
    {
      $push: {
        requests: [
          {
            role: "user",
            content: request,
            wasSendAt: new Date(),
          },
          {
            role: "assistant",
            content:
              resp.data.choices[0].message?.content || "Неизвестная ошибка",
            wasSendAt: new Date(),
          },
        ],
      },
      $inc: {
        total: 1,
      },
    }
  );
});

/**
 * TODO:
 * - [ ]  Dialogue without the "/ai" command for forwarded messages
 *        in chats, as well as free discussion with the user in private messages
 */
// hearManager.onFallback((context) => context.send("command not found."));

/**
 * TODO:
 * - [ ] Replies to messages in the channel in the comments
 */
telegram.updates.on("channel_post", async (context) => {
  if (context.chat.id != -1001734030085) {
    return;
  }
  let chats = await data.chat.find({});

  chats.forEach((chat) => {
    if (chat.mailing) {
      telegram.api.forwardMessage({
        chat_id: chat.chatID,
        from_chat_id: context.chat.id,
        message_id: context.id,
      });

      telegram.api.sendMessage({
        chat_id: chat.chatID,
        text: "👆👆👆\nНовый пост в твоем любимом телеграмм канале \n\n(Всегда можете отписаться через /off)",
      });
    }
  });
});

telegram.updates
  .startPolling()
  .then(() => {
    console.info(`[@${telegram.bot.username}] Started polling`);
    telegram.api.setMyCommands({
      commands: env.listOfCommands,
    });
  })
  .catch(console.error);

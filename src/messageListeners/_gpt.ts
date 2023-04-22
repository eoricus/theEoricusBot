import env from "../../env.json";

import IExtraCtx from "../types/IExtraCtx";
import IPrompt from "../types/IPrompt";

import { HearManager } from "@puregram/hear";
import { Context, InlineKeyboard, Telegram } from "puregram";

import { Configuration, OpenAIApi } from "openai";
import { IConv, IConvFields } from "../types/IConv";
import data from "../data";

const openai = new OpenAIApi(
  new Configuration({
    apiKey: env.openai.token,
  })
);

export enum GPTMode {
  eoricus = "eoricus",
  linux = "linux",
  coder = "coder",
  assistant = "assistant",
}

export const ask = async (
  mode: GPTMode,
  messages: IPrompt[]
): Promise<{ title: string; answer: string; isError?: boolean }> => {
  let systemPrompt =
    mode === "eoricus"
      ? [...env.mode.eoricus.prompt]
      : mode === "linux"
      ? [...env.mode.linux.prompt]
      : mode === "coder"
      ? [...env.mode.coder.prompt]
      : mode === "assistant"
      ? [...env.mode.assistant.prompt]
      : [];

  let response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      ...(systemPrompt as IPrompt[]),
      {
        role: "user",
        content:
          'Format answer only like JSON, with "answer" and "title" fields. "Answer" is your answer, "title" is short (1-3 words) summarize all previous chat with user (in russian)',
      },
      ...messages,
    ],
  });

  try {
    return JSON.parse(response.data.choices[0].message?.content || "");
  } catch (error) {
    return {
      title: "",
      answer: response.data.choices[0].message?.content || "",
      isError: true,
    };
  }
};

const regexFor = {
  new: /^(\/)?new\s*(?<mode>(eoricus|linux|coder|assistant))?\s*(?<request>.*)/i,
  mode: /^(\/)?mode\s*(?<mode>(eoricus|linux|coder|assistant))\s*(?<request>.*)/i,
  ai: /^(\/)?ai\s*(?<request>.*)/i,
  to: /^(\/)?to\s*(?<conv>.*)/i,
  clear: /^(\/)?clear\s*(?<conv>.*)/i,
};

/**
 * An array of messages in the right format for the GPT from
 * user request in message, or replied messages
 *
 * @param match
 * @param context
 * @returns
 */
const getMessages = (match: { request?: string }, context: IExtraCtx) => {
  return [
    ...(match.request
      ? [{ role: "user", content: match.request } as IPrompt]
      : []),
    ...(context.replyMessage?.text
      ? [{ role: "user", content: context.replyMessage.text } as IPrompt]
      : []),
  ];
};

const checkTimeout = (context: IExtraCtx): boolean => {
  return !(
    (context.user.wasSentLastRequest?.getTime() ?? 0) - new Date().getTime() <=
    86400
  );
};

export default (manager: HearManager<IExtraCtx>, logger: Telegram) => {
  /**
   * Start new conversation
   */
  manager.hear(/^(\/)?new/i, async (context: IExtraCtx) => {
    if (checkTimeout(context)) {
      return context.reply(env.default.ai.errorTooManyRequest);
    }

    /**
     * User-specified parameters
     * @param {GPTMode|undefined} mode
     * @param {string|undefined} request
     */
    let match: {
      mode?: GPTMode;
      request?: string;
    } = context.text?.match(regexFor.new)?.groups || {};

    /**
     * Base doc of conversation.
     *
     * Messages and title will change, if match.request
     * or replied message are available
     */
    let conv: IConv = await data.conv.create({
      userID: context.senderId || context.chatId,
      title: "__new__",
      mode: match.mode || GPTMode.eoricus,
      messages: [],
    });

    /**
     * Array of user reauest or text from replied messages
     */
    let messages = getMessages(match, context);

    context.reply(`Запущен новый диалог в режиме ${conv.mode}`);

    if (messages.length) {
      /**
       * Object with fields, which contain chatGPT respone
       *
       * @param {string} title -- string formed by a request to give out a title
       * @param {string} answer -- chatGPT answer or error message
       * @param {boolean|undefined} isError -- if GPT answer isnt able to parse as a JSON
       */
      let respFromGPT = await ask(
        <GPTMode>match.mode || GPTMode.eoricus,
        messages
      );

      if (respFromGPT.isError) {
        logger.api.sendMessage({
          text: `Ошибка! Запрос: <code>${context}</code>\n\n\n\n<code>${respFromGPT.answer}</code>`,
          chat_id: env.tg.moderID,
        });

        return context.reply(
          "Неизвестная ошибка на стороне бота. Разработчик уже информирован"
        );
      }

      conv.title = respFromGPT.title;

      conv.messages = messages;
      conv.messages.push({
        role: "assistant",
        content: respFromGPT.answer,
      });

      context.reply(respFromGPT.answer);
    }

    conv.save();

    await data.user.updateOne(
      {
        userID: conv.userID,
      },
      {
        $set: {
          actualConversation: conv._id,
          wasSentLastRequest: new Date(),
        },
        $push: {
          conversations: conv._id,
        },
      },
      {}
    );
  });

  /**
   * Change conversation mode
   */
  manager.hear(/^(\/)?mode/i, async (context: IExtraCtx) => {
    if (checkTimeout(context)) {
      return context.reply(env.default.ai.errorTooManyRequest);
    }

    /**
     * User-specified parameters
     * @param {GPTMode|undefined} mode
     * @param {string|undefined} request
     */
    let match: {
      mode?: GPTMode;
      request?: string;
    } = context.text?.match(regexFor.mode)?.groups || {};

    if (!match.mode) {
      return context.reply(
        "Режим не найден :(\nНа данный момент доступны следующие режимы: assistant (базовый), eoricus (мой стиль), linux (консоль), coder (помощник в написании кода)"
      );
    }

    /**
     * User conversation doc, if conv was started
     * or default fields
     */
    let conv: IConv =
      context.conv ||
      (await data.conv.create({
        userID: context.senderId || context.chatId,
        title: "__new__",
        mode: "",
        messages: [],
      }));

    conv.mode = match.mode || GPTMode.eoricus;
    /**
     * Array of user reauest or text from replied messages
     */
    let messages = getMessages(match, context);

    context.reply(`Режим диалога изменен на ${conv.mode}`);

    if (messages.length) {
      /**
       * Object with fields, which contain chatGPT respone
       *
       * @param {string} title -- string formed by a request to give out a title
       * @param {string} answer -- chatGPT answer or error message
       * @param {boolean|undefined} isError -- if GPT answer isnt able to parse as a JSON
       */
      let respFromGPT = await ask(<GPTMode>conv.mode, messages);

      if (respFromGPT.isError) {
        logger.api.sendMessage({
          text: `Ошибка! Запрос: <code>${context}</code>\n\n\n\n<code>${respFromGPT.answer}</code>`,
          chat_id: env.tg.moderID,
        });

        return context.reply(
          "Неизвестная ошибка на стороне бота. Разработчик уже информирован"
        );
      }

      conv.title = respFromGPT.title;

      conv.messages = messages;
      conv.messages.push({
        role: "assistant",
        content: respFromGPT.answer,
      });

      context.reply(respFromGPT.answer);
    }

    conv.save();

    await data.user.updateOne(
      { userID: conv.userID },
      {
        $set: {
          actualConversation: conv._id,
          wasSentLastRequest: new Date(),
        },
        $addToSet: {
          conversations: conv._id,
        },
      },
      {}
    );
  });

  /**
   * Talk with AI
   */
  manager.hear(/^(\/)?ai/i, async (context: IExtraCtx) => {
    if (checkTimeout(context)) {
      return context.reply(env.default.ai.errorTooManyRequest);
    }

    /**
     * User-specified parameters
     * @param {string|undefined} request
     */
    let match: {
      request?: string;
    } = context.text?.match(regexFor.ai)?.groups || {};

    /**
     * Array of user reauest or text from replied messages
     */
    let messages = getMessages(match, context);

    if (!match.request) {
      return context.reply(env.default.ai.errorRequestIsEmpty);
    }

    /**
     * User conversation doc, if conv was started
     * or default fields
     */
    let conv: IConv =
      context.conv ||
      (await data.conv.create({
        userID: context.senderId || context.chatId,
        title: "__new__",
        mode: GPTMode.eoricus,
        messages: [],
      }));

    /**
     * Object with fields, which contain chatGPT respone
     *
     * @param {string} title -- string formed by a request to give out a title
     * @param {string} answer -- chatGPT answer or error message
     * @param {boolean|undefined} isError -- if GPT answer isnt able to parse as a JSON
     */
    let respFromGPT = await ask(<GPTMode>conv.mode, messages);

    if (respFromGPT.isError) {
      logger.api.sendMessage({
        text: `Ошибка! Запрос: <code>${context}</code>\n\n\n\n<code>${respFromGPT.answer}</code>`,
        chat_id: env.tg.moderID,
      });

      return context.reply(
        "Неизвестная ошибка на стороне бота. Разработчик уже информирован"
      );
    }

    conv.title = respFromGPT.title;

    conv.messages = messages;
    conv.messages.push({
      role: "assistant",
      content: respFromGPT.answer,
    });

    context.reply(respFromGPT.answer);

    conv.save();
    await data.user.updateOne(
      {
        userID: conv.userID,
      },
      {
        $set: {
          actualConversation: conv._id,
          wasSentLastRequest: new Date(),
        },
        $push: {
          conversations: conv._id,
        },
      },
      {}
    );
  });

  /**
   * Change actual conversation to another
   *
   * NOTE: In a better world, I believe that the implementation
   * of the transition interface should be made easier, but so far so good.
   */
  manager.hear(/^(\/)?to/i, async (context: IExtraCtx) => {
    /**
     * User-specified parameters
     * @param {string|undefined} conv
     */
    let match: {
      conv?: string;
    } = context.text?.match(regexFor.to)?.groups || {};

    if (!context.user.conversations || context.user.conversations.length <= 1) {
      return context.reply(
        "Эээ... Кореш, у тебя пока нет диалога. Просто напиши мне, или если хочешь указать стиль -- напиши /new <mode> и свой запрос!"
      );
    }

    if (!match.conv) {
      let key = async () => {
        let convs = await data.conv.find({
          userID: context.senderId,
          isDeleted: false,
        });

        return convs.map((conv, i) => {
          return [
            InlineKeyboard.textButton({
              text: conv.title,
              payload: JSON.stringify({
                command: "to",
                id: conv._id,
                num: i,
              }),
            }),
          ];
        });
      };

      return context.reply("Выберите диалог, к которому хотите перейти: ", {
        reply_markup: InlineKeyboard.keyboard(await key()),
      });
    }

    let conv = await data.conv.findOne({
      userID: context.senderId,
      title: match,
      isDeleted: false,
    });

    if (conv) {
      context.user.actualConversation = conv._id;
      return context.reply(`Вы переключились к диалогу <<${conv.title}>>!`);
    }

    return context.reply("Диалог не найден :( \n\n Выберите диалог из списка", {
      reply_markup: InlineKeyboard.keyboard(
        await (async () => {
          let convs = await data.conv.find({
            userID: context.senderId,
            isDeleted: false,
          });

          return convs.map((conv, i) => {
            return InlineKeyboard.textButton({
              text: conv.title,
              payload: {
                command: "to",
                id: conv._id,
                num: i,
              },
            });
          });
        })()
      ),
    });
  });

  /**
   * Clear conversation
   */
  manager.hear(/^(\/)?clear/i, async (context: IExtraCtx) => {
    /**
     * User-specified parameters
     * @param {string|undefined} conv
     */
    let match: {
      conv?: string;
    } = context.text?.match(regexFor.to)?.groups || {};

    if (!context.user.conversations) {
      return context.reply("Эээ... Кореш, у тебя и так нет диалогов со мной)");
    }

    if (context.user.conversations.length == 1) {
      await data.user.findByIdAndUpdate(context.user._id, {
        $pull: {
          conversations: context.user.actualConversation,
        },
        $set: {
          actualConversation: "",
        },
      });
      await data.conv.findByIdAndUpdate(context.conv?._id, {
        $set: {
          isDeleted: true,
        },
      });
      return context.reply("Чат почищен!");
    }

    if (!match.conv) {
      let convs = await data.conv.find({
        _id: context.user.conversations,
        isDeleted: false,
      });

      let key = async () => {
        return convs.map((conv, i) => {
          return [
            InlineKeyboard.textButton({
              text: conv.title,
              payload: JSON.stringify({
                command: "clear",
                id: conv._id,
                num: i,
              }),
            }),
          ];
        });
      };
      // console.log(convs.leng)
      if (convs.length != 0) {
        return context.reply("Выберите диалог, который хотите удалить: ", {
          reply_markup: InlineKeyboard.keyboard(await key()),
        });
      }
    }

    let conv = await data.conv.findOneAndUpdate(
      {
        userID: context.senderId,
        title: match.conv,
      },
      {
        $set: {
          isDeleted: true,
        },
      }
    );

    if (conv) {
      if (context.user.actualConversation == conv._id) {
        await data.user.findByIdAndUpdate(context.user._id, {
          $pull: {
            conversations: conv._id,
          },
          $set: {
            actualConversation: "",
          },
        });
      }
      return context.reply(`Диалог <<${conv.title}>> почищен!`);
    }
  });

  manager.onFallback((context: IExtraCtx) =>
    context.send("command not found.")
  );
};

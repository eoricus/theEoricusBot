import env from "../../../env.json";
import data from "../../data";
import { IConv } from "../../types/IConv";

import IExtraCtx from "../../types/IExtraCtx";
import { GPTMode, ask, checkTimeout, getMessages } from "./utils";

async function commandMode(context: IExtraCtx) {
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
  } =
    context.text?.match(
      /^(\/)?mode\s*(?<mode>(eoricus|linux|coder|assistant))\s*(?<request>.*)/i
    )?.groups || {};

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
      // logger.api.sendMessage({
      //   text: `Ошибка! Запрос: <code>${context}</code>\n\n\n\n<code>${respFromGPT.answer}</code>`,
      //   chat_id: env.tg.moderID,
      // });

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
}

export default commandMode;

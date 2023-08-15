import env from "../../../../env.json";
import data from "../../../data";
import { IConv } from "../../../types/IConv";

import IExtraCtx from "../../../types/IExtraCtx";
import { GPTMode, ask, checkTimeout, getMessages } from "./utils";

async function commandAI(ctx: IExtraCtx) {
  if (checkTimeout(ctx)) {
    return ctx.reply(env.default.ai.errorTooManyRequest);
  }

  ctx.sendChatAction("typing");
  /**
   * User-specified parameters
   * @param {string|undefined} request
   */
  let match: {
    request?: string;
  } = ctx.text?.match(/^((\/)?ai\s*)?(?<request>.*)/i)?.groups || {};

  /**
   * Array of user reauest or text from replied messages
   */
  let messages = getMessages(match, ctx);

  if (!match.request) {
    return ctx.reply(env.default.ai.errorRequestIsEmpty);
  }

  /**
   * User conversation doc, if conv was started
   * or default fields
   */
  let conv: IConv =
    ctx.conv ||
    (await data.conv.create({
      userID: ctx.senderId || ctx.chatId,
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

  if (respFromGPT.isError && (!conv.title || conv.title == "__new__")) {
    return ctx.reply(
      "Неизвестная ошибка на стороне бота. Разработчик уже информирован"
    );
  }

  conv.title = respFromGPT.title ? respFromGPT.title : conv.title;

  conv.messages = messages;
  conv.messages.push({
    role: "assistant",
    content: respFromGPT.answer,
  });

  ctx.reply(respFromGPT.answer);

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
      $addToSet: {
        conversations: conv._id,
      },
    },
    {}
  );
}

export default commandAI;

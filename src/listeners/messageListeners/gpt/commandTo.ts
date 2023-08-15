import { InlineKeyboard } from "puregram";
import data from "../../../data";

import IExtraCtx from "../../../types/IExtraCtx";

/**
 * Переход к другому диалогу
 * @param context 
 * @returns 
 */
async function commandTo(context: IExtraCtx) {
  /**
   * User-specified parameters
   * @param {string|undefined} conv
   */
  let match: {
    conv?: string;
  } = context.text?.match(/^(\/)?to\s*(?<conv>.*)/i)?.groups || {};

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
            text: `${conv.title} (${conv.mode})`,
            payload: {
              command: "to",
              id: conv._id,
              // num: i, TODO: remember why I add it
            },
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
            text: `${conv.title} (${conv.mode})`,
            payload: {
              command: "to",
              id: conv._id,
              // num: i, TODO: remember why I add it
            },
          });
        });
      })()
    ),
  });
}

export default commandTo;

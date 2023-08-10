import { InlineKeyboard } from "puregram";
import data from "../../data";

import IExtraCtx from "../../types/IExtraCtx";

async function commandClear(context: IExtraCtx) {
  /**
   * User-specified parameters
   * @param {string|undefined} conv
   */
  let match: {
    conv?: string;
  } = context.text?.match(/^(\/)?to\s*(?<conv>.*)/i)?.groups || {};

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
}

export default commandClear;

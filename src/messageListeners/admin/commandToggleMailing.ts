import IExtraCtx from "../../types/IExtraCtx";
import data from "../../data";

/**
 * toggleMailing
 *
 * Toggles mailing from the @theEoricus channel on or off
 */
export const toggleMailing = async (context: IExtraCtx, turnOn: boolean) => {
  if (context.isPM()) {
    return context.reply(
      "Рассылки работают только в групповых чатах.\nЗачем вам рассылка? Вы можете просто подписаться!\n\n@eoricus"
    );
  }

  let chat = await data.chat.findOneAndUpdate(
    { chatID: context.chatId },
    {
      $set: {
        mailing: turnOn,
      },
    }
  );

  context.send(
    chat?.mailing === turnOn
      ? `Рассылка уже ${turnOn ? "включена" : "отключена"}, вы уже ${
          turnOn ? "получаете" : "не получаете"
        } посты от лучшего телеграмм канала во вселенной`
      : `Рассылка ${turnOn ? "включена" : "отключена"}! Теперь вы ${
          turnOn ? "будете" : "не будете"
        } получать посты от лучшего телеграмм канала во вселенной`,
    { parse_mode: "HTML" }
  );
};

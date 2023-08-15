import IExtraCtx from "../../../types/IExtraCtx";
import data from "../../../data";
import env from "../../../../env.json";

/**
 * toggleMailing
 *
 * Toggles mailing from the @theEoricus channel on or off
 */
async function toggleMailing(context: IExtraCtx, turnOn: boolean) {
  if (context.isPM())
    return context.reply(
      "Рассылки работают только в групповых чатах.\nЗачем вам рассылка? Вы можете просто подписаться!\n\n@eoricus"
    );

  context.send(
    context.chatData.mailing === turnOn
      ? `Рассылка уже ${turnOn ? "включена" : "отключена"}, вы уже ${
          turnOn ? "получаете" : "не получаете"
        } посты от лучшего телеграмм канала во вселенной`
      : `Рассылка ${turnOn ? "включена" : "отключена"}! Теперь вы ${
          turnOn ? "будете" : "не будете"
        } получать посты от лучшего телеграмм канала во вселенной`,
    { parse_mode: "HTML" }
  );

  context.chatData.mailing = turnOn;
  return await context.chatData.save();
}

const toggleMailingOn = (context: IExtraCtx) => {
  toggleMailing(context, true);
};
const toggleMailingOff = (context: IExtraCtx) => {
  toggleMailing(context, false);
};

export { toggleMailingOn, toggleMailingOff };

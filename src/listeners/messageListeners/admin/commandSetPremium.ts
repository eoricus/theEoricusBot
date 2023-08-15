import IExtraCtx from "../../../types/IExtraCtx";
import data from "../../../data";
import env from "../../../../env.json";

async function togglePremiumStatus(context: IExtraCtx, status: boolean) {
  /**
   * If the message is a reply, then premium status
   * is assigned to the user whose message is replied to.
   
   * Otherwise the identifier entered by the user in the message body is used
   */
  let userID = context.hasReplyMessage()
    ? context.replyMessage.from?.id
    : context.text?.match(/^(\/)?(un)?setPremium\s*@?(?<userID>.*)/i)?.groups
        ?.userID;

  if (!userID) {
    return context.reply(env.default.setPremium.errorIncorrectUserID);
  }

  /**
   * The document of the user to whom premium status is assigned.
   * If the document is not found, then a message is sent that the user is not found
   */
  let premiumUser = await data.user.findOneAndUpdate(
    !isNaN(Number(userID)) ? { userID: userID } : { username: userID },
    {
      $set: {
        isPremium: status,
        premiumWasActivated: status ? new Date() : undefined,
      },
    },
    { new: true }
  );

  if (premiumUser) {
    return context.reply(
      status
        ? `Теперь ${premiumUser.username} может делать неограниченное количество запросов!`
        : `Теперь ${premiumUser.username} больше не имеет статуса премиум :(\n\n Количество запросов вновь ограничено`
    );
  } else {
    return context.reply(env.default.setPremium.errorUnfoundedUser);
  }
}

const setPremium = (context: IExtraCtx) => {
  togglePremiumStatus(context, true);
};
const unSetPremium = (context: IExtraCtx) => {
  togglePremiumStatus(context, false);
};

export { setPremium, unSetPremium };

// import { HearManager } from "@puregram/hear";
// import IExtraCtx from "../types/IExtraCtx";

// import data from "../data";

// import env from "../../env.json";
// import { Telegram } from "puregram";

// export default (manager: HearManager<IExtraCtx>, logger: Telegram) => {
//   /**
//    * 
//    */
//   manager.hear(
//     { text: /^(\/)?setPremium/i, senderId: env.tg.adminIDs },
//     async (context: IExtraCtx) => {
//       /**
//        * If the message is a reply, then premium status
//        * is assigned to the user whose message is replied to.
//        *
//        * Otherwise the identifier entered by the user in the message body is used
//        */
//       let userID = context.hasReplyMessage()
//         ? context.replyMessage.from?.id
//         : context.text?.match(/^(\/)?setPremium\s*@?(?<userID>.*)/i)?.groups
//             ?.userID;

//       if (!userID) {
//         return context.reply(env.default.setPremium.errorIncorrectUserID);
//       }

//       /**
//        * The document of the user to whom premium status is assigned.
//        * If the document is not found, then a message is sent that the user is not found
//        */
//       let premiumUser = await data.user.findOneAndUpdate(
//         !isNaN(Number(userID)) ? { userID: userID } : { username: userID },
//         {
//           $set: {
//             isPremium: true,
//             premiumWasActivated: new Date(),
//           },
//         },
//         { new: true }
//       );

//       if (premiumUser) {
//         return context.reply(
//           `Теперь ${premiumUser.username} может делать неограниченное количество запросов!`
//         );
//       } else {
//         return context.reply(env.default.setPremium.errorUnfoundedUser);
//       }
//     }
//   );
// };

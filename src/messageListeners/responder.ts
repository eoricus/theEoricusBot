import { HearManager } from "@puregram/hear";
import IExtraCtx from "../types/IExtraCtx";

// /**
//  * TODO:
//  * - [ ] Replies to messages in the channel in the comments
//  */
// bot.updates.on("channel_post", async (context) => {
//   console.log(context);
//   if (context.chat.username != env.tg.chatID) {
//     return;
//   }
//   let chats = await data.chat.find({});

//   chats.forEach((chat) => {
//     if (chat.mailing) {
//       bot.api.forwardMessage({
//         chat_id: chat.chatID,
//         from_chat_id: context.chat.id,
//         message_id: context.id,
//       });

//       bot.api.sendMessage({
//         chat_id: chat.chatID,
//         text: "👆👆👆\nНовый пост в твоем любимом телеграмм канале \n\n(Всегда можете отписаться через /off)",
//       });
//     }
//   });

//   if (context.text) {
//     const resp = await ask(GPTMode.eoricus, [
//       { role: "user", content: context.text },
//     ]);
//   }

//   // TODO generate answer on posts

//   // const resp = await openai.createChatCompletion({
//   //   model: "gpt-3.5-turbo",
//   //   // @ts-ignore
//   //   messages: [
//   //     ...env.mode.eoricus.prompt,

//   //   ],
//   // });

//   // telegram.api.sendMessage({
//   //   chat_id: env.tg.chatID,
//   //   text: ""
//   // })
// });

export default (manager: HearManager<IExtraCtx>) => {
  manager.hear(
    { "chat.username": "theEoricusChat", "from.username": "Channel_Bot" },
    (context: IExtraCtx) => {
      context.reply(
        "<code>hello, world!</code>\n\nЯ чат-бот, созданный @eoricus. Вот что я умею:\n<code>/start</code> -- приветственное сообщение\n<code>/help</code> -- список команд (то, что вы сейчас видите)\n<code>/ai (запрос) </code> -- на ваш вопрос ответит искусственный интеллект с моим разумом (не больше 20 запросов от юзера в день)\n<code>/on или /off</code> -- активация или отмена подписки",
        { parse_mode: "HTML" }
      );
    }
  );
};

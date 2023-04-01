import "paint-console";

// Load environment variables from .env file
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../.env" });

// Default answers
import answers from "./answers";

// DataBase
import data from "./data";

import posts from "./posts.json";

import { Telegram, MessageContext, InlineKeyboard } from "puregram";
import { HearManager } from "@puregram/hear";

const telegram = Telegram.fromToken(process.env.TG_TOKEN as string);

const hearManager = new HearManager<MessageContext & ExtraData>();

import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

interface ExtraData {
  IsUserRegistered: boolean;
  lastRequests: { text: string; wasSendAt: Date; answer: string }[];
}

telegram.updates.on(
  "message",
  async (context: MessageContext & ExtraData, next) => {
    let user = await data.user.findOne({ userID: context.senderId });

    if (user) {
      context.IsUserRegistered = true;
      context.lastRequests = user.requests;
    } else {
      user = await data.user.create({
        userID: context.senderId,
        isPremium: false,
        requests: [],
      });
      context.IsUserRegistered = false;
      context.lastRequests = user.requests;
    }

    console.log(context.lastRequests);
    return next();
  }
);
telegram.updates.on("message", hearManager.middleware);

hearManager.hear(/start/i, async (context: MessageContext & ExtraData) => {
  context.send(
    `
<code>hello, world!</code>\n\n\
Я чат-бот, созданный @eoricus. Вот что я умею:\n\
<code>/start</code> -- приветственное сообщение\n\
<code>/help</code> -- список команд (то, что вы сейчас видите)\n\
<code>/ai (запрос) </code> -- на ваш вопрос ответит искусственный интеллект с моим разумом (не больше 20 запросов от юзера в день)\n\
<code>/on или /off</code> -- активация или отмена подписки
`,
    { parse_mode: "HTML" }
  );
});

hearManager.hear(/help/i, (context: MessageContext & ExtraData) =>
  context.send(
    `
    Вот что я умею:\n\
<code>/start</code> -- приветственное сообщение\n\
<code>/help</code> -- список команд (то, что вы сейчас видите)\n\
<code>/ai (запрос) </code> -- на ваш вопрос ответит искусственный интеллект с моим разумом (не больше 20 запросов от юзера в день)\n\
<code>/on или /off</code> -- активация или отмена рассылки
`,
    { parse_mode: "HTML" }
  )
);

// hearManager.hear(/delay/i, (context: MessageContext & ExtraData) =>
//   context.send("dw", { parse_mode: "HTML" })
// );

hearManager.hear(/on/i, async (context: MessageContext & ExtraData) => {
  if (!context.isPM()) {
    let chat = await data.chat.findOneAndUpdate(
      { chatID: context.chatId },
      {
        $set: {
          mailing: true,
        },
      }
    );
    if (!chat) {
      chat = await data.chat.create({
        chatID: context.chatId,
        isPremium: false,
        requests: [],
        delay: 40,
        offset: 0,
        mailing: true,
      });
    }

    context.send(
      chat?.mailing
        ? "Рассылка уже включена, вы уже получаете посты от лучшего телеграмм канала во вселенной"
        : "Рассылка включена! Теперь вы будете получать посты от лучшего телеграмм канала во вселенной",
      { parse_mode: "HTML" }
    );
  } else {
    context.send(
      "Рассылки работают только в групповых чатах. Зачем вам рассылка? Вы можете просто подписаться!\n\n@eoricus"
    );
  }
});

hearManager.hear(/off/i, async (context: MessageContext & ExtraData) => {
  if (!context.isPM()) {
    let chat = await data.chat.findOneAndUpdate(
      { chatID: context.chatId },
      {
        $set: {
          mailing: false,
        },
      }
    );

    if (!chat) {
      chat = await data.chat.create({
        chatID: context.chatId,
        isPremium: false,
        requests: [],
        delay: 40,
        offset: 0,
        mailing: false,
      });
    }

    context.send(
      !chat?.mailing
        ? "Рассылка уже отключена, вы и так лишены постов от лучшего телеграмм канала во вселенной"
        : "Рассылка отключена! Теперь вы не будете получать посты от лучшего телеграмм канала во вселенной",
      { parse_mode: "HTML" }
    );
    console.log(chat);
  } else {
    context.send(
      "Рассылки работают только в групповых чатах. Зачем вам рассылка? Вы можете просто подписаться!\n\n@eoricus"
    );
  }
});

hearManager.hear(/ai(.*)/i, async (context: MessageContext & ExtraData) => {
  let prompt = context.text?.match(/ai(?<Prompt>.*)/i)?.groups?.Prompt;
  let user = await data.user.findOne({
    userID: context.senderId,
  });

  if (!user) {
    return context.send(
      "Эээ... Тут технические шоколадки кореш, я пока не работаю с тобой"
    );
  }

  if (prompt) {
    if (user.requests.length >= 10) {
      console.log(user.requests[0].wasSendAt.getTime() - new Date().getTime());
      if (
        user.requests[0].wasSendAt.getTime() - new Date().getTime() <=
        86400
      ) {
        return context.send(
          "Эээ... Извини кореш, я не отвечаю больше чем на 10 запросов в сутки. Время деньги, сам понимаешь. Если хочешь неограниченный доступ -- пиши @theEoricus"
        );
      } else {
        data.user.updateOne(
          {
            userID: context.senderId,
          },
          {
            $set: {
              requests: [
                {
                  text: prompt,
                  wasSendAt: new Date(),
                },
              ],
            },
          }
        );
      }
    }

    const chat = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: posts.prompt + posts.posts.join(";\n\n"),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    context.send(chat.data.choices[0].message?.content || "Неизвестная ошибка");
    await data.user.updateOne(
      {
        userID: context.senderId,
      },
      {
        $push: {
          requests: {
            text: prompt,
            wasSendAt: new Date(),
          },
        },
        $inc: {
          total: 1,
        },
      }
    );
  } else {
    context.send(
      "Да-да, я загрузил себя в чатГПТ. Чтобы говорить со мной, отправь запрос после '/ai'"
    );
  }
});

hearManager.onFallback((context) => context.send("command not found."));

telegram.updates.on("channel_post", async (context) => {
  if (context.chat.id != -1001734030085) {
    return;
  }
  let chats = await data.chat.find({});

  chats.forEach((chat) => {
    if (chat.mailing) {
      telegram.api.forwardMessage({
        chat_id: chat.chatID,
        from_chat_id: context.chat.id,
        message_id: context.id,
      });

      telegram.api.sendMessage({
        chat_id: chat.chatID,
        text: "👆👆👆\nНовый пост в твоем любимом телеграмм канале \n\n(Всегда можете отписаться через /off)",
      });
    }
  });
});

telegram.updates
  .startPolling()
  .then(() => {
    console.info(`[@${telegram.bot.username}] Started polling`);
    telegram.api.setMyCommands({
      commands: [
        {
          command: "/start",
          description: "Начать",
        },
        {
          command: "/help",
          description: "Список команд",
        },
        {
          command: "/ai",
          description: "Ответы от ИИ в моем стиле",
        },
        {
          command: "/on",
          description: "Подписка на рассылку",
        },
        {
          command: "/off",
          description: "Отмена рассылки",
        },
      ],
    });
  })
  .catch(console.error);

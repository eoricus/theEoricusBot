import IExtraCtx from "../../types/IExtraCtx";

import { HearManager } from "@puregram/hear";
import { Telegram } from "puregram";

import commandAI from "./commandAI";
import commandClear from "./commandClear";
import commandMode from "./commandMode";
import commandNew from "./commandNew";
import commandTo from "./commandTo";

export default (manager: HearManager<IExtraCtx>) => {
  manager.hear(/^(\/)?new/i, commandNew);
  manager.hear(/^(\/)?mode/i, commandMode);
  manager.hear(/^(\/)?ai/i, commandAI);
  manager.hear(/^(\/)?to/i, commandTo);
  manager.hear(/^(\/)?clear/i, commandClear);
  // TODO:
  // [+] Сделать определение сообщений из канала (пересылок в чат)
  // [ ] Сделать режим ответов на эти сообщения (типо дополнение)
  // [ ] Сделать добавление новых постов в базу данных (возможно перенести в channel_post)
  manager.hear(
    (text, ctx: IExtraCtx) =>
      (ctx.isAutomaticForward() || false) &&
      ctx.chat.username === "theEoricusChat",
    commandAI
  );
  // TODO:
  // [-] Реализовать function-call-ы для основных команд
  // [ ] Хранить все сообщения из чатов, и формировать диалоги с юзерами по ним, а не через отдельную базу данных
  // manager.onFallback(commandAI);
};

import IExtraCtx from "../../../types/IExtraCtx";

import { HearManager } from "@puregram/hear";
import { Telegram } from "puregram";

import commandAI from "./commandAI";
import commandClear from "./commandClear";
import commandMode from "./commandMode";
import commandNew from "./commandNew";
import commandTo from "./commandTo";

// Это выглядит супер плохо. Непонятно, зачем юзеру каждый раз 
// переключаться между диалогами, а мне держать кучу кода для 
// inline-клавиатуры или отдельную таблицу в БД для диалогов с ботом.
// 
// TODO: 
// [ ]  Сделать команды для ГПТ нативными.
//    По сути дела, удалить все нынешние команды для общения с ботом, 
//    и вызывать команды через function-call-ы.  
//    - /new не имеет смысла, по-скольку каждое новое сообщение 
//      будет новым диалогом
//    - /mode будет использоваться для вызова бота с определенным промптом, 
//    - /ai не имеет смысла, все сообщения не содержащие команды будут 
//      обрабатываться ГПТ
//    - /to и /clear не имеют смысла, по скольку контекст теперь будет 
//      храниться в реплаях
// 
// [ ]  Переписать базу данных, хранить там все сообщения от пользователей 
//    Удалить из БД conv и chat, объединить их функционал в один, что-бы 
//    получать диалоги с ботом, рекрусивно получая все сообщения по реплаям.
// [ ]  Сделать один большой набор для function-call-ов из всех команд для бота
// 
// Думаю после этого можно будет сократить папку до одного файла))

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

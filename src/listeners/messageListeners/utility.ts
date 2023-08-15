import { HearManager } from "@puregram/hear";
import IExtraCtx from "../../types/IExtraCtx";

export default (manager: HearManager<IExtraCtx>) => {
  manager.hear(/^(\/)?start/i, (context: IExtraCtx) => {
    context.reply(
      "<code>hello, world!</code>\n\nЯ чат-бот, созданный @eoricus. Вот что я умею:\n<code>/start</code> -- приветственное сообщение\n<code>/help</code> -- список команд (то, что вы сейчас видите)\n<code>/ai (запрос) </code> -- на ваш вопрос ответит искусственный интеллект с моим разумом (не больше 20 запросов от юзера в день)\n<code>/on или /off</code> -- активация или отмена подписки",
      { parse_mode: "HTML" }
    );
  });

  manager.hear(/^(\/)?help/i, (context: IExtraCtx) => {
    context.reply(
      "Вот что я умею:\n<code>/start</code> -- приветственное сообщение\n<code>/help</code> -- список команд (то, что вы сейчас видите)\n<code>/ai (запрос) </code> -- на ваш вопрос ответит искусственный интеллект с моим разумом (не больше 20 запросов от юзера в день)\n<code>/on или /off</code> -- активация или отмена рассылки",
      { parse_mode: "HTML" }
    );
  });
};

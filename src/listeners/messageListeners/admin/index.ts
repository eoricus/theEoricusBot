import { HearManager } from "@puregram/hear";
import IExtraCtx from "../../../types/IExtraCtx";

import env from "../../../../env.json";

import { toggleMailingOn, toggleMailingOff } from "./commandToggleMailing";
import { setPremium, unSetPremium } from "./commandSetPremium";

/**
 * dev options for manually load posts
 * 1. Add ./posts.json (you can get messages from rss.app), following the posts.example.json
 * 2. Uncomment the code below
 */
// DEV-CODE TO UNCOMMENT 1:
import posts from "./posts.json";
import data from "../../../data";

export default (manager: HearManager<IExtraCtx>) => {
  manager.hear(
    { text: /^(\/)?setPremium/i, senderId: env.tg.adminIDs },
    setPremium
  );

  manager.hear(
    { text: /^(\/)?unsetPremium/i, senderId: env.tg.adminIDs },
    unSetPremium
  );

  // manager.hear({ text: /^(\/)?publish /i, senderId: env.tg.adminIDs }, publish);

  manager.hear(/^(\/)?on/i, toggleMailingOn);

  manager.hear(/^(\/)?off/i, toggleMailingOff);

  // DEV-CODE TO UNCOMMENT 2:
  manager.hear(/^(\/)?writeposts/i, async (ctx: IExtraCtx) => {
    let bulkOps = posts.feed.items.map((post) => {
      let title = post.title.match(/<b>(.*?)<\/b>/);

      return {
        updateOne: {
          filter: { id: post.id },
          update: {
            id: post.id,
            url: post.url,
            title: title && title.length > 2 ? title[1] : post.title,
            content: post.content_html,
            abridged: post.title,
            wasCreatedAt: post.date_published,
          },
          upsert: true,
        },
      };
    });

    let result = await data.post.bulkWrite(bulkOps);
    ctx.reply(
      `Успешно добавлено в базу данных:<code>
      - Добавлено: ${result.insertedCount};
      - Найдено: ${result.matchedCount};
      - Изменено: ${result.modifiedCount};
      - Удалено: ${result.deletedCount};
      - Обновлено: ${result.upsertedCount};</code>`.replace(/  +/g, ""),
      { parse_mode: "HTML" }
    );
  });
};

import { HearManager } from "@puregram/hear";
import IExtraCtx from "../../types/IExtraCtx";

import env from "../../../env.json";
import { Telegram } from "puregram";

import { toggleMailing } from "./toggleMailing";
import { setPremium } from "./setPremium";

export default (manager: HearManager<IExtraCtx>, logger: Telegram) => {
  manager.hear(
    { text: /^(\/)?setPremium/i, senderId: env.tg.adminIDs },
    setPremium
  );

  manager.hear(/^(\/)?on/i, async (context: IExtraCtx) => {
    await toggleMailing(context, true);
  });

  manager.hear(/^(\/)?off/i, async (context: IExtraCtx) => {
    await toggleMailing(context, false);
  });
};

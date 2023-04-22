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
};

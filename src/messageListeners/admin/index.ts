import { HearManager } from "@puregram/hear";
import IExtraCtx from "../../types/IExtraCtx";

import { Telegram } from "puregram";

import setPremium from "./setPremium";

export default (manager: HearManager<IExtraCtx>, logger: Telegram) => {
  [setPremium].forEach((command) => {
    manager.hear(command.trigger, command.handler);
  });
};

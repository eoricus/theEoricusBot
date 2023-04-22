import admin from "./admin";
import gpt from "./gpt";
import utility from "./utility";
import responder from "./responder";

import { HearManager } from "@puregram/hear";
import { Telegram } from "puregram";
import IExtraCtx from "../types/IExtraCtx";

const allRegisters = [admin, gpt, utility, responder];

export default function registerListeners (manager: HearManager<IExtraCtx>, logger: Telegram) {
  allRegisters.forEach((regiser) => {
    regiser(manager, logger);
  });
};

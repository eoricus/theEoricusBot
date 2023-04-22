import * as admin from "./admin";
import chat from "./_chat";
import gpt from "./_gpt";
import utility from "./_utility";
import responder from "./responder";

import { HearManager } from "@puregram/hear";
import { Telegram } from "puregram";
import IExtraCtx from "../types/IExtraCtx";

const allRegisters = [admin, chat, gpt, utility, responder];
admin
export default (manager: HearManager<IExtraCtx>, logger: Telegram) => {
  allRegisters.forEach((regiser) => {
    regiser(manager, logger);
  });
};

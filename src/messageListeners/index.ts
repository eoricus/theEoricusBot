import admin from "./admin";
import gpt from "./_gpt";
import utility from "./_utility";
import responder from "./responder";

import { HearManager } from "@puregram/hear";
import { Telegram } from "puregram";
import IExtraCtx from "../types/IExtraCtx";

const allRegisters = [admin, gpt, utility, responder];

export default (manager: HearManager<IExtraCtx>, logger: Telegram) => {
  allRegisters.forEach((regiser) => {
    regiser(manager, logger);
  });
};

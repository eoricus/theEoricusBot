import admin from "./admin";
import gpt from "./gpt";
import utility from "./utility";
import responder from "./responder";

import { HearManager } from "@puregram/hear";
import { Telegram } from "puregram";
import IExtraCtx from "../types/IExtraCtx";

export default [admin, gpt, utility, responder];

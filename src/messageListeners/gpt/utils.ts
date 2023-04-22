import env from "../../../env.json";

import IExtraCtx from "../../types/IExtraCtx";
import IPrompt from "../../types/IPrompt";

import { HearManager } from "@puregram/hear";
import { Context, InlineKeyboard, Telegram } from "puregram";

import { Configuration, OpenAIApi } from "openai";
import { IConv, IConvFields } from "../../types/IConv";
import data from "../../data";

/**
 * Represents the available GPT modes
 */
export enum GPTMode {
  eoricus = "eoricus",
  linux = "linux",
  coder = "coder",
  assistant = "assistant",
}

const openai = new OpenAIApi(new Configuration({ apiKey: env.openai.token }));

/**
 * Asks the GPT for a response given the mode and messages
 * @param {GPTMode} mode - The GPT mode to use
 * @param {IPrompt[]} messages - An array of messages to send to the GPT
 * @returns {Promise<{title: string, answer: string, isError?: boolean}>} - The GPT's response
 */
export async function ask(mode: GPTMode, messages: IPrompt[]) {
  const systemPrompt = env.mode[mode].prompt;

  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      // ...systemPrompt.map((prompt: string) => ({
      //   role: "system",
      //   content: prompt,
      // })),
      ...(systemPrompt as IPrompt[]),
      {
        role: "user",
        content:
          'Format answer only like JSON, with "answer" and "title" fields. "Answer" is your answer, "title" is short (1-3 words) summarize all previous chat with user (in russian)',
      },
      ...messages,
    ],
  });

  const message = response.data.choices[0].message?.content || "";
  const parsedMessage = JSON.parse(message);

  return {
    title: parsedMessage.title || "",
    answer: parsedMessage.answer || message,
    isError: !parsedMessage.answer && !parsedMessage.title,
  };
}

/**
 * Retrieves an array of messages in the right format for the GPT from
 * user request in message, or replied messages
 * @param {{request?: string}} match - The match object from a regex match
 * @param {CustomContext} context - The context object for the current chat session
 * @returns {IPrompt[]} - An array of messages
 */
export function getMessages(
  match: { request?: string },
  context: IExtraCtx
): IPrompt[] {
  return [
    ...(match.request
      ? [{ role: "user", content: match.request } as IPrompt]
      : []),
    ...(context.replyMessage?.text
      ? [{ role: "user", content: context.replyMessage.text } as IPrompt]
      : []),
  ];
}

/**
 * Checks the time since the last request to see if it's within the timeout period
 * @param {CustomContext} context - The context object for the current chat session
 * @returns {boolean} - Whether or not the timeout period has elapsed
 */
export function checkTimeout(context: IExtraCtx): boolean {
  const lastRequestTime = context.user.wasSentLastRequest?.getTime() || 0;
  return !(lastRequestTime - new Date().getTime() <= 86400);
}

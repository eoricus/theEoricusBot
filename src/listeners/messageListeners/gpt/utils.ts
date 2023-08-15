import env from "../../../../env.json";

import IExtraCtx from "../../../types/IExtraCtx";
import IPrompt from "../../../types/IPrompt";

import { Configuration, OpenAIApi } from "openai";

/**
 * Represents the available GPT modes
 */
export enum GPTMode {
  eoricus = "eoricus",
  linux = "linux",
  coder = "coder",
  assistant = "assistant",
}

const openai = new OpenAIApi(
  new Configuration({
    apiKey: env.openai.token,
    // if you use not original openai server
    // for example: github.com/Em1tSan/FreeGPT
    ...(env.openai.isHacked && { basePath: "http://127.0.0.1:1337" }),
  })
);

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
        role: "system",
        content:
          "Please provide answers strictly in JSON format, containing two fields: 'answer' and 'title'. The 'answer field should contain your response, while the 'title' field should consist of a 1-3 word summary of the user's previous chat in Russian.",
      },
      ...messages,
    ],
  });

  try {
    return JSON.parse(response.data.choices[0].message?.content || "");
  } catch (error) {
    return {
      title: null,
      answer: response.data.choices[0].message?.content || "",
      isError: true,
    };
  }
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

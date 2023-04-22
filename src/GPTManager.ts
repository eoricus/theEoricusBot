import { Configuration, OpenAIApi } from "openai";
import env from "../env.json";
import IPrompt from "./types/IPrompt";

export enum GPTMode {
  eoricus = "eoricus",
  linuxConsole = "linuxConsole",
  coder = "coder",
  assistant = "assistant",
}

export default class GPTManager {
  api: OpenAIApi;

  constructor(token: string) {
    this.api = new OpenAIApi(
      new Configuration({
        apiKey: token,
      })
    );
  }

  async ask(
    mode: GPTMode,
    messages: IPrompt[]
  ): Promise<{ title: string; answer: string; isError?: boolean }> {
    let systemPrompt =
      mode === "eoricus"
        ? [...env.mode.eoricus.prompt]
        : mode === "linuxConsole"
        ? [...env.mode.linuxConsole.prompt]
        : mode === "coder"
        ? [...env.mode.coder.prompt]
        : mode === "assistant"
        ? [...env.mode.assistant.prompt]
        : [];

    let response = await this.api.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        ...(systemPrompt as IPrompt[]),
        ...messages,
        {
          role: "user",
          content:
            'Format answer only like JSON, with "answer" and "title" fields. "Answer" is your answer, "title" is short (1-3 words) summarize all previous chat with user (in russian)',
        },
      ],
    });

    try {
      return JSON.parse(response.data.choices[0].message?.content || "");
    } catch (error) {
      return {
        title: "",
        answer: response.data.choices[0].message?.content || "",
        isError: true,
      };
    }
  }
}

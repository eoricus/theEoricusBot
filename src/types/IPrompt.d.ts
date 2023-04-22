export default interface IPrompt {
  role: "user" | "assistant" | "system";
  content: string;
}

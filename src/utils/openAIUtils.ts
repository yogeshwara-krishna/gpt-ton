import { Configuration, OpenAIApi } from "openai";

import { config } from "../config";
const configuration = new Configuration({
  apiKey: config.openAiApiKey,
});

const openai = new OpenAIApi(configuration);

export const queryGPT = async (message: string) => {
  const res = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });
  return res.data.choices[0].message?.content;
};

export const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

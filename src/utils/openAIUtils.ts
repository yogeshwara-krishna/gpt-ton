import { Configuration, OpenAIApi } from "openai";

import { config } from "../config";
const configuration = new Configuration({
  apiKey: config.openAiApiKey,
});

const openai = new OpenAIApi(configuration);

const callAPI = async (message: string) => {
  const res = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });
  return res.data.choices[0].message?.content;
};

export const queryGPT = async (message: string) => {
  // if there's an error, retry 3 times with 1 second delay
  for (let i = 0; i < 3; i++) {
    try {
      const res = await callAPI(message);
      return res;
    } catch (err) {
      console.log(err);
      console.log("Retrying...");
      await sleep(1000);
    }
  }
  return "error";
};

export const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

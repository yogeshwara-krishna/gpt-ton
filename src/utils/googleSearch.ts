import axios from "axios";
import { config } from "../config";
import { queryGPT } from "./openAIUtils";

const API_KEY = config.googleApiKey;
const SEARCH_ENGINE_ID = config.googleSearchEngineId;

const queryGoogle = async (searchTerm: string) => {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(
      searchTerm
    )}`;
    const res = await axios.get(url);
    const items = res.data.items;
    if (!items) {
      throw new Error("No items found");
    }
    return items;
  } catch (er) {
    console.log("Error in google search", er);
    return [];
  }
};

function consolidateResults(items: any[]) {
  const results = items.map((item) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
  }));
  // consolidate into a single string
  let consolidatedResponse = "";
  for(const result of results) {
    consolidatedResponse += `${result.title}: ${result.snippet}\n`;
  }
  // truncate to 1024 characters
  consolidatedResponse = consolidatedResponse.substring(0, 1024);

  return consolidatedResponse.toLocaleLowerCase();
}

const checkThroughGoogle = async (searchTerm: string, ctx?:any) => {
  const searchQuery = await queryGPT(`Create a query to search for in Google for checking "${searchTerm}". Just respond with the query. Nothing else.
  For example if the thing to check is "Is Elon Musk the CEO of Tesla?", then the query maybe "Elon Musk Tesla CEO" or "Elon Musk Tesla". Choose appropriately.`);
  if (!searchQuery) {
    ctx.reply("No response from GPT");
    return 3;
  }
  console.log("Searching for news articles with query: ", searchQuery);
  ctx.reply("Searching for news articles with query: " + searchQuery);
  const items = await queryGoogle(searchQuery);
  const consolidatedResponse = consolidateResults(items);
  const googleSearchSummary = await queryGPT(
    `Tell me if ${searchTerm} is currently true or false from the information given. If you are not sure or don't know, type NS i.e not sure. Also, tell why. Don't check for authenticity/announcement. 
    Your response should be in the following format: \n\nTrue/False/NS: Summary\n\n
    Information: \n\n${consolidatedResponse}\n\.`
  );
  ctx?.reply("Summary: " + googleSearchSummary);
  console.log("Summary:", googleSearchSummary);

  const result = googleSearchSummary?.toLowerCase();
  let resultNum = 3;
  if (result?.startsWith("true")) {
    resultNum = 1;
  } else if (result?.startsWith("false")) {
    resultNum = 2;
  } 
  return resultNum;
};

export { checkThroughGoogle };
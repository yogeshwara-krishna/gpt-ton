import axios from "axios";
import { config } from "../config";
import { queryGPT } from "./openAIUtils";

const API_KEY = config.googleApiKey;
const SEARCH_ENGINE_ID = config.googleSearchEngineId;

const queryGoogle = async (searchTerm: string) => {
  const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(
    searchTerm
  )}&num=20`;
  const res = await axios.get(url);
  const items = res.data.items;
  if (!items) {
    throw new Error("No items found");
  }
  return items;
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

const checkThroughGoogle = async (searchTerm: string) => {
  const items = await queryGoogle(searchTerm);
  const consolidatedResponse = consolidateResults(items);
  const result = await queryGPT(
    `Tell me if ${searchTerm} is currently true or false from the information given. If you are not sure or don't know, type NS i.e not sure. Also, tell why. Don't check for authenticity/announcement. Information: \n\n${consolidatedResponse}\n\.`
  );
  console.log("Summary:", result);
  let resultNum = 3;
  if (result?.startsWith("true")) {
    resultNum = 1;
  } else if (result?.startsWith("false")) {
    resultNum = 2;
  } 
  return resultNum;
};


export { checkThroughGoogle };
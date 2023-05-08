import axios from "axios";
import { queryGPT } from "./openAIUtils";
import { config } from "../config";
const newsApiApiKey = config.newsApiKey;

async function fetchNewsArticles(query: string): Promise<any> {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=${query}&apiKey=${newsApiApiKey}&pageSize=5`
    );
    return response.data.articles;
  } catch (error) {
    console.error("Error fetching news articles:", error);
    return "";
  }
}

async function consolidateNewsAPI(searchTerm: string): Promise<any> {
  const responseGPT =
    await queryGPT(`Create a query to search for in newsAPI for checking "${searchTerm}". Just respond with the query. Nothing else. 
  For example if the thing to check is "Is Elon Musk the CEO of Tesla?", then the query maybe "Elon Musk Tesla CEO" or "Elon Musk Tesla". Choose appropriately.`);

  if (!responseGPT) {
    throw "No response from GPT";
  }

  console.log("Searching for news articles with query: ", responseGPT);

  const newsArticles = await fetchNewsArticles(responseGPT);
  let consolidatedResponse = "";
  for (const article of newsArticles) {
    consolidatedResponse += article.title + ": " + article.description + "\n";
  }
  // truncate to 1024 characters
  return consolidatedResponse.substring(0, 1024).toLowerCase();
}

const checkThroughNewsAPI = async (searchTerm: string) => {
  const consolidatedResponse = await consolidateNewsAPI(searchTerm);
  const newsAPISummary = await queryGPT(
    `Tell me if ${searchTerm} is currently true or false from the information given. If you are not sure or don't know, type NS i.e not sure. Also, tell why. Don't check for authenticity/announcement. Information: \n\n${consolidatedResponse}\n\.`
  );
  console.log("Summary:", newsAPISummary);
  const result = newsAPISummary?.toLowerCase();
  let resultNum = 3
  if (result?.startsWith("true")) {
    resultNum = 1;
  } else if (result?.startsWith("false")) {
    resultNum = 2;
  }
  return resultNum;
};

// (async () => {
//   const args = process.argv.slice(2);
//   const searchTerm = args[0];

//   const newsArticles = await checkThroughNewsAPI(searchTerm);
//   // return the prototype of the newsArticles
//   console.log(newsArticles);

//   // console.log(newsArticles);
// })();

export { checkThroughNewsAPI };

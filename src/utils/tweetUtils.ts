import puppeteer, { Page } from "puppeteer";
import { scrollPageToBottom } from "puppeteer-autoscroll-down";
import cheerio from "cheerio";
import { queryGPT } from "./openAIUtils";
import { TwitterApi } from "twitter-api-v2";
import { config } from "../config";

const baseURL = "https://twitter.com/search?q=";

export async function fetchTweets(url: string, page: Page): Promise<string[]> {
  await page.goto(url + "&src=typed_query&f=top", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(
    "#react-root div.css-1dbjc4n.r-18u37iz > div.css-1dbjc4n.r-1iusvr4.r-16y2uox.r-1777fci.r-kzbkwu > div:nth-child(2)"
  );
  // scroll to bottom
  await scrollPageToBottom(page as any, {
    size: 500,
    delay: 250,
    stepsLimit: 10,
  });
  await page.waitForTimeout(3000);
  const content = await page.content();
  const $ = cheerio.load(content);
  const tweets: string[] = [];
  $(
    "#react-root div.css-1dbjc4n.r-18u37iz > div.css-1dbjc4n.r-1iusvr4.r-16y2uox.r-1777fci.r-kzbkwu > div:nth-child(2)"
  ).each((_, element) => {
    const tweetText = $(element).text();
    tweets.push(tweetText);
  });

  return tweets;
}

async function getResultThroughTweets(searchTerm: string, ctx: any, page: Page) {
  const searchQuery = await queryGPT(
    "Give a twitter search API query for finding the result of the following: " +
    searchTerm +
    ". The API request will be made via get('tweets/search/recent', { query: searchTerm });. Give only the searchTerm, nothing else and limit the number of words "
  );
  console.log("Search query:", searchQuery);
  const toSearch = searchQuery ? searchQuery : searchTerm;
  const tweets = await fetchTweetsAPI(toSearch);
  console.log("Fetched tweets:", tweets);
  const tweetSummary = await checkEvent(tweets, searchTerm);
  console.log("Summary:", tweetSummary);
  ctx?.reply("Summary: \n" + tweetSummary);
  // check if res starts with true or false or ns
  const result = tweetSummary?.split("\n")[0].toLowerCase();
  let resultNum = 3;
  if (result?.startsWith("true")) {
    resultNum = 1;
  } else if (result?.startsWith("false")) {
    resultNum = 2;
  }

  return resultNum;
}

async function fetchTweetsAPI(searchTerm: string) {
  try {
    const client = new TwitterApi({
      appKey: config.appKey,
      appSecret: config.appSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessTokenSecret,
    });
    const result = await client.v2.get('tweets/search/recent', { query: searchTerm, max_results: 30 });
    const tweets = [];
    for (const tweet of result.data) {
      tweets.push(tweet.text);
    }
    return tweets;
  } catch (err) {
    console.log(err);
    return [];
  }
}

async function checkEvent(
  tweets: string[],
  searchTerm: string
): Promise<string | undefined> {
  const allTweets = tweets.join("\n");
  const summary = await queryGPT(
    `Tell me if ${searchTerm} is currently true or false from the information given. If you are not sure, type NS i.e not sure. 
    Your response should be in the following format: \n\nTrue/False/NS: Summary\n\n
    Information: \n\n${allTweets}\n\.`
  );
  return summary;
}

export { getResultThroughTweets };

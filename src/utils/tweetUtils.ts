import puppeteer from "puppeteer";
import { scrollPageToBottom } from "puppeteer-autoscroll-down";
import cheerio from "cheerio";
import { queryGPT } from "./openAIUtils";

const baseURL = "https://twitter.com/search?q=";

export async function fetchTweets(url: string): Promise<string[]> {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./user_data",
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
  );
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

  await browser.close();
  return tweets;
}

async function getResultThroughTweets(searchTerm: string) {
  const searchQuery = await queryGPT(
    "Give a twitter search query for finding the result of the following: " +
      searchTerm +
      ". Give exact query to type in twitter search bar. Don't search for long things. It has to be small."
  );
  console.log("Search query:", searchQuery);
  const tweets = await fetchTweets(
    baseURL + encodeURIComponent(searchQuery || searchTerm)
  );
  console.log("Fetched tweets:", tweets);
  const tweetSummary = await checkEvent(tweets, searchTerm);
  console.log("Summary:", tweetSummary);
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

async function checkEvent(
  tweets: string[],
  searchTerm: string
): Promise<string | undefined> {
  const allTweets = tweets.join("\n");
  const summary = await queryGPT(
    `Tell me if ${searchTerm} is currently true or false from the information given. If you are not sure or don't know, type NS i.e not sure. Also, tell why. Don't check for authenticity/ official announcement. If you can't tell from the information, say NS. Information: \n\n${allTweets}\n\.`
  );
  return summary;
}

export { getResultThroughTweets };

import puppeteer from "puppeteer";
import { scrollPageToBottom } from "puppeteer-autoscroll-down";
import cheerio from "cheerio";

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
      stepsLimit: 5,
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
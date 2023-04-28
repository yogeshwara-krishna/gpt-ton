import { Event } from "./wrappers/Event";
import { WalletContractV3R2, TonClient, Address } from "ton";
import { mnemonicToWalletKey } from "ton-crypto";
import puppeteer from "puppeteer";
import { Configuration, OpenAIApi } from "openai";
import { scrollPageToBottom } from "puppeteer-autoscroll-down";
import fs from "fs";

import cheerio from "cheerio";

require("dotenv").config();
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const getSenderFromMnemonic = async (mnemonic: string, client: TonClient) => {
  const keypair = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV3R2.create({
    publicKey: keypair.publicKey,
    workchain: 0,
  });
  const sender = wallet.sender(
    client.provider(wallet.address, wallet.init),
    keypair.secretKey
  );
  return sender;
};

const getTestClient = () => {
  const client = new TonClient({
    endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    apiKey: "3ee6e55a86a7d611e3670f650d4194656157ecf100d5d284dcdb9d873d8fb37d",
  });
  return client;
};

const createEvent = async () => {
  try {
    // Configure the Ton client
    const client = getTestClient();
    const mnemonic: string = process.env.MNEMONIC1 as any;

    const keypair = await mnemonicToWalletKey(mnemonic.split(" "));
    console.log(keypair.publicKey);
    const wallet = WalletContractV3R2.create({
      publicKey: keypair.publicKey,
      workchain: 0,
    });

    console.log(`Wallet address ${wallet.address}`);
    const oracle = wallet.address;
    const sender = await getSenderFromMnemonic(
      process.env.MNEMONIC2 as any,
      client
    );
    const uid = 1234567890;
    const event = await Event.create(client, oracle, uid);
    await event.deploy(sender);

    // Get the Event address
    const addr = event.address;
    console.log(`event address: ${addr}`);

    const response = {
      status: "success",
      message: "New event created successfully",
      data: {
        address: `${addr}`,
      },
    };

    return response;
  } catch (error) {
    console.log(error);
    const response = {
      status: "error",
      message: error,
      data: null,
    };
    console.log(response);
  }
};

const finishEvent = async (address: string, result: number) => {
  const client = getTestClient();
  const senderNew = await getSenderFromMnemonic(
    process.env.MNEMONIC1 as any,
    client
  );
  const addr = Address.parse(address);
  const eventNew = await Event.getInstance(client, addr);
  await eventNew.finishEvent(senderNew, result);
  const response = {
    status: "success",
    message: "Event finished successfully",
    data: null,
  };
  console.log(response);
  return response;
};

const chatGPT = async (message: string) => {
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

const baseURL = "https://twitter.com/search?q=";

async function fetchTweets(url: string): Promise<string[]> {
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

const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

(async () => {
  const args = process.argv.slice(2);
  const searchTerm = args[0];

  console.log("Creating event for ", searchTerm);
  let res: any;
  if (process.env.MNEMONIC1 && process.env.MNEMONIC2) {
    res = await createEvent();
    console.log(res);
  } else {
    console.log("No MNEOMNICS found in .env file");
    console.info("Continuing without creating event");
  }

  // check if there's a user_data folder if there's not console
  if (!fs.existsSync("./user_data")) {
    console.log(
      "Looks like it's your first time running this script. Please login to twitter and then close the browser. Then run this script again."
    );
    await sleep(1000);
  }

  try {
    // ASK chatgpt for an appropriate twitter search query
    const searchQuery = await chatGPT(
      "Give a twitter search query for finding the result of the following: " +
        searchTerm +
        ". Give exact query to type in twitter search bar. Nothing else."
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
    console.log("Result is ", result);
    let resultNum = 0;
    if (result?.startsWith("true")) {
      resultNum = 1;
    } else if (result?.startsWith("false")) {
      resultNum = 2;
    } else if (result?.startsWith("ns")) {
      resultNum = 3;
    }
    if (resultNum != 3) {
      console.log("Result is ", resultNum);
      console.log("Finishing event with result: ", resultNum);
      if (process.env.MNEMONIC1 && process.env.MNEMONIC2) {
        finishEvent(res?.data.address as any, 1);
        console.log(
          "Finished event",
          searchTerm,
          "with address: ",
          res?.data.address
        );
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
})();

async function checkEvent(
  tweets: string[],
  searchTerm: string
): Promise<string | undefined> {
  const allTweets = tweets.join("\n");
  const summary = await chatGPT(
    `Tell me if ${searchTerm} is currently true or false from the information given. If you are not sure or don't know, type NS i.e not sure. Also, tell why. Don't check for authenticity/announcement. Information: \n\n${allTweets}\n\.`
  );
  return summary;
}

import fs from "fs";
import axios from "axios";
import { createEvent, finishEvent } from "./ton_actions";
import { fetchTweets } from "./tweets";
import { queryGPT, sleep } from "./utils";
require("dotenv").config();

const baseURL = "https://twitter.com/search?q=";

const wikipediaApiUrl = "https://en.wikipedia.org/w/api.php";

async function searchWikipedia(searchQuery: string): Promise<void> {
  try {
    const response = await axios.get(wikipediaApiUrl, {
      params: {
        action: "query",
        list: "search",
        format: "json",
        srsearch: searchQuery,
        utf8: 1,
        formatversion: 2,
      },
    });

    const searchResults = response.data.query.search;

    console.log("Search Results:");
    searchResults.forEach((result: any) => {
      console.log(`${result.title}: ${result.pageid}`);
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Example usage:
searchWikipedia("Node.js");

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
    const searchQuery = await queryGPT(
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
  const summary = await queryGPT(
    `Tell me if ${searchTerm} is currently true or false from the information given. If you are not sure or don't know, type NS i.e not sure. Also, tell why. Don't check for authenticity/announcement. Information: \n\n${allTweets}\n\.`
  );
  return summary;
}

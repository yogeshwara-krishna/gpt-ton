import fs from "fs";
import { createEvent, finishEvent } from "./utils/tonUtils";
import { getResultThroughTweets } from "./utils/tweetUtils";
import { queryGPT, sleep } from "./utils/openAIUtils";
import { config } from "./config";
require("dotenv").config();

async function check(searchTerm: string) {
  // queryGPT to classify the event whether it's related to politics, news or sports
  const gptResponse = await queryGPT(
    "Is " +
      searchTerm +
      " related to politics, news or sports?, answer in Politics, News or Sports, nothing else."
  );
  console.log("GPT has classified the event as: ", gptResponse);
  if (gptResponse?.startsWith("Politics")) {
  }
}

(async () => {
  const args = process.argv.slice(2);
  const searchTerm = args[0];

  console.log("Creating event for ", searchTerm);
  let res: any;
  if (config.tonMnemonic1 && config.tonMnemonic2) {
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
    const result = await getResultThroughTweets(searchTerm);
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
      if (config.tonMnemonic1 && config.tonMnemonic2) {
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

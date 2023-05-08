import fs from "fs";
import { createEvent, finishEvent } from "./utils/tonUtils";
import { getResultThroughTweets } from "./utils/tweetUtils";
import { queryGPT, sleep } from "./utils/openAIUtils";
import { config } from "./config";
import { checkThroughNewsAPI } from "./utils/newsApiUtils";
import { checkThroughGoogle } from "./utils/googleSearch";

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

async function ambiguityCheck(searchTerm: string) {
  try {
    let gptResponse: any = await queryGPT(
      `In group chats the message can be anything, your job is to explain the potential of the message to be turned into a bet between two people. You must generate one of three types of responses:
      1. Irrelevant/Junk Message, Code 0
      2. Ambiguous message, code 1, also return a confirmation message asking the user to confirm the bet
      3. Unambiguous bet like message, code 2
      Only return a JSON string response of type {"code":number,"message":string}, include message only for case 2. Nothing else
      Return a response for this message: ${searchTerm}
      `
    );
    gptResponse = JSON.parse(gptResponse);
    return gptResponse;
  } catch (er) {
    console.log("Error in ambiguity check", er);
    return { code: -1 };
  }
}

async function dataSourcePred(searchTerm: string) {
  try {
    let gptResponse: any = await queryGPT(
      `A message like betting on an event that exists, this message is random and may contain incorrect information. Your task is to predict the best data source from the given list, which can validate the condition:
        1. Google Search API which has google search results, Code 1
        2. Twitter Recent Tweets, Code 2
        3. News API that returns news articles based on search queries, code 3

        return json response nothing else, that too must be of type: {"code": number,"reason": "why do you think best among others for this message"}
        Return a response for this message: ${searchTerm}
      `
    );
    gptResponse = JSON.parse(gptResponse);
    return gptResponse;
  } catch (er) {
    console.log("Error in data source check", er);
    return { code: -1 };
  }
}

async function matchToExistingBets(searchTerm: string) {
  try {
    // check for a file named bets.json in the same directory
    if (!fs.existsSync("bets.json")) {
      fs.writeFileSync("bets.json", "[]");
    }
    const jsonData = fs.readFileSync("bets.json", "utf-8");
    const existingEvents = JSON.parse(jsonData);

    const messages = existingEvents
      .map((item: any, index: number) => `${index}. ${item.message}`)
      .join(", ");

    let gptResponse: any = await queryGPT(`
    Given a list of messages in the format "index. message" (converted into a string), and a new input message, identify whether the new message matches any of the messages in the list. More clearly, all these messages have potential to get converted into bet. Your job is to check whether the new message is already similar to the ones already in the list.
    Output:
    If the input message matches any of the messages in the list, return the index of the matching message.
    If there is no match, return -1.
    Response should be of the json format {"index": number}, Nothing else.
    Here is the list: ${messages}
    Input message: ${searchTerm}
  `);

    gptResponse = JSON.parse(gptResponse);

    return gptResponse.index !== -1
      ? existingEvents[gptResponse.index].eventAddress
      : -1;
  } catch (er) {
    console.log("Error in matching to existing bets", er);
    return -1;
  }
}

(async () => {
  const args = process.argv.slice(2);
  const searchTerm = args[0];

  console.log("Checking for ambiguity in message: ", searchTerm);
  const ambiguity_res: any = await ambiguityCheck(searchTerm);

  console.log(ambiguity_res);

  if (ambiguity_res.code === 0) {
    // junk message, skip
  } else if (ambiguity_res.code === 1) {
    // ambiguous message, ask user for clarification, clarification message: ambiguity_res.message
  } else if (ambiguity_res.code === 2) {
    // bet like message, go ahead
  }

  // code to match the new message to existing bets
  console.log("Checking for a match in existing bets: ", searchTerm);
  const match_res: any = await matchToExistingBets(searchTerm);
  console.log(match_res);
  if (match_res !== -1) {
    // since its not -1 then match_res is the eventAddress itself, place the bet on it
  } else {
    // no match found
  }

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
    const resultTweets = await getResultThroughTweets(searchTerm);
    let resultNum = resultTweets;
    if (resultNum === 3) {
      console.log("Didn't get a result from tweets. Trying newsAPI\n");
      const resultNews = await checkThroughNewsAPI(searchTerm);
      resultNum = resultNews;
    }
    if (resultNum === 3) {
      console.log("Didn't get a result from newsAPI. Trying Google Search\n");
      const resultGoogle = await checkThroughGoogle(searchTerm);
      console.log("Result from google is ", resultGoogle);
      resultNum = resultGoogle;
    }
    console.log("Result is ", resultNum);
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

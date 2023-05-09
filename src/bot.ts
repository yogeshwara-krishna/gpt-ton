import { Telegraf } from "telegraf";
import { config } from "./config";
import fs from "fs";
import { ambiguityCheck } from "./server";
import { getResultThroughTweets } from "./utils/tweetUtils";
import { checkThroughNewsAPI } from "./utils/newsApiUtils";
import { checkThroughGoogle } from "./utils/googleSearch";

const bot = new Telegraf(config.botToken);

bot.start((ctx) =>
  ctx.reply(
    "Welcome to Future Wager Bot! \nType /help to see the list of commands"
  )
);

bot.command("bet", async (ctx) => {
  const searchTerm = ctx.message.text.split(" ").slice(1).join(" ");
  if (!searchTerm) {
    ctx.reply("Please enter a search term after /bet");
    return;
  }

  ctx.reply("Checking the message for ambiguity\n");

  const ambiguity_res: any = await ambiguityCheck(searchTerm);

  if (ambiguity_res.code === 0) {
    ctx.reply("This is a junk message, please send a new message");
  } else if (ambiguity_res.code === 1) {
    ctx.reply(
      `This message is ambiguous, is this what you want to place a bet on: ${ambiguity_res.message}? If yes, type /bet ${ambiguity_res.message}.`
    );
  } else if (ambiguity_res.code === 2) {
    ctx.reply("This is a bet like message, going ahead with the bet");
    // create a file with a unique id and store the bet in it
    const betId = Math.random().toString(36).substring(7);

    if (!fs.existsSync("./bets_store.json")) {
      fs.writeFileSync("./bets_store.json", "{}");
    }
    const betData = fs.readFileSync("./bets_store.json", "utf-8");
    const betDataJson = JSON.parse(betData);
    betDataJson[betId] = {
      bet: searchTerm,
      user: ctx.message.from.username,
      id: betId,
    };

    ctx.reply(
      `Your bet has been placed. Your bet id is ${betId}. You can check the result of your bet by typing /check ${betId}`
    );
    fs.writeFileSync("./bets_store.json", JSON.stringify(betDataJson));
  }
});

// now create a /check command to check the bets with the id
bot.command("check", async (ctx) => {
  const id = ctx.message.text.split(" ")[1];
  if (!id) {
    ctx.reply("Please enter a search term after /check");
    return;
  }
  const betData = fs.readFileSync("./bets_store.json", "utf-8");
  const betDataJson = JSON.parse(betData);
  if (betDataJson[id]) {
    const searchTerm = betDataJson[id].bet;
    try {
      ctx.reply(
        "Searching for the result of " +
          searchTerm +
          " through Google, NewsAPI and Twitter\n"
      );
      const resultGoogle = await checkThroughGoogle(searchTerm, ctx);
      let resultNum = resultGoogle;

      if (resultNum === 3) {
        console.log("Didn't get a result from Google Search. Trying newsAPI\n");
        ctx.reply("Didn't get a result from Google Search. Trying newsAPI\n");
        const resultNews = await checkThroughNewsAPI(searchTerm, ctx);
        resultNum = resultNews;
      }

      if (resultNum === 3) {
        console.log("Didn't get a result from newsAPI. Trying Twitter\n");
        ctx.reply("Didn't get a result from newsAPI. Trying Twitter\n");
        const resultTweets = await getResultThroughTweets(searchTerm, ctx);
        resultNum = resultTweets;
      }

      console.log("Result is ", resultNum);
      if (resultNum != 3) {
        console.log("Result is ", resultNum);
        console.log("Finishing event with result: ", resultNum);
        ctx.reply("Result is " + resultNum);
        ctx.reply("Finishing event with result: " + resultNum);
        if (config.tonMnemonic1 && config.tonMnemonic2) {
          // finishEvent(res?.data.address as any, 1);
          // console.log(
          //   "Finished event",
          //   searchTerm,
          //   "with address: ",
          //   res?.data.address
          // );
        }
      }
    } catch (err) {
      console.log("Error in getting result: ", err);
    }
  } else {
    ctx.reply("No bet found with this id");
  }
});

bot.command("help", (ctx) => {
  ctx.reply(
    "Here are the available commands:\n\n" +
    "/start - Sends a welcome message\n\n" +
    "/bet <search term> - Places a bet on the given search term. For example: /bet it will rain tomorrow\n\n" +
    "/check <bet id> - Checks the result of a previously placed bet with the given id. For example: /check abc123\n\n" +
    "/help - Shows the list of commands"
  );
});


bot.launch();

console.log("FutureWager_bot is running!");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

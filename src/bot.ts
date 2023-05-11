import { Telegraf } from "telegraf";
import { config } from "./config";
import fs from "fs";
import { ambiguityCheck, checkAllSportsEvent } from "./server";
import { getResultThroughTweets } from "./utils/tweetUtils";
import { checkThroughNewsAPI } from "./utils/newsApiUtils";
import { checkThroughGoogle } from "./utils/googleSearch";
import puppeteer from "puppeteer";

let browser, page;

(async () => {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  console.log("Browser started");
})();

const bot = new Telegraf(config.botToken);
const websiteURL = "https://prophecypulse.web.app/";

bot.start((ctx) =>
  ctx.reply(
    "Welcome to ProphecyPulse Bot! I'm here to help you place bets on events and check their outcomes. Type /help to see the list of available commands"
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
    ctx.reply(
      "The message appears to be of little relevance, kindly send a new message."
    );
  } else if (ambiguity_res.code === 1) {
    ctx.reply(
      `This message is ambiguous, is this what you want to place a bet on: ${ambiguity_res.message}? If yes, type /bet ${ambiguity_res.message}.`
    );
  } else if (ambiguity_res.code === 2) {
    // check if the searchTerm is a sports event and can be found on web app
    const resultAllSports: any = await checkAllSportsEvent(searchTerm);
    if (resultAllSports !== -1) {
      ctx.reply(
        `Would you like to bet on the game where *${resultAllSports.query}* is playing?`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Website",
                  url: websiteURL,
                },
                {
                  text: "Place Bet",
                  url: `${websiteURL}?search=${resultAllSports.query}`,
                },
              ],
            ],
          },
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message?.message_id,
        }
      );
    } else {
      // ask for user confirmation before placing a bet
      await ctx.replyWithHTML(
        `Did you mean you want to bet on: <b>${ambiguity_res.message}</b>\nRespond with yes/no.`
      );

      bot.on("message", async (ctx: any) => {
        // If the replied message is the same as the one sent by the bot
        const userReply = ctx.message.text.toLowerCase();
        if (userReply !== "yes" && userReply !== "no") {
          ctx.reply(
            "Unexpected response, please try again with /bet <bet proposition>"
          );
        } else if (userReply === "yes") {
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

          ctx.replyWithHTML(
            `Your bet has been placed. Your bet id is <code>${betId}</code>. You can check the result of your bet by typing <code>/check ${betId}</code>`
          );

          fs.writeFileSync("./bets_store.json", JSON.stringify(betDataJson));
        } else {
          ctx.reply(
            "Could you please clarify your bet proposition? Respond with /bet <bet propositon> to continue."
          );
        }
      });
    }
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
      ctx.reply("Searching for the result of " + searchTerm);
      const resultGoogle = await checkThroughGoogle(searchTerm, ctx);
      let resultNum = resultGoogle;

      if (resultNum === 3) {
        console.log("Didn't get a result from Google Search. Trying newsAPI\n");
        const resultNews = await checkThroughNewsAPI(searchTerm, ctx);
        resultNum = resultNews;
      }

      if (resultNum === 3) {
        console.log("Didn't get a result from newsAPI. Trying Twitter\n");
        const resultTweets = await getResultThroughTweets(searchTerm, ctx, page);
        resultNum = resultTweets;
      }

      console.log("Result is ", resultNum);
      if (resultNum != 3) {
        console.log("Result is ", resultNum);
        console.log("Finishing event with result: ", resultNum);
        ctx.reply("Updating the result of the event\n");
        if (config.tonMnemonic1 && config.tonMnemonic2) {
          // finishEvent(res?.data.address as any, 1);
          // console.log(
          //   "Finished event",
          //   searchTerm,
          //   "with address: ",
          //   res?.data.address
          // );
          ctx.reply("Event updated successfully");
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
      "/start - Sends a welcome message and brief introduction\n\n" +
      "/bet <bet proposition> - Places a bet on the given proposition. For example: /bet it will rain tomorrow, /bet Djokovic will loss the first set in his next game, /bet Modi will announce a more limited reform than the one he originally proposed\n\n" +
      "/check <bet id> - Checks the result of a previously placed bet using the provided bet ID. For example: /check abc123\n\n" +
      "/help - Shows the list of commands"
  );
});

bot.launch();

console.log("FutureWager_bot is running!");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

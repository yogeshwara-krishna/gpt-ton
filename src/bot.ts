import { Telegraf } from "telegraf";
import { config } from "./config";

const bot = new Telegraf(config.botToken);

bot.start((ctx) =>
  ctx.reply(
    "Welcome to Future Wager Bot! \nType /help to see the list of commands"
  )
);

bot.command("bet", (ctx) => {
  // Your code for betting on future events goes here
  ctx.reply("Place your bet on future events!");
});

bot.command("help", (ctx) => {
  ctx.reply(
    "List of commands:\n/start - Welcome message\n/bet - Place a bet\n/help - Show help"
  );
});

bot.launch();

console.log("FutureWager_bot is running!");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

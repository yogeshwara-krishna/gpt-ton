module.exports = {
  apps: [
    {
      name: "wager-bot",
      script: "npm",
      args: "run start_bot",
      cwd: "/root/gpt-ton", // replace it if you deploy in another directory
    },
  ],
};

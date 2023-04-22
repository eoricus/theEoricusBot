import env from "../env.json";

import bot from "./bot";

bot.updates
  .startPolling()
  .then(() => {
    console.info(`[@${bot.bot.username}] Started polling`);
    bot.api.setMyCommands({
      commands: env.listOfCommands,
    });
  })
  .catch(console.error);

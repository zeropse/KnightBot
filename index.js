const {
  CONFIG,
  validateConfig,
  createClient,
  sendMessageWithRetry,
  createBotStatusEmbed,
  createShutdownEmbed,
} = require("./config");

if (!validateConfig()) {
  process.exit(1);
}

const client = createClient();

client.once("ready", async () => {
  console.log(`✅ ${client.user.tag} is Running.`);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const logsChannel = client.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
  if (logsChannel) {
    const embed = createBotStatusEmbed(
      "✅ Bot Online",
      "The bot has successfully started!",
      0x00ff00
    );
    await sendMessageWithRetry(logsChannel, embed);
  } else {
    console.warn(`⚠️ Logs channel (${CONFIG.LOGS_CHANNEL_ID}) not found.`);
  }
});

require("./events")(client);

const shutdownBot = async () => {
  console.log("Bot is shutting down...");
  try {
    const logsChannel = client.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
    if (logsChannel) {
      const embed = createShutdownEmbed();
      await sendMessageWithRetry(logsChannel, embed);
    }
    await client.destroy();
  } catch (error) {
    console.error(`Error during shutdown: ${error.stack}`);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", () => shutdownBot(client));
process.on("SIGTERM", () => shutdownBot(client));

client.login(CONFIG.TOKEN).catch((error) => {
  console.error(`❌ Failed to login: ${error.stack}`);
  process.exit(1);
});

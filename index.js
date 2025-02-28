const {
  CONFIG,
  validateConfig,
  createClient,
  sendMessageWithRetry,
} = require("./config");

if (!validateConfig()) {
  process.exit(1);
}

const client = createClient();

client.once("ready", async () => {
  console.log(`${client.user.tag} is Running.`);

  try {
    const logsChannel = client.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
    if (logsChannel) {
      await sendMessageWithRetry(
        logsChannel,
        `🔄 The bot has started and is online!`
      );
    } else {
      console.warn(`Logs channel (${CONFIG.LOGS_CHANNEL_ID}) not found.`);
    }
  } catch (error) {
    console.error(`Error in ready event: ${error.message}`);
  }
});

client.on("guildMemberAdd", async (member) => {
  try {
    const welcomeChannel = client.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
    if (welcomeChannel) {
      const serverName = member.guild.name;
      const rulesChannelLink = `<#${CONFIG.RULES_CHANNEL_ID}>`;
      const rulesMessageLink = `https://discord.com/channels/${member.guild.id}/${CONFIG.RULES_CHANNEL_ID}/${CONFIG.RULES_MESSAGE_ID}`;

      await sendMessageWithRetry(
        welcomeChannel,
        `🎉 Welcome ${member} to **${serverName}**! 🎉\n\n` +
          `We're thrilled to have you here!\n\n` +
          `Please take a moment to review our rules: ${rulesChannelLink}.\n\n` +
          `You can also view the specific rules list here: [Rules Message](${rulesMessageLink}).\n\n` +
          `Enjoy your stay and have fun! 🎈`
      );
    } else {
      console.warn(`Welcome channel (${CONFIG.WELCOME_CHANNEL_ID}) not found.`);
    }
  } catch (error) {
    console.error(`Error in guildMemberAdd event: ${error.message}`);
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  if (
    reaction.message.channel.id === CONFIG.RULES_CHANNEL_ID &&
    reaction.message.id === CONFIG.RULES_MESSAGE_ID &&
    reaction.emoji.name === "✅"
  ) {
    const guild = reaction.message.guild;
    try {
      const member = await guild.members.fetch(user.id);
      const role = guild.roles.cache.get(CONFIG.ROLE_ID);

      if (role) {
        await member.roles.add(role);

        const logsChannel = guild.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
        if (logsChannel) {
          await sendMessageWithRetry(
            logsChannel,
            `${member} has accepted the rules and gained access to the server.`
          );
        }
      } else {
        console.warn(`Role (${CONFIG.ROLE_ID}) not found.`);
      }
    } catch (error) {
      console.error(`Error adding role: ${error.message}`);
    }
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;

  if (
    reaction.message.channel.id === CONFIG.RULES_CHANNEL_ID &&
    reaction.message.id === CONFIG.RULES_MESSAGE_ID &&
    reaction.emoji.name === "✅"
  ) {
    const guild = reaction.message.guild;
    try {
      const member = await guild.members.fetch(user.id);
      const role = guild.roles.cache.get(CONFIG.ROLE_ID);

      if (role && member.roles.cache.has(CONFIG.ROLE_ID)) {
        await member.roles.remove(role);

        const logsChannel = guild.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
        if (logsChannel) {
          await sendMessageWithRetry(
            logsChannel,
            `${member} has lost access to the server due to removing reaction.`
          );
        }
      } else if (!role) {
        console.warn(`Role (${CONFIG.ROLE_ID}) not found.`);
      }
    } catch (error) {
      console.error(`Error removing role: ${error.message}`);
    }
  }
});

const shutdownBot = async () => {
  console.log("Bot is shutting down...");
  try {
    const logsChannel = client.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
    if (logsChannel) {
      await sendMessageWithRetry(logsChannel, `🔴 The bot is shutting down...`);
    }
    await client.destroy();
  } catch (error) {
    console.error(`Error during shutdown: ${error.message}`);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdownBot);
process.on("SIGTERM", shutdownBot);

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  shutdownBot();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

client.login(CONFIG.TOKEN).catch((error) => {
  console.error(`Failed to login: ${error.message}`);
  process.exit(1);
});

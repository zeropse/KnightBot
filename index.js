const {
  CONFIG,
  validateConfig,
  createClient,
  sendMessageWithRetry,
  createEmbed,
} = require("./config");

if (!validateConfig()) {
  console.error("Invalid bot configuration. Exiting...");
  process.exit(1);
}

const client = createClient();

client.once("ready", async () => {
  console.log(`${client.user.tag} is Running.`);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const logsChannel = client.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
  if (!logsChannel) {
    console.warn(`Logs channel (${CONFIG.LOGS_CHANNEL_ID}) not found.`);
    return;
  }

  try {
    const embed = createEmbed(
      "✅ Bot Online",
      "The bot has successfully started and is now online!",
      0x00ff00,
      [],
      "Made by zeropse",
      client.user.displayAvatarURL()
    );

    await sendMessageWithRetry(logsChannel, embed);
  } catch (error) {
    console.error(`Error in ready event: ${error.stack}`);
  }
});

client.on("guildMemberAdd", async (member) => {
  const welcomeChannel = client.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
  if (!welcomeChannel) {
    console.warn(`Welcome channel (${CONFIG.WELCOME_CHANNEL_ID}) not found.`);
    return;
  }

  try {
    const rulesMessageLink = `https://discord.com/channels/${member.guild.id}/${CONFIG.RULES_CHANNEL_ID}/${CONFIG.RULES_MESSAGE_ID}`;

    const embed = createEmbed(
      "🎉 Welcome to the Server!",
      `Hey ${member}, we're thrilled to have you here! 🎈\n\n` +
        `📜 **Please review our rules:** [Click here](${rulesMessageLink})\n\n` +
        `💬 Feel free to introduce yourself and have a great time!`,
      0x3498db,
      [],
      "Thank you for joining the server!",
      member.guild.iconURL()
    );

    await sendMessageWithRetry(welcomeChannel, embed);
  } catch (error) {
    console.error(`Error in guildMemberAdd event: ${error.stack}`);
  }
});

client.on("messageReactionUpdate", async (reaction, user, isAdding) => {
  if (user.bot) return;

  const { message } = reaction;
  if (
    message.channel.id !== CONFIG.RULES_CHANNEL_ID ||
    message.id !== CONFIG.RULES_MESSAGE_ID
  ) {
    return;
  }

  if (reaction.emoji.name !== "✅") return;

  try {
    const guild = message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(CONFIG.ROLE_ID);

    if (!role) {
      console.warn(`Role (${CONFIG.ROLE_ID}) not found.`);
      return;
    }

    if (isAdding) {
      await member.roles.add(role);
    } else if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
    }

    const logsChannel = guild.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
    if (!logsChannel) return;

    const embed = createEmbed(
      isAdding ? "✅ Rules Accepted" : "❌ Rules Unaccepted",
      `${member} has ${isAdding ? "accepted" : "removed"} the rules.`,
      isAdding ? 0x2ecc71 : 0xe74c3c,
      [],
      "Moderation System",
      member.user.displayAvatarURL()
    );

    await sendMessageWithRetry(logsChannel, embed);
  } catch (error) {
    console.error(`Error updating role: ${error.stack}`);
  }
});

client.on("messageReactionAdd", (reaction, user) =>
  client.emit("messageReactionUpdate", reaction, user, true)
);

client.on("messageReactionRemove", (reaction, user) =>
  client.emit("messageReactionUpdate", reaction, user, false)
);

const shutdownBot = async () => {
  console.log("Bot is shutting down...");
  try {
    const logsChannel = client.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
    if (logsChannel) {
      const embed = createEmbed(
        "🔴 Bot Shutdown",
        "The bot is shutting down...",
        0xff0000
      );
      await sendMessageWithRetry(logsChannel, embed);
    }
    await client.destroy();
  } catch (error) {
    console.error(`Error during shutdown: ${error.stack}`);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdownBot);
process.on("SIGTERM", shutdownBot);

client.login(CONFIG.TOKEN).catch((error) => {
  console.error(`Failed to login: ${error.stack}`);
  process.exit(1);
});

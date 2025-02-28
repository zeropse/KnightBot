const {
  CONFIG,
  validateConfig,
  createClient,
  sendMessageWithRetry,
  createEmbed,
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
      const embed = createEmbed(
        "✅ Bot Online",
        "The bot has successfully started and is now online!",
        0x00ff00,
        [],
        "Made by zeropse",
        client.user.displayAvatarURL()
      );

      await sendMessageWithRetry(logsChannel, embed);
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
      const rulesMessageLink = `https://discord.com/channels/${member.guild.id}/${CONFIG.RULES_CHANNEL_ID}/${CONFIG.RULES_MESSAGE_ID}`;

      const embed = createEmbed(
        "🎉 Welcome to the Server!",
        `Hey ${member}, we're thrilled to have you here! 🎈\n\n` +
          `📜 **Please review our rules:** [Click here](${rulesMessageLink})\n\n` +
          `💬 Feel free to introduce yourself and have a great time!`,
        0x3498db,
        [],
        member.guild.iconURL()
      );

      await sendMessageWithRetry(welcomeChannel, embed);
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
          const embed = createEmbed(
            "✅ Rules Accepted",
            `${member} has accepted the rules and gained access.`,
            0x2ecc71,
            [],
            "Moderation System",
            member.user.displayAvatarURL()
          );

          await sendMessageWithRetry(logsChannel, embed);
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
          const embed = createEmbed(
            "❌ Rules Unaccepted",
            `${member} has removed their reaction and lost access.`,
            0xe74c3c,
            [],
            "Moderation System",
            member.user.displayAvatarURL()
          );

          await sendMessageWithRetry(logsChannel, embed);
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
      const embed = createEmbed(
        "🔴 Bot Shutdown",
        "The bot is shutting down...",
        0xff0000
      );

      await sendMessageWithRetry(logsChannel, embed);
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

client.login(CONFIG.TOKEN).catch((error) => {
  console.error(`Failed to login: ${error.message}`);
  process.exit(1);
});

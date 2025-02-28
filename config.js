const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
} = require("discord.js");

const { config } = require("dotenv");

// Load environment variables
config();

const CONFIG = Object.freeze({
  TOKEN: process.env.BOT_TOKEN,
  ROLE_ID: process.env.ROLE_ID,
  RULES_CHANNEL_ID: process.env.RULES_CHANNEL_ID,
  LOGS_CHANNEL_ID: process.env.LOGS_CHANNEL_ID,
  WELCOME_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID,
  RULES_MESSAGE_ID: process.env.RULES_MESSAGE_ID,
});

const validateConfig = () => {
  const missingVars = Object.entries(CONFIG)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(
      `\n🚨 Missing required environment variables:\n - ${missingVars.join(
        "\n - "
      )}\nExiting...`
    );
    return false;
  }
  return true;
};

const createClient = () =>
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  });

const sendMessageWithRetry = async (
  channel,
  content,
  retries = 3,
  delay = 1000
) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (!channel) {
        console.error("❌ Channel not found. Skipping message send.");
        return;
      }

      await channel.send(
        typeof content === "string" ? { content } : { embeds: [content] }
      );
      return;
    } catch (error) {
      console.error(
        `⚠️ Failed to send message in ${channel?.id || "unknown"}: ${
          error.message
        }`
      );
      if (i < retries - 1)
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  console.error("❌ Failed to send message after multiple retries.");
};

const createEmbed = (
  title,
  description,
  color = 0x0099ff,
  fields = [],
  footer = "Made by zeropse",
  thumbnail = null
) => {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setFooter({ text: footer });

  if (fields.length) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);

  return embed;
};

// Specialized Embed Creators
const createBotStatusEmbed = (title, description, color) =>
  createEmbed(title, description, color);

const createWelcomeEmbed = (member, rulesLink) =>
  createEmbed(
    "🎉 Welcome to the Server!",
    `Hey ${member}, we're thrilled to have you here! 🎈\n\n📜 **Review our rules:** [Click here](${rulesLink})\n\n💬 Introduce yourself and have fun!`,
    0x3498db,
    [],
    "Thank you for joining!",
    member.guild.iconURL()
  );

const createRulesEmbed = (member, isAdding) =>
  createEmbed(
    isAdding ? "✅ Rules Accepted" : "❌ Rules Unaccepted",
    `${member} has ${isAdding ? "accepted" : "removed"} the rules.`,
    isAdding ? 0x2ecc71 : 0xe74c3c,
    [],
    "Moderation System",
    member.user.displayAvatarURL()
  );

const createShutdownEmbed = () =>
  createEmbed("🔴 Bot Shutdown", "The bot is shutting down...", 0xff0000);

module.exports = {
  CONFIG,
  validateConfig,
  createClient,
  sendMessageWithRetry,
  createEmbed,
  createBotStatusEmbed,
  createWelcomeEmbed,
  createRulesEmbed,
  createShutdownEmbed,
};

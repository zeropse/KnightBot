const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
} = require("discord.js");

const { config } = require("dotenv");

// Load environment variables
config();

const CONFIG = {
  TOKEN: process.env.BOT_TOKEN,
  ROLE_ID: process.env.ROLE_ID,
  RULES_CHANNEL_ID: process.env.RULES_CHANNEL_ID,
  LOGS_CHANNEL_ID: process.env.LOGS_CHANNEL_ID,
  WELCOME_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID,
  RULES_MESSAGE_ID: process.env.RULES_MESSAGE_ID,
};

const validateConfig = () => {
  const missingVars = Object.entries(CONFIG)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVars.join(
        ", "
      )}. Exiting...`
    );
    return false;
  }

  return true;
};

const createClient = () => {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  });
};

const sendMessageWithRetry = async (
  channel,
  content,
  retries = 3,
  delay = 1000
) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (!channel) {
        console.error("Channel not found. Skipping message send.");
        return;
      }

      if (typeof content === "string") {
        await channel.send({ content });
      } else {
        await channel.send({ embeds: [content] });
      }

      return;
    } catch (error) {
      console.error(`Failed to send message: ${error.message}`);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error("Failed to send message after several retries.");
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

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }

  return embed;
};

module.exports = {
  CONFIG,
  validateConfig,
  createClient,
  sendMessageWithRetry,
  createEmbed,
};

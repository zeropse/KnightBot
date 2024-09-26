const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { config } = require('dotenv');

// Load environment variables
config();

// Load .env
const TOKEN = process.env.BOT_TOKEN;
const ROLE_ID = process.env.ROLE_ID;
const RULES_CHANNEL_ID = process.env.RULES_CHANNEL_ID;
const LOGS_CHANNEL_ID = process.env.LOGS_CHANNEL_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;
const RULES_MESSAGE_ID = process.env.RULES_MESSAGE_ID;

// Check for missing environment variables
if (!TOKEN || !ROLE_ID || !RULES_CHANNEL_ID || !LOGS_CHANNEL_ID || !WELCOME_CHANNEL_ID || !RULES_MESSAGE_ID) {
    console.error('Missing required environment variables. Exiting...');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Bot Run
client.once('ready', async () => {
    console.log(`${client.user.tag} is Running.`);
    
    // Notify users in the logs channel that the bot is online
    const logsChannel = client.channels.cache.get(LOGS_CHANNEL_ID);
    if (logsChannel) {
        await sendMessageWithRetry(logsChannel, `🔄 The bot has started and is online!`);
    }
});

// Greeting message
client.on('guildMemberAdd', async (member) => {
    const welcomeChannel = client.channels.cache.get(WELCOME_CHANNEL_ID);
    if (welcomeChannel) {
        const serverName = member.guild.name;
        const rulesChannelLink = `<#${RULES_CHANNEL_ID}>`;
        const rulesMessageLink = `https://discord.com/channels/${member.guild.id}/${RULES_CHANNEL_ID}/${RULES_MESSAGE_ID}`;

        await sendMessageWithRetry(welcomeChannel,
            `🎉 Welcome ${member} to **${serverName}**! 🎉\n\n` +
            `We're thrilled to have you here!\n\n` +
            `Please take a moment to review our rules: ${rulesChannelLink}.\n\n` +
            `You can also view the specific rules list here: [Rules Message](${rulesMessageLink}).\n\n` +
            `Enjoy your stay and have fun! 🎈`
        );
    }
});

// Retry Function
const sendMessageWithRetry = async (channel, content, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await channel.send(content);
            return;
        } catch (error) {
            console.error(`Failed to send message: ${error.message}`);
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.error('Failed to send message after several retries.');
};

// Roles added by emoji reaction
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return; // Ignore bot reactions
    if (reaction.message.channel.id === RULES_CHANNEL_ID && reaction.message.id === RULES_MESSAGE_ID && reaction.emoji.name === '✅') {
        const guild = reaction.message.guild;
        try {
            const member = await guild.members.fetch(user.id);
            const role = guild.roles.cache.get(ROLE_ID);
            if (role) {
                await member.roles.add(role);
                const logsChannel = guild.channels.cache.get(LOGS_CHANNEL_ID);
                if (logsChannel) {
                    await sendMessageWithRetry(logsChannel, `${member} has accepted the rules and gained access to the server.`);
                }
            }
        } catch (error) {
            console.error(`Error adding role: ${error.message}`);
        }
    }
});

// Roles removed by emoji reaction
client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return; // Ignore bot reactions
    if (reaction.message.channel.id === RULES_CHANNEL_ID && reaction.message.id === RULES_MESSAGE_ID && reaction.emoji.name === '✅') {
        const guild = reaction.message.guild;
        try {
            const member = await guild.members.fetch(user.id);
            const role = guild.roles.cache.get(ROLE_ID);
            if (role && member.roles.cache.has(ROLE_ID)) {
                await member.roles.remove(role);
                const logsChannel = guild.channels.cache.get(LOGS_CHANNEL_ID);
                if (logsChannel) {
                    await sendMessageWithRetry(logsChannel, `${member} has lost access to the server due to removing reaction.`);
                }
            }
        } catch (error) {
            console.error(`Error removing role: ${error.message}`);
        }
    }
});

// Handle bot shutdown
const shutdownBot = async () => {
    console.log('Bot is shutting down...');
    const logsChannel = client.channels.cache.get(LOGS_CHANNEL_ID);
    if (logsChannel) {
        await sendMessageWithRetry(logsChannel, `🔴 The bot is shutting down...`);
    }
    await client.destroy();
    process.exit();
};

process.on('SIGINT', shutdownBot);
process.on('SIGTERM', shutdownBot);

// Start Bot
client.login(TOKEN);

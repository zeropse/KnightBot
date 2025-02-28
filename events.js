const {
  CONFIG,
  sendMessageWithRetry,
  createWelcomeEmbed,
  createRulesEmbed,
} = require("./config");

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const welcomeChannel = client.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
    if (!welcomeChannel)
      return console.warn(
        `⚠️ Welcome channel (${CONFIG.WELCOME_CHANNEL_ID}) not found.`
      );

    try {
      const rulesMessageLink = `https://discord.com/channels/${member.guild.id}/${CONFIG.RULES_CHANNEL_ID}/${CONFIG.RULES_MESSAGE_ID}`;
      const embed = createWelcomeEmbed(member, rulesMessageLink);
      await sendMessageWithRetry(welcomeChannel, embed);
    } catch (error) {
      console.error(`❌ Error in guildMemberAdd event: ${error.stack}`);
    }
  });

  client.on("messageReactionAdd", (reaction, user) =>
    client.emit("messageReactionUpdate", reaction, user, true)
  );

  client.on("messageReactionRemove", (reaction, user) =>
    client.emit("messageReactionUpdate", reaction, user, false)
  );

  client.on("messageReactionUpdate", async (reaction, user, isAdding) => {
    if (user.bot) return;

    const { message } = reaction;
    if (
      message.channel.id !== CONFIG.RULES_CHANNEL_ID ||
      message.id !== CONFIG.RULES_MESSAGE_ID ||
      reaction.emoji.name !== "✅"
    ) {
      return;
    }

    try {
      const guild = message.guild;
      const member = await guild.members.fetch(user.id);
      const role = guild.roles.cache.get(CONFIG.ROLE_ID);

      if (!role) return console.warn(`⚠️ Role (${CONFIG.ROLE_ID}) not found.`);

      if (isAdding) {
        await member.roles.add(role);
      } else if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
      }

      const logsChannel = guild.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
      if (logsChannel) {
        const embed = createRulesEmbed(member, isAdding);
        await sendMessageWithRetry(logsChannel, embed);
      }
    } catch (error) {
      console.error(`❌ Error updating role: ${error.stack}`);
    }
  });
};

const {
  CONFIG,
  sendMessageWithRetry,
  createWelcomeEmbed,
  createRulesEmbed,
} = require("./config");

const AcceptedUser = require("./db/AcceptedUser");

module.exports = (client) => {
  // ✅ On Member Join → Send Welcome Message
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

  // ✅ Reaction Events
  client.on("messageReactionAdd", (reaction, user) =>
    client.emit("messageReactionUpdate", reaction, user, true)
  );

  client.on("messageReactionRemove", (reaction, user) =>
    client.emit("messageReactionUpdate", reaction, user, false)
  );

  // ✅ Handle User Accepting or Revoking Rules
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
        await AcceptedUser.findOneAndUpdate(
          { userId: user.id, guildId: guild.id }, // Find by userId & guildId
          {
            userId: user.id,
            guildId: guild.id,
            username: user.username,
            acceptedAt: new Date(),
          }, // Update or insert
          { upsert: true, new: true }
        );
        console.log(`✅ User ${user.username} (${user.id}) added to database.`);
      } else {
        // ✅ Check if user exists before removing role
        const existingUser = await AcceptedUser.findOne({
          userId: user.id,
          guildId: guild.id,
        });

        if (existingUser) {
          await member.roles.remove(role);
          await AcceptedUser.deleteOne({ userId: user.id, guildId: guild.id });
          console.log(
            `❌ User ${user.username} (${user.id}) removed from database and role taken away.`
          );
        } else {
          console.log(
            `⚠️ User ${user.username} (${user.id}) tried to remove reaction but was not in database.`
          );
        }
      }

      const logsChannel = guild.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
      if (logsChannel) {
        const embed = createRulesEmbed(member, isAdding);
        await sendMessageWithRetry(logsChannel, embed);
      }
    } catch (error) {
      console.error(
        `❌ Error updating role or saving reaction: ${error.stack}`
      );
    }
  });

  // ✅ Restore Roles on Bot Startup
  client.once("ready", async () => {
    console.log(`🚀 Bot is online as ${client.user.tag}`);

    try {
      const acceptedUsers = await AcceptedUser.find({});
      for (const user of acceptedUsers) {
        const guild = client.guilds.cache.get(user.guildId);
        if (!guild) continue;

        try {
          const member = await guild.members.fetch(user.userId);
          const role = guild.roles.cache.get(CONFIG.ROLE_ID);
          if (role) {
            await member.roles.add(role);
            console.log(
              `✅ Restored role for ${user.username} (${user.userId}).`
            );
          }
        } catch (error) {
          console.warn(
            `⚠️ Could not restore role for ${user.userId}: ${error.message}`
          );
        }
      }
    } catch (error) {
      console.error(`❌ Error loading accepted users: ${error.message}`);
    }
  });
};

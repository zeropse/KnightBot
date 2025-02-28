const mongoose = require("../database");

const acceptedUserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    username: { type: String, required: true },
    acceptedAt: { type: Date, default: Date.now },
  },
  { collection: "accepted_users" }
);

const AcceptedUser = mongoose.model("AcceptedUser", acceptedUserSchema);

module.exports = AcceptedUser;

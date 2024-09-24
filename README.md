# KnightBot

This is a Discord bot built using `discord.js` that manages user interactions, including welcoming new members and handling role assignments based on emoji reactions.

## Features

- **Welcome New Members**: Sends a greeting message to a designated welcome channel when a new member joins the server.
- **Role Assignment**: Automatically assigns or removes a role based on emoji reactions to a specific message in the rules channel.
- **Logging**: Sends log messages to a designated channel when members accept or revoke their agreement to the rules.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.9.0 or higher)
- [Discord Bot Token](https://discord.com/developers/applications) (create a bot and obtain a token)

### Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/zeropse/KnightBot.git
   ```

2. Navigate to the project directory:

   ```bash
   cd KnightBot
   ```

3. Install dependencies:

   ```bash
   npm install discord.js dotenv
   ```

4. Create a `.env` file in the root of the project directory with the following variables:

   ```plaintext
   BOT_TOKEN = your_bot_token
   ROLE_ID = your_role_id
   RULES_CHANNEL_ID = your_rules_channel_id
   LOGS_CHANNEL_ID = your_logs_channel_id
   WELCOME_CHANNEL_ID = your_welcome_channel_id
   RULES_MESSAGE_ID = your_rules_message_id
   ```

   Replace the placeholder values with your actual Discord IDs.

### Running the Bot

Start the bot by running:

```bash
node index.js
```

## Contributing

Feel free to fork the repository and submit pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License.

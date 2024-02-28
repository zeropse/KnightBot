import os
import discord
import requests
from discord.ext import commands
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
RULES_WEBHOOK_URL = os.getenv('RULES_WEBHOOK_URL')
LOGS_WEBHOOK_URL = os.getenv('LOGS_WEBHOOK_URL')

# Define your role ID, rules channel ID, and logs channel ID
ROLE_ID = 1171909490229137408  # Change it to yours
RULES_CHANNEL_ID = 1171907124830408774  # Change it to yours
LOGS_CHANNEL_ID = 1171904382762242150  # Change it to yours

# Define intents
intents = discord.Intents.default()
intents.guilds = True
intents.members = True
intents.messages = True

# Create bot instance
bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    print(f'{bot.user.name} is Running.')

@bot.event
async def on_member_join(member):
    welcome_channel = bot.get_channel(1171917186412060693)
    if welcome_channel:
        server_name = member.guild.name
        await welcome_channel.send(f"Hello {member.mention}, welcome to {server_name}. Check out the Rules Channel to gain Full access to the server.")

@bot.command() 
async def accept_rules(ctx):
    if ctx.channel.id == RULES_CHANNEL_ID:
        member = ctx.author
        role = ctx.guild.get_role(ROLE_ID)
        if role:
            await member.add_roles(role)
            await ctx.send(f"{member.mention} has accepted the rules and gained access to the server!")

            # Send message to logs channel
            await send_to_webhook(LOGS_WEBHOOK_URL, f"{member.mention} has accepted the rules and gained access to the server!")

async def send_to_webhook(webhook_url, message):
    if webhook_url:
        data = {"content": message}
        try:
            response = requests.post(webhook_url, json=data)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Error sending webhook request: {e}")
    else:
        print("Error: Webhook URL is not provided.")

@bot.event
async def on_raw_reaction_add(payload):
    if payload.channel_id == RULES_CHANNEL_ID and payload.emoji.name == '✅':
        guild = bot.get_guild(payload.guild_id)
        member = guild.get_member(payload.user_id)
        if member:
            role = guild.get_role(ROLE_ID)
            if role:
                await member.add_roles(role)
                await send_to_webhook(LOGS_WEBHOOK_URL, f"{member.mention} has accepted the rules and gained access to the server!")

@bot.event
async def on_raw_reaction_remove(payload):
    if payload.channel_id == RULES_CHANNEL_ID and payload.emoji.name == '✅':
        guild = bot.get_guild(payload.guild_id)
        member = guild.get_member(payload.user_id)
        if member:
            role = guild.get_role(ROLE_ID)
            if role and role in member.roles:
                await member.remove_roles(role)
                await send_to_webhook(LOGS_WEBHOOK_URL, f"{member.mention} has lost access to the server due to removing reaction.")

bot.run(DISCORD_TOKEN)

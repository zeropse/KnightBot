from typing import Final
import os
import discord
from discord import Intents, Client, Message
from dotenv import load_dotenv
from discord.ext import commands
from keep_alive import keep_alive

keep_alive()

intents = discord.Intents.default()
intents.guilds = True
intents.members = True
intents.messages = True

load_dotenv()
TOKEN: Final[str] = os.getenv('DISCORD_TOKEN')

ROLE_ID = 1171909490229137408 #change it to yours
RULES_CHANNEL_ID = 1171907124830408774 #change it to yours
LOGS_CHANNEL_ID = 1171904382762242150  #change it to yours

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

            other_channel = ctx.guild.get_channel(LOGS_CHANNEL_ID)
            if other_channel:
                await other_channel.send(f"{member.mention} has accepted the rules and gained access to the server!")
            else:
                await ctx.send("Error: Could not find the specified channel.")

@bot.event
async def on_raw_reaction_add(payload):
    channel = bot.get_channel(payload.channel_id)
    if channel.id == RULES_CHANNEL_ID:
        guild = bot.get_guild(payload.guild_id)
        member = guild.get_member(payload.user_id)
        if member and payload.emoji.name == '✅':  
            role = guild.get_role(ROLE_ID)
            if role:
                await member.add_roles(role)
                logs_channel = bot.get_channel(LOGS_CHANNEL_ID)
                if logs_channel:
                    await logs_channel.send(f"{member.mention} has accepted the rules and gained access to the server!")

@bot.event
async def on_raw_reaction_remove(payload):
    channel = bot.get_channel(payload.channel_id)
    if channel.id == RULES_CHANNEL_ID:
        guild = bot.get_guild(payload.guild_id)
        member = guild.get_member(payload.user_id)
        if member and payload.emoji.name == '✅':
            role = guild.get_role(ROLE_ID)
            if role and role in member.roles:
                await member.remove_roles(role)
                logs_channel = bot.get_channel(LOGS_CHANNEL_ID)
                if logs_channel:
                    await logs_channel.send(f"{member.mention} has lost access to the server due to removing reaction.")

bot.run(TOKEN)
// database.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

// Log user acceptance to Supabase
const logUserAcceptanceToDatabase = async (userId, guildId) => {
    const { data, error } = await supabase
        .from('accepted_users')
        .select('user_id, guild_id')
        .eq('user_id', userId)
        .eq('guild_id', guildId);

    // Only insert if the user is not already logged in the database
    if (data.length === 0) {
        const { insertError } = await supabase
            .from('accepted_users')
            .insert([{ user_id: userId, guild_id: guildId }]);

        if (insertError) {
            console.error(`Error logging user acceptance: ${insertError.message}`);
        } else {
            console.log(`User ${userId} accepted the rules and logged to the database.`);
        }
    } else {
        console.log(`User ${userId} is already logged in the database.`);
    }
};

// Remove user acceptance from Supabase
const removeUserAcceptanceFromDatabase = async (userId, guildId) => {
    const { data, error } = await supabase
        .from('accepted_users')
        .select('user_id, guild_id')
        .eq('user_id', userId)
        .eq('guild_id', guildId);

    // Only remove if the user is logged in the database
    if (data.length > 0) {
        const { deleteError } = await supabase
            .from('accepted_users')
            .delete()
            .match({ user_id: userId, guild_id: guildId });

        if (deleteError) {
            console.error(`Error removing user acceptance: ${deleteError.message}`);
        } else {
            console.log(`User ${userId} removed from the database.`);
        }
    } else {
        console.log(`User ${userId} is not found in the database.`);
    }
};

// Load accepted users from Supabase
const loadAcceptedUsers = async (client) => {
    const { data, error } = await supabase
        .from('accepted_users')
        .select('user_id, guild_id');

    if (error) {
        console.error(`Error loading accepted users: ${error.message}`);
    } else {
        data.forEach(async (user) => {
            const guild = client.guilds.cache.get(user.guild_id);
            if (guild) {
                const member = await guild.members.fetch(user.user_id);
                const role = guild.roles.cache.get(process.env.ROLE_ID);
                if (role) {
                    await member.roles.add(role);
                }
            }
        });
    }
};

module.exports = {
    logUserAcceptanceToDatabase,
    removeUserAcceptanceFromDatabase,
    loadAcceptedUsers,
};

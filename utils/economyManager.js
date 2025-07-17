// D:\NoSleepV2\utils\economyManager.js
const { pool } = require('../bot'); // Assuming bot.js exports pool, or pass pool directly

// Function to get a user's balance
async function getUserBalance(userId, guildId, pool) {
    try {
        const res = await pool.query(
            'INSERT INTO user_economy (user_id, guild_id) VALUES ($1, $2) ON CONFLICT (user_id, guild_id) DO NOTHING RETURNING balance',
            [userId, guildId]
        );
        if (res.rows.length > 0) {
            return parseInt(res.rows[0].balance);
        } else {
            // If nothing was returned (conflict occurred), fetch the existing balance
            const existingRes = await pool.query(
                'SELECT balance FROM user_economy WHERE user_id = $1 AND guild_id = $2',
                [userId, guildId]
            );
            return parseInt(existingRes.rows[0].balance);
        }
    } catch (error) {
        console.error(`Error getting balance for user ${userId} in guild ${guildId}:`, error);
        return 0; // Return 0 on error
    }
}

// Function to add/remove money (negative amount to remove)
async function updateBalance(userId, guildId, amount, pool) {
    try {
        const res = await pool.query(
            'INSERT INTO user_economy (user_id, guild_id, balance) VALUES ($1, $2, $3) ON CONFLICT (user_id, guild_id) DO UPDATE SET balance = user_economy.balance + $3 RETURNING balance',
            [userId, guildId, amount]
        );
        return parseInt(res.rows[0].balance);
    } catch (error) {
        console.error(`Error updating balance for user ${userId} in guild ${guildId}:`, error);
        return null; // Return null on error
    }
}

// Function to set a user's balance (e.g., for admin commands)
async function setBalance(userId, guildId, amount, pool) {
    try {
        const res = await pool.query(
            'INSERT INTO user_economy (user_id, guild_id, balance) VALUES ($1, $2, $3) ON CONFLICT (user_id, guild_id) DO UPDATE SET balance = $3 RETURNING balance',
            [userId, guildId, amount]
        );
        return parseInt(res.rows[0].balance);
    } catch (error) {
        console.error(`Error setting balance for user ${userId} in guild ${guildId}:`, error);
        return null;
    }
}

// Function to get last daily claim timestamp
async function getLastDaily(userId, guildId, pool) {
    try {
        const res = await pool.query(
            'SELECT last_daily FROM user_economy WHERE user_id = $1 AND guild_id = $2',
            [userId, guildId]
        );
        return res.rows[0] ? parseInt(res.rows[0].last_daily) : 0;
    } catch (error) {
        console.error(`Error getting last daily for user ${userId} in guild ${guildId}:`, error);
        return 0;
    }
}

// Function to set last daily claim timestamp
async function setLastDaily(userId, guildId, timestamp, pool) {
    try {
        await pool.query(
            'UPDATE user_economy SET last_daily = $3 WHERE user_id = $1 AND guild_id = $2',
            [userId, guildId, timestamp]
        );
        return true;
    } catch (error) {
        console.error(`Error setting last daily for user ${userId} in guild ${guildId}:`, error);
        return false;
    }
}

module.exports = {
    getUserBalance,
    updateBalance,
    setBalance,
    getLastDaily,
    setLastDaily
};
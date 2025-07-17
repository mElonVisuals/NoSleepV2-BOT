/**
 * Calculates the total XP required to reach a specific level.
 * @param {number} level The target level.
 * @returns {number} The total XP needed for that level.
 */
function getXpForLevel(level) {
    // OLD FORMULA: return 5 * (level ** 2) + (50 * level) + 100;
    // NEW FORMULA: Significantly increased XP requirements, especially at higher levels
    return 5 * (level ** 1) + (15 * level) + 50;
}

// Function to get a user's XP and level
async function getUserLevel(userId, guildId, pool) {
    try {
        const res = await pool.query(
            'INSERT INTO user_levels (user_id, guild_id) VALUES ($1, $2) ON CONFLICT (user_id, guild_id) DO NOTHING RETURNING xp, level, last_xp_gain',
            [userId, guildId]
        );
        if (res.rows.length > 0) {
            return res.rows[0];
        } else {
            const existingRes = await pool.query(
                'SELECT xp, level, last_xp_gain FROM user_levels WHERE user_id = $1 AND guild_id = $2',
                [userId, guildId]
            );
            return existingRes.rows[0];
        }
    } catch (error) {
        console.error(`Error getting level for user ${userId} in guild ${guildId}:`, error);
        return { xp: 0, level: 0, last_xp_gain: 0 };
    }
}

// Function to add XP and check for level up
async function addXp(userId, guildId, xpAmount, pool) {
    try {
        const { xp: currentXp, level: currentLevel } = await getUserLevel(userId, guildId, pool);
        let newXp = currentXp + xpAmount;
        let newLevel = currentLevel;
        let levelUp = false;

        // Check for level up
        let xpNeeded = getXpForLevel(newLevel);
        while (newXp >= xpNeeded) {
            newLevel++;
            newXp -= xpNeeded; // Carry over excess XP to the next level
            xpNeeded = getXpForLevel(newLevel); // Calculate XP for the *new* level
            levelUp = true;
        }

        await pool.query(
            `UPDATE user_levels
             SET xp = $3, level = $4, last_xp_gain = $5
             WHERE user_id = $1 AND guild_id = $2`,
            [userId, guildId, newXp, newLevel, Date.now()]
        );

        return { newXp, newLevel, levelUp, currentLevel }; // Return currentLevel for comparison
    } catch (error) {
        console.error(`Error adding XP for user ${userId} in guild ${guildId}:`, error);
        return null;
    }
}

// Function to set XP and level for admin commands
async function setLevelAndXp(userId, guildId, level, xp, pool) {
    try {
        await pool.query(
            `INSERT INTO user_levels (user_id, guild_id, xp, level, last_xp_gain)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, guild_id) DO UPDATE
             SET xp = $3, level = $4, last_xp_gain = $5`,
            [userId, guildId, xp, level, Date.now()]
        );
        return true;
    } catch (error) {
        console.error(`Error setting level/XP for user ${userId} in guild ${guildId}:`, error);
        return false;
    }
}


module.exports = {
    getXpForLevel,
    getUserLevel,
    addXp,
    setLevelAndXp
};
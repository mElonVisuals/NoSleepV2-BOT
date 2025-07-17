
require('dotenv').config();
const { Client, Collection, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const { getUserLevel, addXp, getXpForLevel } = require('./utils/levelManager');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

// Initialize PostgreSQL Pool
const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false // For Coolify, this is likely 'true'
});

// Test PostgreSQL connection
pool.connect()
    .then(client => {
        console.log('Connected to PostgreSQL database successfully!');
        client.release(); // Release the client back to the pool
    })
    .catch(err => {
        console.error('Error connecting to PostgreSQL database:', err.stack);
        console.error('Please ensure your PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE, and PG_SSL environment variables are correct.');
        process.exit(1); // Exit if cannot connect to DB
    });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // Required for guild-related events (e.g., fetching members, channels)
        GatewayIntentBits.GuildMessages,    // Required for message creation events
        GatewayIntentBits.MessageContent,   // Required to read message content (for commands)
        GatewayIntentBits.GuildMembers,     // Required to access guild members (for user info, moderation, etc.)
        GatewayIntentBits.GuildPresences    // Required for member status (if you need it, though not strictly for rich presence itself)
    ],
});

client.commands = new Collection();
client.cooldowns = new Collection();

// Load commands dynamically
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, { ...command, category: folder });
        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// --- Rich Presence Animation Setup ---
const activities = [
    { name: 'your every command! 👀', type: ActivityType.Watching },
    { name: `over ${client.guilds.cache.size} servers 🌐`, type: ActivityType.Watching }, // Dynamic guild count
    { name: 'the stars for you 🌟', type: ActivityType.Watching },
    { name: 'NoSleepV2 come alive 🌙', type: ActivityType.Playing },
    { name: 'with the PostgreSQL database 🗄️', type: ActivityType.Playing },
    { name: 'Type !help for guidance 📚', type: ActivityType.Playing },
    { name: 'for new updates! ✨', type: ActivityType.Listening },
    { name: 'the whispers of the server 🤫', type: ActivityType.Listening },
    { name: 'the server rules 📜', type: ActivityType.Competing }
];

let activityIndex = 0; // To keep track of the current activity

function updatePresence() {
    const activity = activities[activityIndex];

    // Handle dynamic values, specifically for guild count
    let currentActivityName = activity.name;
    if (currentActivityName.includes('${client.guilds.cache.size}')) {
        // Ensure client.guilds.cache is populated before trying to get size
        if (client.isReady()) {
            currentActivityName = `over ${client.guilds.cache.size} servers 🌐`;
        } else {
            currentActivityName = `starting up...`; // Fallback if client isn't ready yet
        }
    }

    client.user.setActivity(currentActivityName, { type: activity.type });
    console.log(`Set presence to: ${ActivityType[activity.type]} ${currentActivityName}`);

    activityIndex = (activityIndex + 1) % activities.length; // Cycle to the next activity
}
// --- End Rich Presence Animation Setup ---


client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        // ... existing CREATE TABLE statements for guild_settings and warnings ...

        // NEW: Create user_economy table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_economy (
                user_id VARCHAR(20) NOT NULL,
                guild_id VARCHAR(20) NOT NULL,
                balance BIGINT DEFAULT 0,
                last_daily BIGINT DEFAULT 0,
                PRIMARY KEY (user_id, guild_id)
            );
        `);

        // NEW: Create user_levels table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_levels (
                user_id VARCHAR(20) NOT NULL,
                guild_id VARCHAR(20) NOT NULL,
                xp BIGINT DEFAULT 0,
                level INT DEFAULT 0,
                last_xp_gain BIGINT DEFAULT 0,
                PRIMARY KEY (user_id, guild_id)
            );
        `);
        console.log('PostgreSQL tables checked/created: guild_settings, warnings, user_economy, user_levels.');

    } catch (err) {
        console.error('Error initializing database tables or migrating data:', err.stack);
        process.exit(1); // Exit if database setup fails
    }

    try {
        // Create guild_settings table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id VARCHAR(20) PRIMARY KEY,
                prefix VARCHAR(5) DEFAULT '!',
                mod_log_channel_id VARCHAR(20),
                mod_log_webhook_url TEXT
            );
        `);

        // Create warnings table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS warnings (
                id SERIAL PRIMARY KEY,
                guild_id VARCHAR(20) NOT NULL,
                user_id VARCHAR(20) NOT NULL,
                executor_id VARCHAR(20) NOT NULL,
                reason TEXT,
                timestamp BIGINT NOT NULL
            );
        `);
        console.log('PostgreSQL tables checked/created: guild_settings, warnings.');

        // Migrate settings from old settings.json if it exists
        const settingsPath = './data/settings.json';
        if (fs.existsSync(settingsPath)) {
            try {
                const oldGuildSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                for (const guildId in oldGuildSettings) {
                    const settings = oldGuildSettings[guildId];
                    // Check if guild already exists in DB to prevent duplicates
                    const existing = await pool.query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId]);
                    if (existing.rows.length === 0) {
                        await pool.query(`
                            INSERT INTO guild_settings (guild_id, prefix, mod_log_channel_id, mod_log_webhook_url)
                            VALUES ($1, $2, $3, $4)
                        `, [
                            guildId,
                            settings.prefix || '!',
                            settings.modLogChannelId || null,
                            settings.modLogWebhookUrl || null
                        ]);
                        console.log(`Migrated settings for guild ${guildId} from settings.json.`);
                    }
                }
                // Rename old settings.json after successful migration to prevent re-migration
                fs.renameSync(settingsPath, './data/settings_OLD.json');
                console.log('Migrated existing settings from settings.json to PostgreSQL. Old file renamed to settings_OLD.json.');
            } catch (jsonErr) {
                console.error('Error migrating settings.json:', jsonErr.stack);
            }
        }

    } catch (err) {
        console.error('Error initializing database tables or migrating data:', err.stack);
        process.exit(1); // Exit if database setup fails
    }

    // Start the presence update interval
    updatePresence(); // Set initial presence immediately
    setInterval(updatePresence, 10000); // Change every 10 seconds (10000 ms)
});

client.on('messageCreate', async message => {
    // Ignore bot messages, messages outside of a guild, and messages that are commands
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    let currentGuildSettings;

    try {
        // ... existing database fetching/creation for guild_settings ...
        let result = await pool.query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId]);
        currentGuildSettings = result.rows[0];

        if (!currentGuildSettings) {
            await pool.query(`
                INSERT INTO guild_settings (guild_id)
                VALUES ($1)
            `, [guildId]);
            result = await pool.query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId]);
            currentGuildSettings = result.rows[0];
            console.log(`Created default settings for new guild: ${message.guild.name} (${guildId})`);
        }
    } catch (dbError) {
        console.error(`Error fetching/creating guild settings for ${guildId}:`, dbError.stack);
        if (message.channel.type === 0) {
            message.reply('An error occurred while fetching server settings. Please try again later.').catch(err => console.error('Failed to reply with DB error:', err));
        }
        return;
    }

    const guildPrefix = currentGuildSettings.prefix || '!';

    // --- XP GAIN LOGIC (NEW) ---
    const XP_COOLDOWN = 280 * 1000; // 60 seconds cooldown for XP gain per user
    const XP_PER_MESSAGE_MIN = 5;
    const XP_PER_MESSAGE_MAX = 5;

    const userLevelData = await getUserLevel(message.author.id, guildId, pool);
    const lastXpGain = userLevelData.last_xp_gain;

    if (Date.now() - lastXpGain > XP_COOLDOWN) {
        const xpAmount = Math.floor(Math.random() * (XP_PER_MESSAGE_MAX - XP_PER_MESSAGE_MIN + 1)) + XP_PER_MESSAGE_MIN;
        const { newXp, newLevel, levelUp, currentLevel } = await addXp(message.author.id, guildId, xpAmount, pool);

        if (levelUp) {
            const levelUpEmbed = new EmbedBuilder()
                .setColor(0x7289DA) // Discord Dark Blurple for Level Up
                .setTitle('🎉 Level Up!')
                .setDescription(`Congratulations, ${message.author}! You've reached **Level ${newLevel}**!`)
                .addFields(
                    { name: 'Current XP', value: `${newXp}`, inline: true },
                    { name: 'Next Level XP', value: `${getXpForLevel(newLevel)}`, inline: true }
                )
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Keep chatting to earn more XP!`, iconURL: client.user.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ content: `Well done, ${message.author}!`, embeds: [levelUpEmbed] }).catch(err => console.error('Failed to send level up message:', err));
            // You could also add logic here to give level-up roles.
        }
    }
    // --- END XP GAIN LOGIC ---

    // Ignore messages that don't start with the guild's prefix (after XP logic)
    if (!message.content.startsWith(guildPrefix)) return;

    // ... existing command parsing and execution logic ...
    const args = message.content.slice(guildPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    // Cooldowns logic (existing)
    const { cooldowns } = client;
    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownDuration = command.data.cooldown || 3;
    const cooldownAmount = defaultCooldownDuration * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply({
                content: `Please wait \`${timeLeft.toFixed(1)}\` more second(s) before reusing the \`${command.data.name}\` command.`,
                ephemeral: true
            }).then(msg => {
            }).catch(err => console.error('Failed to send cooldown reply:', err));
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // Execute the command (existing)
    try {
        await command.execute(message, args, client, currentGuildSettings, pool);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        if (message.channel.type === 0) {
            await message.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch(err => console.error('Failed to send error reply:', err));
        } else {
            console.warn(`Could not send error reply to DM for command ${commandName}.`);
        }
    }
});

// Log in to Discord
const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) {
    console.error('DISCORD_BOT_TOKEN environment variable is not set. Please set it in your .env file or Coolify environment variables.');
    process.exit(1);
}
client.login(TOKEN);
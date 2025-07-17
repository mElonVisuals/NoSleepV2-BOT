// D:\NoSleepV2\bot.js
require('dotenv').config();
const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js'); // Import ActivityType
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

// Initialize PostgreSQL Pool (keep as is)
const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pool.connect()
    .then(client => {
        console.log('Connected to PostgreSQL database successfully!');
        client.release();
    })
    .catch(err => {
        console.error('Error connecting to PostgreSQL database:', err.stack);
        process.exit(1);
    });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.commands = new Collection();
client.cooldowns = new Collection();

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
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// --- Rich Presence Animation Setup ---
const activities = [
    { name: 'your commands!', type: ActivityType.Watching },
    { name: 'the server', type: ActivityType.Watching },
    { name: 'NoSleepV2', type: ActivityType.Playing }, // Example of a Playing status
    { name: 'with Postgres', type: ActivityType.Playing },
    { name: `over ${client.guilds.cache.size} servers!`, type: ActivityType.Watching }, // Dynamic value
    { name: `!help for commands`, type: ActivityType.Playing }
    // Add more activities as desired!
];

let activityIndex = 0; // To keep track of the current activity

function updatePresence() {
    const activity = activities[activityIndex];

    // Handle dynamic values if needed, e.g., guild count
    if (activity.name.includes('${client.guilds.cache.size}')) {
        activity.name = `over ${client.guilds.cache.size} servers!`;
    }

    client.user.setActivity(activity.name, { type: activity.type });
    console.log(`Set presence to: ${ActivityType[activity.type]} ${activity.name}`); // Log for debugging

    activityIndex = (activityIndex + 1) % activities.length; // Cycle to the next activity
}
// --- End Rich Presence Animation Setup ---


client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id VARCHAR(20) PRIMARY KEY,
                prefix VARCHAR(5) DEFAULT '!',
                mod_log_channel_id VARCHAR(20),
                mod_log_webhook_url TEXT
            );
        `);

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
        console.log('PostgreSQL tables checked/created.');

        const settingsPath = './data/settings.json';
        if (fs.existsSync(settingsPath)) {
            const oldGuildSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            for (const guildId in oldGuildSettings) {
                const settings = oldGuildSettings[guildId];
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
                }
            }
            console.log('Migrated existing settings from settings.json to PostgreSQL (if any).');
            // fs.renameSync(settingsPath, './data/settings_OLD.json'); // Uncomment to rename old settings.json
        }

    } catch (err) {
        console.error('Error initializing database tables or migrating data:', err.stack);
        process.exit(1);
    }

    // --- Start the presence update interval ---
    updatePresence(); // Set initial presence immediately
    setInterval(updatePresence, 10000); // Change every 10 seconds (10000 ms)
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    let result = await pool.query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId]);
    let currentGuildSettings = result.rows[0];

    if (!currentGuildSettings) {
        await pool.query(`
            INSERT INTO guild_settings (guild_id)
            VALUES ($1)
        `, [guildId]);
        result = await pool.query('SELECT * FROM guild_settings WHERE guild_id = $1', [guildId]);
        currentGuildSettings = result.rows[0];
    }

    const guildPrefix = currentGuildSettings.prefix || '!';

    if (!message.content.startsWith(guildPrefix)) return;

    const args = message.content.slice(guildPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

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
            return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.data.name}\` command.`).then(msg => {
                setTimeout(() => msg.delete().catch(console.error), 5000);
            });
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
        await command.execute(message, args, client, currentGuildSettings, pool);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        if (message.channel.type === 0) {
            await message.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            console.warn(`Could not reply to error in DM for command ${commandName}.`);
        }
    }
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
client.login(TOKEN);
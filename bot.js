// D:\NoSleepV2\bot.js

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const {
    Client,
    GatewayIntentBits,
    Partials,
    ActivityType,
    Collection, // Make sure Collection is imported
    PermissionsBitField // Make sure PermissionsBitField is imported
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Needed for fetching members
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // REQUIRED for accessing message.content
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember], // Recommended for older data
});

client.commands = new Collection();
client.cooldowns = new Collection(); // NEW: Cooldowns collection

// Load commands
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            command.category = folder; // Store the category
            client.commands.set(command.data.name, command);
        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Store guild settings (for prefixes) - in a real bot, use a database
const guildSettings = require('./data/settings.json');
const saveGuildSettings = () => {
    fs.writeFileSync('./data/settings.json', JSON.stringify(guildSettings, null, 2));
};

// Client ready event
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({
        activities: [{
            name: 'over the server',
            type: ActivityType.Watching,
            url: 'https://discord.gg/FxKsPGvmqW/' // This URL is ignored for ActivityType.Watching
        }],
        status: 'dnd',
    });
    console.log('Rich Presence set!');
});

// Message Create Event (for prefix commands)
client.on('messageCreate', async message => {
    if (message.author.bot) return; // Ignore bots
    if (message.channel.partial) await message.channel.fetch(); // Fetch partial channels
    if (message.partial) await message.fetch(); // Fetch partial messages

    const guildPrefix = guildSettings[message.guild.id]?.prefix || '!';
    let prefix = guildPrefix;

    // Handle @bot mention as prefix
    const mentionPrefix = new RegExp(`^<@!?${client.user.id}> `);
    if (mentionPrefix.test(message.content)) {
        prefix = message.content.match(mentionPrefix)[0];
    } else if (!message.content.startsWith(guildPrefix)) {
        return; // Not a command
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Handle setprefix command (if it's not a separate file)
    if (commandName === 'setprefix') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply({ content: 'You need `Administrator` permissions to change the prefix.', ephemeral: true }); // MODIFIED
        }

        const newPrefix = args[0];
        if (!newPrefix) {
            return message.reply({ content: `The current prefix is \`${guildPrefix}\`. To change it, use \`${guildPrefix}setprefix <new_prefix>\`.`, ephemeral: true }); // MODIFIED
        }
        if (newPrefix.length > 5) {
            return message.reply({ content: 'The prefix can be at most 5 characters long.', ephemeral: true }); // MODIFIED
        }

        guildSettings[message.guild.id] = { prefix: newPrefix };
        saveGuildSettings();
        return message.reply({ content: `Prefix changed to \`${newPrefix}\`!`, ephemeral: true });
    }

    // --- Cooldown Logic (NEW) ---
    const { cooldowns } = client;
    const command = client.commands.get(commandName);

    if (!command) return; // If command doesn't exist after handling setprefix, ignore

    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownDuration = 3; // Default cooldown if not specified in command
    const cooldownAmount = (command.data.cooldown || defaultCooldownDuration) * 1000; // Convert to milliseconds

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply({
                content: `Please wait \`${timeLeft.toFixed(1)}\` more second(s) before reusing the \`${command.data.name}\` command.`,
                ephemeral: true
            });
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    // --- End Cooldown Logic ---

    try {
        // MODIFIED: Pass guildSettings to the command's execute function
        await command.execute(message, args, client, guildSettings);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        if (message.channel.send) {
            await message.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});



// Interaction Create Event (for buttons, select menus etc. - not for prefix commands)
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'standard_button_click') {
        await interaction.reply({
            content: 'You clicked the **standard** Discord.js button!',
            ephemeral: true
        });
    }
    // Link buttons (ButtonStyle.Link) do not trigger this interactionCreate event.
    // They just open the URL.
});


const TOKEN = process.env.DISCORD_BOT_TOKEN;

client.login(TOKEN);
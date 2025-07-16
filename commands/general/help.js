// D:\NoSleepV2\commands\general\help.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'help',
        description: 'Displays a list of all commands.',
        cooldown: 5,
    },
    async execute(message, args, client, guildSettings) {
        const guildPrefix = guildSettings[message.guild.id]?.prefix || '!';

        const commands = client.commands; // This is a Discord.js Collection

        // If a specific command is requested (e.g., !help ping)
        if (args.length > 0) {
            const commandName = args[0].toLowerCase();
            const command = commands.get(commandName);

            if (!command) {
                return message.reply({ content: `❌ Command \`${commandName}\` not found! Try \`${guildPrefix}help\` for a list of all commands.`, ephemeral: true });
            }

            const commandHelpEmbed = new EmbedBuilder()
                .setColor(0x5865f2) // Discord's new blue
                .setTitle(`Command: \`${guildPrefix}${command.data.name}\``)
                .setDescription(command.data.description || 'No description provided.')
                .addFields(
                    { name: 'Category', value: command.category ? command.category.charAt(0).toUpperCase() + command.category.slice(1) : 'Uncategorized', inline: true },
                    { name: 'Cooldown', value: `\`${command.data.cooldown || 3} seconds\``, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            // You can add more fields here if your command objects have more properties like usage examples
            // if (command.data.usage) {
            //     commandHelpEmbed.addFields({ name: 'Usage', value: `\`${guildPrefix}${command.data.name} ${command.data.usage}\``, inline: false });
            // }

            return message.channel.send({ embeds: [commandHelpEmbed] });
        }

        // --- Main Help Embed (if no specific command is requested) ---
        const categorizedCommands = new Map();
        commands.forEach(cmd => {
            const folder = cmd.category || 'Uncategorized';
            if (!categorizedCommands.has(folder)) {
                categorizedCommands.set(folder, []);
            }
            categorizedCommands.get(folder).push(cmd);
        });

        const sortedCategories = Array.from(categorizedCommands.keys()).sort();

        const helpFields = [];

        for (const folderName of sortedCategories) {
            const cmds = categorizedCommands.get(folderName);
            cmds.sort((a, b) => a.data.name.localeCompare(b.data.name)); // Sort commands alphabetically

            // List only command names, separated by ` ` or `, `
            const commandNames = cmds.map(cmd => `\`${cmd.data.name}\``).join(', ');

            helpFields.push({
                name: `__${folderName.charAt(0).toUpperCase() + folderName.slice(1)} Commands (${cmds.length})__`, // Category name with count
                value: commandNames,
                inline: false, // Each category gets its own line
            });
        }

        // Calculate bot uptime
        let totalSeconds = (client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;


        const helpEmbed = new EmbedBuilder()
            .setColor(0x5865f2) // Discord's new blue for main embed
            .setTitle(`🤖 ${client.user.username} Command Guide`)
            .setDescription(`Hello! I'm **${client.user.username}**, a versatile bot designed to enhance your server experience. Below is a categorized list of my commands.`)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                ...helpFields, // Spread the dynamically generated category fields
                { name: '\u200b', value: '---' }, // A visual separator
                { name: '💡 Get More Help', value: `For detailed information on a specific command, use \`${guildPrefix}help <command-name>\` (e.g., \`${guildPrefix}help ping\`).`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Uptime: ${uptime} | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [helpEmbed] });
    },
};
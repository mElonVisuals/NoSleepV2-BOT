// D:\NoSleepV2\commands\general\help.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'help',
        description: 'Displays a list of all commands or detailed info for a specific command.',
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const guildPrefix = currentGuildSettings.prefix || '!';

        // If a specific command is requested (e.g., !help ping)
        if (args.length > 0) {
            const commandName = args[0].toLowerCase();
            const command = client.commands.get(commandName);

            if (!command) {
                return message.reply({ content: `❌ Command \`${commandName}\` not found! Try \`${guildPrefix}help\` for a list of all commands.`, ephemeral: true });
            }

            const commandHelpEmbed = new EmbedBuilder()
                .setColor(0x5865f2) // Discord Blurple for general info
                .setTitle(`📚 Command: \`${guildPrefix}${command.data.name}\``)
                .setDescription(command.data.description || 'No description provided.')
                .addFields(
                    { name: 'Category', value: command.category ? `\`${command.category.charAt(0).toUpperCase() + command.category.slice(1)}\`` : '`Uncategorized`', inline: true },
                    { name: 'Cooldown', value: `\`${command.data.cooldown || 3} seconds\``, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            return message.channel.send({ embeds: [commandHelpEmbed] });
        }

        // --- Main Help Embed (if no specific command is requested) ---
        const categorizedCommands = new Map();
        client.commands.forEach(cmd => {
            // Filter out internal commands if any (e.g., if you had commands not meant for !help)
            // if (cmd.data.hidden) return; // Example: Add a 'hidden: true' property to command.data if you want to hide it

            const folder = cmd.category || 'Uncategorized';
            if (!categorizedCommands.has(folder)) {
                categorizedCommands.set(folder, []);
            }
            categorizedCommands.get(folder).push(cmd);
        });

        const sortedCategories = Array.from(categorizedCommands.keys()).sort();

        const helpFields = [];
        let totalCommands = 0;

        for (const folderName of sortedCategories) {
            const cmds = categorizedCommands.get(folderName);
            cmds.sort((a, b) => a.data.name.localeCompare(b.data.name));
            totalCommands += cmds.length;

            const commandNames = cmds.map(cmd => `\`${cmd.data.name}\``).join(', ');

            helpFields.push({
                name: `__${folderName.charAt(0).toUpperCase() + folderName.slice(1)} Commands (${cmds.length})__`,
                value: commandNames,
                inline: false,
            });
        }

        // Calculate uptime
        let totalSeconds = (client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const helpEmbed = new EmbedBuilder()
            .setColor(0x5865f2) // Discord Blurple
            .setTitle(`🤖 ${client.user.username} Command Guide`)
            .setDescription(`Hello! I'm **${client.user.username}**, a versatile bot designed to enhance your server experience. Below is a categorized list of my commands.\n\nMy prefix in this server is: \`${guildPrefix}\``)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                ...helpFields,
                { name: '\u200b', value: '---' }, // Blank field for separation
                { name: '💡 Get More Help', value: `For detailed information on a specific command, use \`${guildPrefix}help <command-name>\` (e.g., \`${guildPrefix}help ping\`).`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Uptime: ${uptime} | Total Commands: ${totalCommands} | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [helpEmbed] });
    },
};
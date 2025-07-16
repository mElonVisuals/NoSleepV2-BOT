// D:\NoSleepV2\commands\moderation\warn.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { sendModLogWebhook } = require('../../utils/webhookLogger');
const fs = require('node:fs'); // Needed to save settings.json

module.exports = {
    data: {
        name: 'warn',
        description: 'Issues a warning to a user.',
        cooldown: 5,
    },
    async execute(message, args, client, guildSettings) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) { // Often kick/ban perms for warn
            return message.reply({ content: '🚫 You do not have permission to warn members.', ephemeral: true });
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!member) {
            return message.reply({ content: '❌ Please mention a user or provide their ID to warn.', ephemeral: true });
        }

        if (member.id === message.author.id) {
            return message.reply({ content: '😅 You cannot warn yourself!', ephemeral: true });
        }

        // Prevent warning higher roles
        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply({ content: '⚠️ You cannot warn someone with an equal or higher role than yourself.', ephemeral: true });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        // Ensure guild has a warnings object
        if (!guildSettings[message.guild.id].warnings) {
            guildSettings[message.guild.id].warnings = {};
        }
        if (!guildSettings[message.guild.id].warnings[member.id]) {
            guildSettings[message.guild.id].warnings[member.id] = [];
        }

        // Add the warning
        const warning = {
            id: guildSettings[message.guild.id].warnings[member.id].length + 1, // Simple ID for each warn
            executor: message.author.id,
            reason: reason,
            timestamp: Date.now()
        };
        guildSettings[message.guild.id].warnings[member.id].push(warning);

        // Save settings to JSON file (THIS IS NOT SCALABLE FOR PRODUCTION)
        fs.writeFileSync('./data/settings.json', JSON.stringify(guildSettings, null, 2));

        try {
            // Inform the user
            await member.send({ content: `You have been warned in **${message.guild.name}** for: \`${reason}\`\nTotal warnings: ${guildSettings[message.guild.id].warnings[member.id].length}` }).catch(() => {
                // If DM fails, send to channel
                message.channel.send({ content: `⚠️ Could not DM ${member.user.tag}. They have been warned for: \`${reason}\`. Total warnings: ${guildSettings[message.guild.id].warnings[member.id].length}`, ephemeral: false });
            });

            // Send webhook log
            sendModLogWebhook({
                guildId: message.guild.id,
                guildSettings: guildSettings,
                action: 'Warn',
                executor: message.author,
                target: member.user,
                reason: reason,
                color: 0xf1c40f // Yellow/Orange for warnings
            });

            const warnEmbed = new EmbedBuilder()
                .setColor(0xf1c40f)
                .setTitle('⚠️ User Warned')
                .setDescription(`**${member.user.tag}** has been warned.`)
                .addFields(
                    { name: '👤 Warned User', value: `${member.user.tag} (\`${member.id}\`)`, inline: false },
                    { name: '👮 Warned By', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: false },
                    { name: '💬 Reason', value: reason, inline: false },
                    { name: '📊 Total Warnings', value: `${guildSettings[message.guild.id].warnings[member.id].length}`, inline: false }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Warn ID: ${warning.id}`, iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [warnEmbed] });

        } catch (error) {
            console.error(error);
            await message.reply({ content: 'An unexpected error occurred while trying to warn this member. Please check my permissions.', ephemeral: true });
        }
    },
};
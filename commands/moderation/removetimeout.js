// D:\NoSleepV2\commands\moderation\removetimeout.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { sendModLogWebhook } = require('../../utils/webhookLogger');

module.exports = {
    data: {
        name: 'removetimeout',
        description: 'Removes a user from timeout.',
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply({ content: '🚫 You do not have permission to remove timeouts.', ephemeral: true });
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.reply({ content: '❌ Please mention a user or provide their ID to remove timeout from.', ephemeral: true });
        }

        if (member.id === client.user.id) {
            return message.reply({ content: '🤦 I cannot remove timeout from myself.', ephemeral: true });
        }

        if (!member.moderatable) { // Check if bot can moderate the user
            return message.reply({ content: '⚠️ I cannot remove timeout from this user. They might have a higher role or insufficient permissions.', ephemeral: true });
        }
        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply({ content: '⚠️ You cannot remove timeout from someone with an equal or higher role than yourself.', ephemeral: true });
        }

        if (!member.isCommunicationDisabled()) { // Check if user is actually in timeout
            return message.reply({ content: `✅ ${member.user.tag} is not currently in timeout.`, ephemeral: true });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.timeout(null, reason); // Pass null to remove timeout

            // Send webhook log
            sendModLogWebhook({
                guildId: message.guild.id,
                guildSettings: currentGuildSettings,
                action: 'Remove Timeout',
                executor: message.author,
                target: member.user,
                reason: reason,
                color: 0x2ecc71 // Green for success/removal
            });

            const removeTimeoutEmbed = new EmbedBuilder()
                .setColor(0x2ecc71) // Green for success
                .setTitle('✅ Timeout Removed')
                .setDescription(`Timeout has been successfully removed for **${member.user.tag}**.`)
                .addFields(
                    { name: '👤 User', value: `${member.user.tag} (\`${member.id}\`)`, inline: false },
                    { name: '👮 Removed By', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: false },
                    { name: '💬 Reason', value: reason, inline: false }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Timeout removal executed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [removeTimeoutEmbed] });

        } catch (error) {
            console.error('Error removing timeout:', error.stack);
            await message.reply({ content: '❌ An unexpected error occurred while trying to remove timeout from this member. Please check my permissions.', ephemeral: true });
        }
    },
};
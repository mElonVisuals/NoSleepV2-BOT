// D:\NoSleepV2\commands\moderation\kick.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { sendModLogWebhook } = require('../../utils/webhookLogger');

module.exports = {
    data: {
        name: 'kick',
        description: 'Kicks a user from the server.',
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings) { // No pool needed for kick operation
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply({ content: '🚫 You do not have permission to kick members.', ephemeral: true });
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!member) {
            return message.reply({ content: '❌ Please mention a user or provide their ID to kick.', ephemeral: true });
        }

        if (member.id === message.author.id) {
            return message.reply({ content: '😅 You cannot kick yourself!', ephemeral: true });
        }

        if (member.id === client.user.id) {
            return message.reply({ content: '🤦 I cannot kick myself.', ephemeral: true });
        }

        if (!member.kickable) {
            return message.reply({ content: '⚠️ I cannot kick this user. They might have a higher role or insufficient permissions.', ephemeral: true });
        }

        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply({ content: '⚠️ You cannot kick someone with an equal or higher role than yourself.', ephemeral: true });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.kick(reason);

            // Send webhook log
            sendModLogWebhook({
                guildId: message.guild.id,
                guildSettings: currentGuildSettings,
                action: 'Kick',
                executor: message.author,
                target: member.user,
                reason: reason,
                color: 0xed4245 // Red for kick
            });

            const kickEmbed = new EmbedBuilder()
                .setColor(0xed4245) // Red for kick
                .setTitle('👢 User Kicked')
                .setDescription(`**${member.user.tag}** has been kicked from the server.`)
                .addFields(
                    { name: '👤 Kicked User', value: `${member.user.tag} (\`${member.id}\`)`, inline: false },
                    { name: '👮 Kicked By', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: false },
                    { name: '💬 Reason', value: reason, inline: false }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Kick executed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [kickEmbed] });

        } catch (error) {
            console.error('Error kicking member:', error);
            await message.reply({ content: '❌ An unexpected error occurred while trying to kick this member. Please check my permissions.', ephemeral: true });
        }
    },
};
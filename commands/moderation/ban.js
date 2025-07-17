// D:\NoSleepV2\commands\moderation\ban.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { sendModLogWebhook } = require('../../utils/webhookLogger');

module.exports = {
    data: {
        name: 'ban',
        description: 'Bans a user from the server.',
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings) { // No pool needed for ban operation directly
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply({ content: '🚫 You do not have permission to ban members.', ephemeral: true });
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!member) {
            return message.reply({ content: '❌ Please mention a user or provide their ID to ban.', ephemeral: true });
        }

        if (member.id === message.author.id) {
            return message.reply({ content: '😅 You cannot ban yourself!', ephemeral: true });
        }

        if (member.id === client.user.id) {
            return message.reply({ content: '🤦 I cannot ban myself.', ephemeral: true });
        }

        if (!member.bannable) {
            return message.reply({ content: '⚠️ I cannot ban this user. They might have a higher role or insufficient permissions.', ephemeral: true });
        }

        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply({ content: '⚠️ You cannot ban someone with an equal or higher role than yourself.', ephemeral: true });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.ban({ reason: reason });

            // Send webhook log
            sendModLogWebhook({
                guildId: message.guild.id,
                guildSettings: currentGuildSettings,
                action: 'Ban',
                executor: message.author,
                target: member.user,
                reason: reason,
                color: 0xed4245 // Red for ban
            });

            const banEmbed = new EmbedBuilder()
                .setColor(0xed4245) // Red for ban
                .setTitle('🔨 User Banned')
                .setDescription(`**${member.user.tag}** has been banned from the server.`)
                .addFields(
                    { name: '👤 Banned User', value: `${member.user.tag} (\`${member.id}\`)`, inline: false },
                    { name: '👮 Banned By', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: false },
                    { name: '💬 Reason', value: reason, inline: false }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Ban executed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [banEmbed] });

        } catch (error) {
            console.error('Error banning member:', error);
            await message.reply({ content: '❌ An unexpected error occurred while trying to ban this member. Please check my permissions.', ephemeral: true });
        }
    },
};
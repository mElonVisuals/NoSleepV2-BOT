// D:\NoSleepV2\commands\moderation\ban.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { sendModLogWebhook } = require('../../utils/webhookLogger');

module.exports = {
    data: {
        name: 'ban',
        description: 'Bans a user from the server.',
        cooldown: 10,
    },
    async execute(message, args, client, guildSettings) {
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

        if (!member.bannable) { // Use bannable property for clarity
            return message.reply({ content: '⛔ I cannot ban this member. Their role might be higher than mine, or they are an administrator.', ephemeral: true });
        }

        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply({ content: '⚠️ You cannot ban someone with an equal or higher role than yourself.', ephemeral: true });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.ban({ reason });

            sendModLogWebhook({
                guildId: message.guild.id,
                guildSettings: guildSettings,
                action: 'Ban',
                executor: message.author,
                target: member.user,
                reason: reason,
                color: 0xe74c3c // Red color for bans (danger)
            });

            const banEmbed = new EmbedBuilder()
                .setColor(0xe74c3c) // Red color for bans
                .setTitle('🔨 Member Banned')
                .setDescription(`**${member.user.tag}** has been banned from the server.`)
                .addFields(
                    { name: '👤 Banned User', value: `${member.user.tag} (${member.id})`, inline: false }, // Use inline: false for better readability here
                    { name: '👮 Banned By', value: `${message.author.tag} (${message.author.id})`, inline: false },
                    { name: '💬 Reason', value: reason, inline: false }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Ban ID: ${member.id}`, iconURL: client.user.displayAvatarURL() }); // Bot's avatar in footer

            await message.channel.send({ embeds: [banEmbed] });
        } catch (error) {
            console.error(error);
            await message.reply({ content: 'An unexpected error occurred while trying to ban this member. Please check my permissions.', ephemeral: true });
        }
    },
};
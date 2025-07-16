// D:\NoSleepV2\commands\moderation\kick.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { sendModLogWebhook } = require('../../utils/webhookLogger');

module.exports = {
    data: {
        name: 'kick',
        description: 'Kicks a user from the server.',
        cooldown: 10,
    },
    async execute(message, args, client, guildSettings) {
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

        if (!member.kickable) {
            return message.reply({ content: '⛔ I cannot kick this member. Their role might be higher than mine, or they are an administrator.', ephemeral: true });
        }

        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply({ content: '⚠️ You cannot kick someone with an equal or higher role than yourself.', ephemeral: true });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.kick(reason);

            sendModLogWebhook({
                guildId: message.guild.id,
                guildSettings: guildSettings,
                action: 'Kick',
                executor: message.author,
                target: member.user,
                reason: reason,
                color: 0xffa500 // Orange color for kicks
            });

            const kickEmbed = new EmbedBuilder()
                .setColor(0xffa500) // Orange color for kicks
                .setTitle('👢 Member Kicked')
                .setDescription(`**${member.user.tag}** has been kicked from the server.`)
                .addFields(
                    { name: '👤 Kicked User', value: `${member.user.tag} (${member.id})`, inline: false },
                    { name: '👮 Kicked By', value: `${message.author.tag} (${message.author.id})`, inline: false },
                    { name: '💬 Reason', value: reason, inline: false }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Kick ID: ${member.id}`, iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [kickEmbed] });
        } catch (error) {
            console.error(error);
            await message.reply({ content: 'An unexpected error occurred while trying to kick this member. Please check my permissions.', ephemeral: true });
        }
    },
};
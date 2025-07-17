// D:\NoSleepV2\commands\moderation\timeout.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { sendModLogWebhook } = require('../../utils/webhookLogger');

module.exports = {
    data: {
        name: 'timeout',
        description: 'Puts a user in timeout for a specified duration (d, h, m, s).',
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply({ content: '🚫 You do not have permission to timeout members.', ephemeral: true });
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.reply({ content: '❌ Please mention a user or provide their ID to timeout.', ephemeral: true });
        }

        if (member.id === message.author.id) {
            return message.reply({ content: '😅 You cannot timeout yourself!', ephemeral: true });
        }
        if (member.id === client.user.id) {
            return message.reply({ content: '🤦 I cannot timeout myself.', ephemeral: true });
        }

        if (!member.moderatable) { // Check if bot can moderate the user
            return message.reply({ content: '⚠️ I cannot timeout this user. They might have a higher role or insufficient permissions.', ephemeral: true });
        }
        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply({ content: '⚠️ You cannot timeout someone with an equal or higher role than yourself.', ephemeral: true });
        }

        const durationString = args[1]; // e.g., '10m', '1d', '3h'
        if (!durationString) {
            return message.reply({ content: '❌ Please provide a duration for the timeout (e.g., `10m`, `1h`, `1d`).', ephemeral: true });
        }

        let ms = 0;
        const matches = durationString.match(/(\d+)([smhd])/g);
        if (!matches) {
            return message.reply({ content: '❌ Invalid duration format. Use `s` (seconds), `m` (minutes), `h` (hours), `d` (days). Example: `1h30m`.', ephemeral: true });
        }

        for (const match of matches) {
            const num = parseInt(match.slice(0, -1));
            const unit = match.slice(-1);
            switch (unit) {
                case 's': ms += num * 1000; break;
                case 'm': ms += num * 1000 * 60; break;
                case 'h': ms += num * 1000 * 60 * 60; break;
                case 'd': ms += num * 1000 * 60 * 60 * 24; break;
                default: return message.reply({ content: '❌ Invalid duration unit. Use `s`, `m`, `h`, `d`.', ephemeral: true });
            }
        }

        // Discord API limits timeouts to 28 days (28 * 24 * 60 * 60 * 1000 ms)
        const maxTimeoutMs = 28 * 24 * 60 * 60 * 1000;
        if (ms > maxTimeoutMs) {
            return message.reply({ content: '❌ The maximum timeout duration is 28 days.', ephemeral: true });
        }
        if (ms <= 0) {
            return message.reply({ content: '❌ The timeout duration must be greater than 0.', ephemeral: true });
        }


        const reason = args.slice(2).join(' ') || 'No reason provided';

        try {
            await member.timeout(ms, reason);

            // Format duration for embed
            let durationDisplay = '';
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) durationDisplay += `${days}d `;
            if (hours % 24 > 0) durationDisplay += `${hours % 24}h `;
            if (minutes % 60 > 0) durationDisplay += `${minutes % 60}m `;
            if (seconds % 60 > 0 || durationDisplay === '') durationDisplay += `${seconds % 60}s`;
            durationDisplay = durationDisplay.trim();


            // Send webhook log
            sendModLogWebhook({
                guildId: message.guild.id,
                guildSettings: currentGuildSettings,
                action: 'Timeout',
                executor: message.author,
                target: member.user,
                reason: reason,
                duration: durationDisplay, // Pass formatted duration to webhook
                color: 0xed4245 // Red for timeout
            });

            const timeoutEmbed = new EmbedBuilder()
                .setColor(0xed4245) // Red for timeout
                .setTitle('⏳ User Timed Out')
                .setDescription(`**${member.user.tag}** has been put in timeout.`)
                .addFields(
                    { name: '👤 User', value: `${member.user.tag} (\`${member.id}\`)`, inline: false },
                    { name: '👮 Timed Out By', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: false },
                    { name: '⏱️ Duration', value: `\`${durationDisplay}\``, inline: true },
                    { name: '💬 Reason', value: reason, inline: false }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Timeout executed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [timeoutEmbed] });

        } catch (error) {
            console.error('Error timing out member:', error.stack);
            await message.reply({ content: '❌ An unexpected error occurred while trying to timeout this member. Please check my permissions.', ephemeral: true });
        }
    },
};
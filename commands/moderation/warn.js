// D:\NoSleepV2\commands\moderation\warn.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { sendModLogWebhook } = require('../../utils/webhookLogger');
// NO LONGER NEED fs module here because we're not writing to settings.json

module.exports = {
    data: {
        name: 'warn',
        description: 'Issues a warning to a user.',
        cooldown: 5,
    },
    // Ensure 'pool' is the last argument here
    async execute(message, args, client, currentGuildSettings, pool) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply({ content: '🚫 You do not have permission to warn members.', ephemeral: true });
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!member) {
            return message.reply({ content: '❌ Please mention a user or provide their ID to warn.', ephemeral: true });
        }

        if (member.id === message.author.id) {
            return message.reply({ content: '😅 You cannot warn yourself!', ephemeral: true });
        }

        if (member.roles.highest.position >= message.member.roles.highest.position && message.author.id !== message.guild.ownerId) {
            return message.reply({ content: '⚠️ You cannot warn someone with an equal or higher role than yourself.', ephemeral: true });
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';
        const guildId = message.guild.id;

        try {
            // --- NEW POSTGRESQL LOGIC ---
            const insertResult = await pool.query(`
                INSERT INTO warnings (guild_id, user_id, executor_id, reason, timestamp)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id; -- Get the auto-generated ID back
            `, [guildId, member.id, message.author.id, reason, Date.now()]);

            const newWarnId = insertResult.rows[0].id; // Get the ID of the new warning

            // Get total warnings for the user
            const totalWarningsResult = await pool.query('SELECT COUNT(*) FROM warnings WHERE guild_id = $1 AND user_id = $2', [guildId, member.id]);
            const totalWarnings = parseInt(totalWarningsResult.rows[0].count); // count comes as a string
            // --- END NEW POSTGRESQL LOGIC ---

            // Inform the user
            await member.send({ content: `You have been warned in **${message.guild.name}** for: \`${reason}\`\nTotal warnings: ${totalWarnings}` }).catch(() => {
                message.channel.send({ content: `⚠️ Could not DM ${member.user.tag}. They have been warned for: \`${reason}\`. Total warnings: ${totalWarnings}`, ephemeral: false });
            });

            // Send webhook log
            sendModLogWebhook({
                guildId: message.guild.id,
                guildSettings: currentGuildSettings, // Pass currentGuildSettings as it still contains webhook URL
                action: 'Warn',
                executor: message.author,
                target: member.user,
                reason: reason,
                color: 0xf1c40f
            });

            const warnEmbed = new EmbedBuilder()
                .setColor(0xf1c40f)
                .setTitle('⚠️ User Warned')
                .setDescription(`**${member.user.tag}** has been warned.`)
                .addFields(
                    { name: '👤 Warned User', value: `${member.user.tag} (\`${member.id}\`)`, inline: false },
                    { name: '👮 Warned By', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: false },
                    { name: '💬 Reason', value: reason, inline: false },
                    { name: '📊 Total Warnings', value: `${totalWarnings}`, inline: false }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Warn ID: ${newWarnId}`, iconURL: client.user.displayAvatarURL() });

            await message.channel.send({ embeds: [warnEmbed] });

        } catch (error) {
            console.error(error);
            await message.reply({ content: 'An unexpected error occurred while trying to warn this member. Please check my permissions.', ephemeral: true });
        }
    },
};
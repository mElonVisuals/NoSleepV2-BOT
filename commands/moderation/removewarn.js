// D:\NoSleepV2\commands\moderation\removewarn.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'removewarn',
        description: 'Removes a specific warning from a user by its ID.',
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) { // Or other appropriate mod perm
            return message.reply({ content: '🚫 You do not have permission to remove warnings.', ephemeral: true });
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.reply({ content: '❌ Please mention a user or provide their ID whose warning you want to remove.', ephemeral: true });
        }

        const warnId = parseInt(args[1]);
        if (isNaN(warnId)) {
            return message.reply({ content: '❌ Please provide a valid warning ID to remove (e.g., `!removewarn @user 5`).', ephemeral: true });
        }

        const guildId = message.guild.id;

        try {
            // Check if the warning exists for the specified user and guild
            const checkWarnResult = await pool.query(
                'SELECT * FROM warnings WHERE id = $1 AND guild_id = $2 AND user_id = $3',
                [warnId, guildId, member.id]
            );

            if (checkWarnResult.rows.length === 0) {
                return message.reply({ content: `❌ No warning found with ID \`${warnId}\` for ${member.user.tag} in this server.`, ephemeral: true });
            }

            // Delete the warning from the database
            await pool.query(
                'DELETE FROM warnings WHERE id = $1 AND guild_id = $2 AND user_id = $3',
                [warnId, guildId, member.id]
            );

            // Get updated total warnings for the user
            const totalWarningsResult = await pool.query('SELECT COUNT(*) FROM warnings WHERE guild_id = $1 AND user_id = $2', [guildId, member.id]);
            const totalWarnings = parseInt(totalWarningsResult.rows[0].count);

            const removeWarnEmbed = new EmbedBuilder()
                .setColor(0x2ecc71) // Green for success
                .setTitle('✅ Warning Removed')
                .setDescription(`Successfully removed warning ID \`${warnId}\` for **${member.user.tag}**.`)
                .addFields(
                    { name: '👤 User', value: `${member.user.tag} (\`${member.id}\`)`, inline: false },
                    { name: '👮 Removed By', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: false },
                    { name: '📊 New Total Warnings', value: `${totalWarnings}`, inline: false }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Command executed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [removeWarnEmbed] });

        } catch (error) {
            console.error('Error removing warning:', error.stack);
            await message.reply({ content: '❌ An error occurred while trying to remove the warning. Please check the ID and try again.', ephemeral: true });
        }
    },
};
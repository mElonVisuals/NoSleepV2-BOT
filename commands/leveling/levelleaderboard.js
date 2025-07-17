// D:\NoSleepV2\commands\leveling\levelleaderboard.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'levelleaderboard',
        description: 'Shows the top users by level and XP.',
        aliases: ['llb', 'toplevels'],
        cooldown: 10,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const guildId = message.guild.id;

        try {
            const res = await pool.query(
                `SELECT user_id, xp, level
                 FROM user_levels
                 WHERE guild_id = $1
                 ORDER BY level DESC, xp DESC
                 LIMIT 10`, // Get top 10
                [guildId]
            );

            if (res.rows.length === 0) {
                return message.reply({ content: 'No one is on the level leaderboard yet! Start chatting to earn XP!', ephemeral: true });
            }

            const leaderboardDescription = await Promise.all(res.rows.map(async (row, index) => {
                const user = await client.users.fetch(row.user_id).catch(() => null);
                const userName = user ? user.username : 'Unknown User';
                return `**${index + 1}.** ${userName} - Level \`${row.level}\` (XP: \`${row.xp}\`)`;
            }));

            const embed = new EmbedBuilder()
                .setColor(0x7289DA) // Discord Blurple
                .setTitle(`🏆 ${message.guild.name} Level Leaderboard`)
                .setDescription(leaderboardDescription.join('\n'))
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching level leaderboard:', error);
            await message.reply({ content: '❌ An error occurred while fetching the level leaderboard.', ephemeral: true });
        }
    },
};
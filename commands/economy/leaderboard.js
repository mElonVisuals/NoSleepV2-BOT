// D:\NoSleepV2\commands\economy\leaderboard.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'leaderboard',
        description: 'Shows the top users by money balance.',
        aliases: ['lb', 'top'],
        cooldown: 10,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const guildId = message.guild.id;

        try {
            const res = await pool.query(
                `SELECT user_id, balance
                 FROM user_economy
                 WHERE guild_id = $1
                 ORDER BY balance DESC
                 LIMIT 10`, // Get top 10
                [guildId]
            );

            if (res.rows.length === 0) {
                return message.reply({ content: 'No one is on the leaderboard yet! Start earning some money!', ephemeral: true });
            }

            const leaderboardDescription = await Promise.all(res.rows.map(async (row, index) => {
                const user = await client.users.fetch(row.user_id).catch(() => null);
                const userName = user ? user.username : 'Unknown User';
                return `**${index + 1}.** ${userName} - **$${row.balance.toLocaleString()}**`;
            }));

            const embed = new EmbedBuilder()
                .setColor(0xFEE75C) // Gold/Yellow
                .setTitle(`🏆 ${message.guild.name} Economy Leaderboard`)
                .setDescription(leaderboardDescription.join('\n'))
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            await message.reply({ content: '❌ An error occurred while fetching the leaderboard.', ephemeral: true });
        }
    },
};
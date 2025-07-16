// D:\NoSleepV2\commands\moderation\warnings.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'warnings',
        description: 'Displays a user\'s warnings.',
        cooldown: 5,
    },
    // Ensure 'pool' is the last argument here
    async execute(message, args, client, currentGuildSettings, pool) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        const user = member.user;
        const guildId = message.guild.id;

        if (!member) {
            return message.reply({ content: '❌ Could not find that user.', ephemeral: true });
        }

        // Fetch warnings from the database using pool.query
        const result = await pool.query('SELECT * FROM warnings WHERE guild_id = $1 AND user_id = $2 ORDER BY timestamp ASC', [guildId, member.id]);
        const userWarnings = result.rows; // This is correct for pg

        const warningsEmbed = new EmbedBuilder()
            .setColor(userWarnings.length > 0 ? 0xf1c40f : 0x2ecc71)
            .setTitle(`⚠️ Warnings for ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setDescription(`**Total Warnings: \`${userWarnings.length}\`**\n\n`)
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        if (userWarnings.length === 0) {
            warningsEmbed.setDescription(`🎉 ${user.tag} has no warnings!`);
        } else {
            userWarnings.forEach((warn, index) => {
                warningsEmbed.addFields({
                    name: `Warning #${index + 1} (ID: ${warn.id})`,
                    value: `**Reason:** ${warn.reason}\n**Warned By:** <@${warn.executor_id}> (<t:${Math.floor(warn.timestamp / 1000)}:R>)`,
                    inline: false
                });
            });
        }

        await message.channel.send({ embeds: [warningsEmbed] });
    },
};
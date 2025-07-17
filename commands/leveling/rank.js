// D:\NoSleepV2\commands\leveling\rank.js
const { EmbedBuilder } = require('discord.js');
const { getUserLevel, getXpForLevel } = require('../../utils/levelManager');

module.exports = {
    data: {
        name: 'rank',
        description: 'Displays your current XP and level.',
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const targetUser = message.mentions.users.first() || message.author;
        const guildId = message.guild.id;

        const { xp, level } = await getUserLevel(targetUser.id, guildId, pool);
        const xpNeeded = getXpForLevel(level);
        const progress = Math.min(100, (xp / xpNeeded) * 100).toFixed(2); // Progress percentage

        const embed = new EmbedBuilder()
            .setColor(0x7289DA) // Discord Blurple
            .setTitle(`📈 ${targetUser.username}'s Rank`)
            .setDescription(`**Level:** \`${level}\`\n**XP:** \`${xp} / ${xpNeeded}\`\n**Progress:** \`${progress}%\``)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};
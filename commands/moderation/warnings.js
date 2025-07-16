// D:\NoSleepV2\commands\moderation\warnings.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'warnings',
        description: 'Displays a user\'s warnings.',
        cooldown: 5,
    },
    async execute(message, args, client, guildSettings) { // guildSettings for warning data
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        const user = member.user;

        if (!member) {
            return message.reply({ content: '❌ Could not find that user.', ephemeral: true });
        }

        const userWarnings = guildSettings[message.guild.id]?.warnings?.[member.id] || [];

        const warningsEmbed = new EmbedBuilder()
            .setColor(userWarnings.length > 0 ? 0xf1c40f : 0x2ecc71) // Yellow if warnings, green if none
            .setTitle(`⚠️ Warnings for ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setDescription(`**Total Warnings: \`${userWarnings.length}\`**\n\n`)
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        if (userWarnings.length === 0) {
            warningsEmbed.setDescription(`🎉 ${user.tag} has no warnings!`);
        } else {
            // Map each warning to a field
            userWarnings.forEach((warn, index) => {
                warningsEmbed.addFields({
                    name: `Warning #${index + 1} (ID: ${warn.id})`,
                    value: `**Reason:** ${warn.reason}\n**Warned By:** <@${warn.executor}> (<t:${Math.floor(warn.timestamp / 1000)}:R>)`,
                    inline: false
                });
            });
        }

        await message.channel.send({ embeds: [warningsEmbed] });
    },
};
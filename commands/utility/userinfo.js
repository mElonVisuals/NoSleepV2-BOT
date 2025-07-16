// D:\NoSleepV2\commands\utility\userinfo.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'userinfo',
        description: 'Displays information about a user.',
        cooldown: 5,
    },
    async execute(message, args, client) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        const user = member.user;

        if (!member) {
            return message.reply({ content: '❌ Could not find that user in this server.', ephemeral: true });
        }

        const userEmbed = new EmbedBuilder()
            .setColor(member.displayHexColor !== '#000000' ? member.displayHexColor : 0x0099ff) // Use member's top role color, default to blue
            .setTitle(`👤 User Info: ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 })) // Larger thumbnail
            .addFields(
                { name: '🏷️ Tag', value: user.tag, inline: true },
                { name: '🆔 ID', value: user.id, inline: true },
                { name: '🤖 Bot', value: user.bot ? 'Yes' : 'No', inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false }, // Full date and time
                { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
                { name: '✨ Highest Role', value: member.roles.highest.name === '@everyone' ? 'None' : member.roles.highest.name, inline: true }, // Avoid showing @everyone
                { name: '🌈 Display Color', value: member.displayHexColor, inline: true },
                { name: '🔑 Permissions', value: `\`\`\`${member.permissions.toArray().join(', ')}\`\`\``, inline: false }, // Display all permissions (can be very long)
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [userEmbed] });
    },
};
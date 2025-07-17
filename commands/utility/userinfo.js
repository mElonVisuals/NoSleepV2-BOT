// D:\NoSleepV2\commands\general\userinfo.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'userinfo',
        description: 'Displays information about a user.',
        cooldown: 5,
    },
    async execute(message, args, client) {
        const user = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;
        const member = message.guild.members.cache.get(user.id); // Get guild member object for roles, join date etc.

        if (!user) {
            return message.reply({ content: '❌ Could not find that user.', ephemeral: true });
        }

        const userInfoEmbed = new EmbedBuilder()
            .setColor(0x5865f2) // Discord Blurple for user info
            .setTitle(`👤 Information about ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🆔 User ID', value: `\`${user.id}\``, inline: true },
                { name: '🏷️ Discord Tag', value: `\`${user.tag}\``, inline: true },
                { name: '🤖 Bot?', value: user.bot ? 'Yes ✅' : 'No ❌', inline: true }
            );

        if (member) { // Only add guild-specific info if the user is in the guild
            userInfoEmbed.addFields(
                { name: '🗓️ Joined Discord', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`, inline: false },
                { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`, inline: false },
                { name: `🎭 Roles (${member.roles.cache.size - 1})`, value: member.roles.cache.size > 1 ? member.roles.cache.filter(r => r.id !== message.guild.id).map(r => `<@&${r.id}>`).join(', ') : 'No roles.', inline: false }
            );
        } else {
            userInfoEmbed.addFields(
                { name: '🗓️ Joined Discord', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`, inline: false },
                { name: 'Server Member', value: 'Not found in this server.', inline: false }
            );
        }

        userInfoEmbed.setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [userInfoEmbed] });
    },
};
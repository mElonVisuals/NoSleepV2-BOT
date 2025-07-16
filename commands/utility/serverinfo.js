// D:\NoSleepV2\commands\utility\serverinfo.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'serverinfo',
        description: 'Displays information about the server.',
        cooldown: 5,
    },
    async execute(message, args, client) {
        const guild = message.guild;
        if (!guild) {
            return message.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
        }

        const owner = await guild.fetchOwner(); // Fetch the owner for their tag and ID

        const serverEmbed = new EmbedBuilder()
            .setColor(0x7289da) // Discord's blurple color
            .setTitle(`🌐 Server Info: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '🆔 Server ID', value: guild.id, inline: true },
                { name: '👑 Owner', value: `${owner.user.tag} (\`${owner.id}\`)`, inline: true },
                { name: '📅 Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }, // Use 'F' for full date/time
                { name: '👥 Members', value: `${guild.memberCount} members`, inline: true },
                { name: '🤖 Bots', value: `${guild.members.cache.filter(member => member.user.bot).size}`, inline: true },
                { name: '📈 Boosts', value: `${guild.premiumSubscriptionCount || '0'} (Tier ${guild.premiumTier})`, inline: true },
                { name: '💬 Channels', value: `Text: ${guild.channels.cache.filter(c => c.type === 0).size} | Voice: ${guild.channels.cache.filter(c => c.type === 2).size}`, inline: true },
                { name: '📝 Roles', value: `${guild.roles.cache.size} roles`, inline: true },
                { name: '📍 Region', value: guild.preferredLocale || 'N/A', inline: true } // preferredLocale is more accurate than region
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [serverEmbed] });
    },
};
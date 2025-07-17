// D:\NoSleepV2\commands\general\serverinfo.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'serverinfo',
        description: 'Displays information about the current server.',
        cooldown: 10,
    },
    async execute(message, args, client) {
        const guild = message.guild;
        if (!guild) {
            return message.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const owner = await guild.fetchOwner();
        const memberCount = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(m => m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd').size;
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size; // ChannelType.GuildText
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size; // ChannelType.GuildVoice
        const roles = guild.roles.cache.size;
        const emojis = guild.emojis.cache.size;

        const serverInfoEmbed = new EmbedBuilder()
            .setColor(0x1abc9c) // Teal for server info
            .setTitle(`ℹ️ Information about ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🆔 Server ID', value: `\`${guild.id}\``, inline: true },
                { name: '👑 Owner', value: `${owner.user.tag}`, inline: true },
                { name: '📅 Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`, inline: false },
                { name: '👥 Members', value: `Total: \`${memberCount}\`\nOnline: \`${onlineMembers}\``, inline: true },
                { name: '💬 Channels', value: `Text: \`${textChannels}\`\nVoice: \`${voiceChannels}\``, inline: true },
                { name: '✨ Roles', value: `\`${roles}\``, inline: true },
                { name: '😀 Emojis', value: `\`${emojis}\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [serverInfoEmbed] });
    },
};
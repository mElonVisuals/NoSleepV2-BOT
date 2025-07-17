// D:\NoSleepV2\commands\general\botinfo.js
const { EmbedBuilder, version: djsVersion } = require('discord.js');
const os = require('node:os');

module.exports = {
    data: {
        name: 'botinfo',
        description: 'Displays information about the bot.',
        cooldown: 10,
    },
    async execute(message, args, client) {
        // Calculate uptime
        let totalSeconds = (client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);
        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // Get system memory usage
        const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024; // in MB
        const totalMemory = os.totalmem() / 1024 / 1024 / 1024; // in GB

        const botInfoEmbed = new EmbedBuilder()
            .setColor(0x5865f2) // Discord Blurple
            .setTitle(`🤖 Information about ${client.user.username}`)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🆔 Bot ID', value: `\`${client.user.id}\``, inline: true },
                { name: '👑 Developer', value: `<@${message.guild.ownerId}> (or whoever developed me!)`, inline: true }, // Placeholder for developer, you can hardcode your ID if you want
                { name: '🗓️ Created On', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:F> (<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>)`, inline: false },
                { name: '📈 Uptime', value: `\`${uptime}\``, inline: true },
                { name: '📊 Servers', value: `\`${client.guilds.cache.size}\``, inline: true },
                { name: '👥 Users', value: `\`${client.users.cache.size}\``, inline: true },
                { name: '📚 Discord.js Version', value: `\`v${djsVersion}\``, inline: true },
                { name: '🟢 Node.js Version', value: `\`${process.version}\``, inline: true },
                { name: '🧠 Memory Usage', value: `\`${usedMemory.toFixed(2)} MB / ${totalMemory.toFixed(2)} GB\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [botInfoEmbed] });
    },
};
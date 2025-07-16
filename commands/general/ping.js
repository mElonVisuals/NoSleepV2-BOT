// D:\NoSleepV2\commands\general\ping.js
const { EmbedBuilder } = require('discord.js'); // Import EmbedBuilder

module.exports = {
    data: {
        name: 'ping',
        description: 'Replies with the bot\'s latency.',
        cooldown: 5,
    },
    async execute(message, args, client) {
        const sent = await message.reply('Pinging...'); // Send initial message to measure latency

        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = client.ws.ping; // WebSocket heartbeat ping

        const pingEmbed = new EmbedBuilder()
            .setColor(0x2ecc71) // Green for success/good status
            .setTitle('🏓 Pong!')
            .setDescription('Here are my current latencies:')
            .addFields(
                { name: 'Bot Latency', value: `\`${latency}ms\``, inline: true },
                { name: 'API Latency', value: `\`${apiLatency}ms\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        // Edit the original message with the embed
        await sent.edit({ content: '\u200b', embeds: [pingEmbed] }); // \u200b is a zero-width space to clear "Pinging..."
    },
};
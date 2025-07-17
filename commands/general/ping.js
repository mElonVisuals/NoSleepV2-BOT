// D:\NoSleepV2\commands\general\ping.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'ping',
        description: 'Checks the bot\'s latency to the Discord API.',
        cooldown: 5,
    },
    async execute(message, args, client) {
        const sent = await message.reply('🏓 Pinging...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = client.ws.ping;

        const pingEmbed = new EmbedBuilder()
            .setColor(0x5865f2) // Discord Blurple for general info
            .setTitle('🏓 Pong!')
            .setDescription('Here are the latency details:')
            .addFields(
                { name: 'Bot Latency', value: `\`${latency}ms\``, inline: true },
                { name: 'API Latency', value: `\`${apiLatency}ms\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await sent.edit({ content: ' ', embeds: [pingEmbed] }); // Edit initial message to include embed
    },
};
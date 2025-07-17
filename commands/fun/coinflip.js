// D:\NoSleepV2\commands\fun\coinflip.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'coinflip',
        description: 'Flips a coin and returns either heads or tails.',
        cooldown: 3,
    },
    async execute(message, args, client) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        const emoji = result === 'Heads' ? '🪙' : '🪙'; // Can use different emojis if desired

        const embed = new EmbedBuilder()
            .setColor(0x8e44ad) // Purple for fun commands
            .setTitle('💰 Coin Flip!')
            .setDescription(`The coin landed on... **${result}** ${emoji}`)
            .setThumbnail('https://cdn.discordapp.com/attachments/1066497746536976454/1263300588825833482/coin-flip-animation-loop_1.gif?ex=669865c3&is=66971443&hm=25389658ef9c716d1f057c2a792d47509439ac139962a632057d8906ec14d023&') // A simple coin image/gif
            .setTimestamp()
            .setFooter({ text: `Flipped by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};
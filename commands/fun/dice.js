// D:\NoSleepV2\commands\fun\dice.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'dice',
        description: 'Rolls a standard six-sided dice.',
        cooldown: 3,
    },
    async execute(message, args, client) {
        const result = Math.floor(Math.random() * 6) + 1; // Generates a number between 1 and 6
        const diceEmojis = {
            1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅'
        };

        const embed = new EmbedBuilder()
            .setColor(0x8e44ad) // Purple for fun commands
            .setTitle('🎲 Dice Roll!')
            .setDescription(`You rolled a... **${result}** ${diceEmojis[result]}`)
            .setThumbnail('https://cdn.discordapp.com/attachments/1066497746536976454/1263300486007038032/dice_gif.gif?ex=669865aa&is=6697142a&hm=4a70d8a557b2829281a79f57c2718991206d4e2f3d17887e2f5b8e1a120516fc&') // A simple dice image/gif
            .setTimestamp()
            .setFooter({ text: `Rolled by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};
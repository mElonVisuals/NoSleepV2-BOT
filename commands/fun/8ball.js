// D:\NoSleepV2\commands\fun\8ball.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: '8ball',
        description: 'Ask the magic 8-ball a question!',
        cooldown: 3,
    },
    async execute(message, args, client) {
        const question = args.join(' ');
        if (!question) {
            return message.reply({ content: '🤔 You need to ask the 8-ball a question!', ephemeral: true });
        }

        const responses = [
            'It is certain. ✅',
            'It is decidedly so. ✅',
            'Without a doubt. ✅',
            'Yes, definitely. ✅',
            'You may rely on it. ✅',
            'As I see it, yes. ✅',
            'Most likely. ✅',
            'Outlook good. ✅',
            'Yes. ✅',
            'Signs point to yes. ✅',
            'Reply hazy, try again. ❓',
            'Ask again later. ❓',
            'Better not tell you now. ❓',
            'Cannot predict now. ❓',
            'Concentrate and ask again. ❓',
            'Don\'t count on it. ❌',
            'My reply is no. ❌',
            'My sources say no. ❌',
            'Outlook not so good. ❌',
            'Very doubtful. ❌',
            'Absolutely not. ❌'
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];

        let embedColor;
        if (response.includes('✅')) {
            embedColor = 0x2ecc71; // Green for positive
        } else if (response.includes('❌')) {
            embedColor = 0xed4245; // Red for negative
        } else {
            embedColor = 0xf1c40f; // Yellow for neutral/hazy
        }

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('🎱 Magic 8-Ball Says...')
            .addFields(
                { name: 'Question', value: `\`\`\`${question}\`\`\``, inline: false },
                { name: 'Answer', value: `**${response}**`, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Asked by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};
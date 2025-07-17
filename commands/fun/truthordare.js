// D:\NoSleepV2\commands\fun\truthordare.js
const { EmbedBuilder } = require('discord.js');

const truths = [
    "What's your most embarrassing moment?",
    "What's the most annoying habit you have?",
    "What's something you've done that you hope no one ever finds out about?",
    "If you could change one thing about yourself, what would it be?",
    "What's the biggest lie you've ever told?",
    "What's the craziest thing you've ever done?",
    "What's your biggest fear?",
    "What's a secret talent you have?",
    "Who was your first crush?",
    "What's the last thing you cried about?",
    "What's your guilty pleasure?",
    "What's one thing you're secretly good at?",
    "What's the most childish thing you still do?",
    "Have you ever cheated on a test?",
    "What's the most expensive thing you've broken?",
    "What's the most daring thing you've ever done?",
    "If you could trade lives with anyone for a day, who would it be and why?",
    "What's the weirdest dream you've ever had?",
    "What's your biggest regret?",
    "What's a time you were truly scared?",
];

const dares = [
    "Do your best impression of a chicken.",
    "Sing a song in a silly voice.",
    "Speak in an accent for the next 5 minutes.",
    "Do 10 push-ups right now.",
    "Send the last meme in your gallery.",
    "Compliment the person to your left in 3 different ways.",
    "Try to lick your elbow.",
    "Tell a joke.",
    "Act like a cat until your next turn.",
    "Change your Discord nickname to something silly for 5 minutes.",
    "Post an embarrassing baby photo in the chat.",
    "Recite the alphabet backwards.",
    "Talk about your biggest phobia for 30 seconds.",
    "Do a dramatic reading of a random sentence someone types.",
    "Try to juggle 3 random items.",
    "Do a terrible dance for 15 seconds.",
    "Call a random friend and sing 'Happy Birthday' to them.",
    "Let someone else choose your next profile picture for 24 hours.",
    "Explain quantum physics in 30 seconds or less.",
    "Eat a spoonful of a condiment of your choice (e.g., mustard, ketchup)."
];

module.exports = {
    data: {
        name: 'truthordare',
        description: 'Get a random truth or a dare!',
        cooldown: 5,
        aliases: ['tod']
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const type = args[0] ? args[0].toLowerCase() : (Math.random() < 0.5 ? 'truth' : 'dare');

        let selectedItem;
        let title;
        let color;
        let emoji;

        if (type === 'truth') {
            selectedItem = truths[Math.floor(Math.random() * truths.length)];
            title = '💡 Truth!';
            color = 0x3498DB; // Blue
            emoji = '🧠';
        } else if (type === 'dare') {
            selectedItem = dares[Math.floor(Math.random() * dares.length)];
            title = '🔥 Dare!';
            color = 0xE74C3C; // Red
            emoji = '🤸';
        } else {
            return message.reply({ content: 'Please specify `truth` or `dare`, or leave blank for a random one.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(`${emoji} ${selectedItem}`)
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};
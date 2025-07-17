// D:\NoSleepV2\commands\fun\wouldyourather.js
const { EmbedBuilder } = require('discord.js');

const questions = [
    "Would you rather have unlimited pizza or unlimited tacos?",
    "Would you rather be able to fly or be invisible?",
    "Would you rather live without the internet or live without AC/heating?",
    "Would you rather fight 100 duck-sized horses or 1 horse-sized duck?",
    "Would you rather be able to talk to animals or speak all human languages?",
    "Would you rather always be 10 minutes late or always be 20 minutes early?",
    "Would you rather have a constantly runny nose or constantly itchy eyes?",
    "Would you rather have a rewind button or a pause button in your life?",
    "Would you rather live in a house haunted by friendly ghosts or a house that's extremely messy but no one cares?",
    "Would you rather have a super loud burp or a super loud yawn?",
    "Would you rather always have to say everything on your mind or never speak again?",
    "Would you rather have hair for teeth or teeth for hair?",
    "Would you rather be able to see 10 minutes into your own future or 10 years into the future of the world?",
    "Would you rather lose all your memories from birth until now or lose all your new memories from now on?",
    "Would you rather be a master at every musical instrument or a master at every sport?",
    "Would you rather have mind-reading abilities or telekinesis?",
    "Would you rather have incredibly strong legs or incredibly strong arms?",
    "Would you rather be feared by all or loved by all?",
    "Would you rather be able to speak to land animals, sea creatures, or birds?",
    "Would you rather live in a treehouse or in a cave?",
];

module.exports = {
    data: {
        name: 'wouldyourather',
        description: 'Get a random "Would You Rather" question!',
        cooldown: 5,
        aliases: ['wyr']
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const question = questions[Math.floor(Math.random() * questions.length)];

        const embed = new EmbedBuilder()
            .setColor(0x9B59B6) // Purple
            .setTitle('🤔 Would You Rather?')
            .setDescription(`**${question}**`)
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};
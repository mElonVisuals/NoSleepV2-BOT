// D:\NoSleepV2\commands\utility\avatar.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'avatar',
        description: 'Displays a user\'s avatar.',
        cooldown: 5,
    },
    async execute(message, args, client) {
        const user = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;

        if (!user) {
            return message.reply({ content: '❌ Could not find that user.', ephemeral: true });
        }

        const avatarEmbed = new EmbedBuilder()
            .setColor(0x5865f2) // Discord Blurple for utility
            .setTitle(`🖼️ ${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 })) // Get largest size
            .setDescription(`[Download Avatar](${user.displayAvatarURL({ dynamic: true, size: 4096 })})`)
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [avatarEmbed] });
    },
};
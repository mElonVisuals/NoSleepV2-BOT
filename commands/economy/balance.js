// D:\NoSleepV2\commands\economy\balance.js
const { EmbedBuilder } = require('discord.js');
const { getUserBalance } = require('../../utils/economyManager');

module.exports = {
    data: {
        name: 'balance',
        description: 'Checks your current money balance.',
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const targetUser = message.mentions.users.first() || message.author;
        const guildId = message.guild.id;

        const balance = await getUserBalance(targetUser.id, guildId, pool);

        const embed = new EmbedBuilder()
            .setColor(0xFEE75C) // Gold/Yellow for economy
            .setTitle(`💰 ${targetUser.username}'s Balance`)
            .setDescription(`You currently have **$${balance.toLocaleString()}** in your wallet.`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};
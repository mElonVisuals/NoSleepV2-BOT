// D:\NoSleepV2\commands\economy\daily.js
const { EmbedBuilder } = require('discord.js');
const { updateBalance, getLastDaily, setLastDaily } = require('../../utils/economyManager');

const DAILY_AMOUNT = 500; // Amount of money to give daily
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

module.exports = {
    data: {
        name: 'daily',
        description: 'Claim your daily money!',
        cooldown: 10, // General command cooldown, not related to daily claim cooldown
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const userId = message.author.id;
        const guildId = message.guild.id;
        const now = Date.now();

        const lastClaim = await getLastDaily(userId, guildId, pool);

        if (now - lastClaim < DAILY_COOLDOWN) {
            const timeLeft = DAILY_COOLDOWN - (now - lastClaim);
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            const embed = new EmbedBuilder()
                .setColor(0xED4245) // Red for error/cooldown
                .setTitle('⏳ Daily Claim Cooldown')
                .setDescription(`You have already claimed your daily bonus. Please wait **${hours}h ${minutes}m ${seconds}s** before claiming again.`)
                .setTimestamp()
                .setFooter({ text: `Next claim available soon!`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            return message.reply({ embeds: [embed], ephemeral: true });
        }

        const newBalance = await updateBalance(userId, guildId, DAILY_AMOUNT, pool);
        await setLastDaily(userId, guildId, now, pool);

        const embed = new EmbedBuilder()
            .setColor(0x2ECC71) // Green for success
            .setTitle('✅ Daily Bonus Claimed!')
            .setDescription(`You received **$${DAILY_AMOUNT.toLocaleString()}** as your daily bonus!`)
            .addFields(
                { name: '💰 New Balance', value: `$${newBalance.toLocaleString()}`, inline: true }
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `Claimed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};
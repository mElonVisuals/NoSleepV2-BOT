// D:\NoSleepV2\commands\moderation\clear.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { sendModLogWebhook } = require('../../utils/webhookLogger');

module.exports = {
    data: {
        name: 'clear',
        description: 'Deletes a specified number of messages from the channel.',
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings) { // No pool needed for clear operation
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply({ content: '🚫 You do not have permission to clear messages.', ephemeral: true });
        }

        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return message.reply({ content: '❌ You need to specify a number between 1 and 100 to clear.', ephemeral: true });
        }

        try {
            const fetched = await message.channel.messages.fetch({ limit: amount });
            const deletedMessages = await message.channel.bulkDelete(fetched, true); // true to filter out non-deletable messages (older than 14 days)

            const clearEmbed = new EmbedBuilder()
                .setColor(0x3498db) // Blue for moderation utility
                .setTitle('🗑️ Messages Cleared')
                .setDescription(`Successfully deleted \`${deletedMessages.size}\` messages.`)
                .addFields(
                    { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
                    { name: 'Cleared By', value: `${message.author.tag} (\`${message.author.id}\`)`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Command executed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            // Send webhook log
            sendModLogWebhook({
                guildId: message.guild.id,
                guildSettings: currentGuildSettings,
                action: 'Clear Messages',
                executor: message.author,
                channel: message.channel,
                amount: deletedMessages.size,
                color: 0x3498db
            });

            const reply = await message.channel.send({ embeds: [clearEmbed] });
            setTimeout(() => reply.delete().catch(console.error), 5000); // Delete the confirmation message after 5 seconds

        } catch (error) {
            console.error('Error clearing messages:', error);
            await message.reply({ content: '❌ An error occurred while trying to clear messages. Messages older than 14 days cannot be deleted.', ephemeral: true });
        }
    },
};
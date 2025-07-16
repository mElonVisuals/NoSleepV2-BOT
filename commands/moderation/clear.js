// D:\NoSleepV2\commands\moderation\clear.js
const { PermissionsBitField, EmbedBuilder } = require('discord.js'); // Import EmbedBuilder
const { sendModLogWebhook } = require('../../utils/webhookLogger');

module.exports = {
    data: {
        name: 'clear',
        description: 'Deletes a specified number of messages (up to 99).',
        cooldown: 5,
    },
    async execute(message, args, client, guildSettings) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply({ content: '🚫 You do not have permission to manage messages.', ephemeral: true });
        }

        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount <= 0 || amount > 99) {
            return message.reply({ content: '❌ Please provide a number between 1 and 99 messages to clear.', ephemeral: true });
        }

        try {
            const fetched = await message.channel.messages.fetch({ limit: amount + 1 });
            const messagesToDelete = fetched.filter(msg => !msg.pinned);

            const deletedMessages = await message.channel.bulkDelete(messagesToDelete, true);

            // Confirmation message as an embed
            const confirmationEmbed = new EmbedBuilder()
                .setColor(0x2ecc71) // Green for success
                .setDescription(`✅ Successfully deleted \`${deletedMessages.size}\` message(s) in <#${message.channel.id}>.`);
            const confirmation = await message.channel.send({ embeds: [confirmationEmbed] });

            // Delete confirmation message after 5 seconds
            setTimeout(() => confirmation.delete().catch(console.error), 5000);

            if (deletedMessages.size < amount) {
                const notDeletedCount = amount - deletedMessages.size;
                const warningEmbed = new EmbedBuilder()
                    .setColor(0xf1c40f) // Yellow for warning
                    .setDescription(`⚠️ **Warning:** Could not delete \`${notDeletedCount}\` message(s) as they are likely older than 14 days. Discord's API only allows bulk deletion of messages up to 14 days old.`);
                const warning = await message.channel.send({ embeds: [warningEmbed] });
                setTimeout(() => warning.delete().catch(console.error), 10000);
            }

            sendModLogWebhook({
                guildId: message.guild.id,
                guildSettings: guildSettings,
                action: 'Clear Messages',
                executor: message.author,
                channel: message.channel,
                amount: deletedMessages.size,
                color: 0x3498db // Blue color for clear
            });

        } catch (error) {
            console.error(error);
            if (error.code === 50034) {
                await message.reply({ content: '⛔ I can only bulk delete messages that are less than 14 days old. Please try a smaller amount or delete older messages manually.', ephemeral: true });
            } else {
                await message.reply({ content: '❌ There was an error trying to clear messages. Make sure I have "Manage Messages" permission.', ephemeral: true });
            }
        }
    },
};
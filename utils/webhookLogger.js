// D:\NoSleepV2\utils\webhookLogger.js
const { WebhookClient, EmbedBuilder } = require('discord.js');

// Cache for webhook clients to avoid re-creating them for every log
const webhookClients = new Map();

/**
 * Sends a moderation log message via a webhook.
 * @param {object} options - The logging options.
 * @param {string} options.guildId - The ID of the guild where the action occurred.
 * @param {object} options.guildSettings - The guild settings object (containing modLogWebhookUrl).
 * @param {string} options.action - The type of moderation action (e.g., "Kick", "Ban", "Clear").
 * @param {object} options.executor - The User/GuildMember object who performed the action.
 * @param {object} [options.target] - The User/GuildMember object who was affected (optional).
 * @param {string} [options.reason] - The reason for the action (optional).
 * @param {string} [options.channel] - The channel object where the action occurred (optional, for clear command).
 * @param {number} [options.amount] - The amount of messages cleared (optional, for clear command).
 * @param {string} [options.color] - Hex color for the embed.
 */
async function sendModLogWebhook({
    guildId,
    guildSettings,
    action,
    executor,
    target,
    reason,
    channel,
    amount,
    color
}) {
    const webhookUrl = guildSettings[guildId]?.modLogWebhookUrl;
    if (!webhookUrl) {
        console.warn(`[WEBHOOK LOG] No modLogWebhookUrl found for guild ${guildId}. Logging to console instead.`);
        // Fallback to console log if no webhook is set up
        let consoleLogMsg = `[MOD LOG] Guild: ${guildId} | Action: ${action} | By: ${executor.tag} (ID: ${executor.id})`;
        if (target) consoleLogMsg += ` | Target: ${target.tag || target.id} (ID: ${target.id})`;
        if (reason) consoleLogMsg += ` | Reason: ${reason}`;
        if (channel) consoleLogMsg += ` | Channel: #${channel.name}`;
        if (amount) consoleLogMsg += ` | Amount: ${amount}`;
        console.log(consoleLogMsg);
        return;
    }

    let webhookClient = webhookClients.get(webhookUrl);
    if (!webhookClient) {
        webhookClient = new WebhookClient({ url: webhookUrl });
        webhookClients.set(webhookUrl, webhookClient);
    }

    const embed = new EmbedBuilder()
        .setColor(color || 0x2b2d31) // Default gray Discord embed color
        .setTitle(`Moderation Log: ${action}`)
        .setTimestamp()
        .setFooter({ text: `Executor ID: ${executor.id}` }); // Show executor ID in footer for easier lookup

    // Add fields based on the action and available data
    embed.addFields(
        { name: 'Executor', value: `${executor.tag} (${executor.id})`, inline: true }
    );

    if (target) {
        embed.addFields(
            { name: 'Target', value: `${target.tag || target.id} (${target.id})`, inline: true }
        );
        embed.setThumbnail(target.displayAvatarURL({ dynamic: true }) || null); // Add target avatar
    }

    if (reason) {
        embed.addFields(
            { name: 'Reason', value: reason, inline: false }
        );
    }

    if (channel) {
        embed.addFields(
            { name: 'Channel', value: `<#${channel.id}>`, inline: true }
        );
    }

    if (amount) {
        embed.addFields(
            { name: 'Messages Cleared', value: amount.toString(), inline: true }
        );
    }

    try {
        await webhookClient.send({
            username: 'NoSleepV2 Mod Logs', // Custom webhook name
            avatarURL: 'https://i.imgur.com/AfFp7pu.png', // Custom webhook avatar (replace with your bot's avatar or a generic mod icon)
            embeds: [embed],
        });
    } catch (error) {
        console.error(`[WEBHOOK ERROR] Failed to send webhook log for guild ${guildId} (${action}):`, error);
        // Fallback to console log if webhook send fails
        let consoleLogMsg = `[MOD LOG FALLBACK] Guild: ${guildId} | Action: ${action} | By: ${executor.tag} (ID: ${executor.id})`;
        if (target) consoleLogMsg += ` | Target: ${target.tag || target.id} (ID: ${target.id})`;
        if (reason) consoleLogMsg += ` | Reason: ${reason}`;
        if (channel) consoleLogMsg += ` | Channel: #${channel.name}`;
        if (amount) consoleLogMsg += ` | Amount: ${amount}`;
        console.log(consoleLogMsg);
    }
}

module.exports = { sendModLogWebhook };
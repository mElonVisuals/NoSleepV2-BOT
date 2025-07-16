// D:\NoSleepV2\commands\utility\testcomponents.js

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

module.exports = {
    data: {
        name: 'testcomponents',
        description: 'Sends a message using standard Discord.js embeds and buttons.',
        cooldown: 5,
    },
    async execute(message, args, client) {
        // --- Create an Embed ---
        const exampleEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('✨ Standard Discord.js Components!')
            .setURL('https://discord.js.org/')
            .setDescription('This message showcases how to use standard Discord.js Embeds and interactive components (buttons) effectively. These are stable and widely used.')
            .setThumbnail(client.user.displayAvatarURL()) // Bot's avatar
            .addFields(
                { name: 'Buttons', value: 'Interact with the buttons below!', inline: false },
                { name: 'Feature', value: 'Easy to use and customize!', inline: true },
                { name: 'Compatibility', value: 'Works across all Discord clients.', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        // --- Create a Primary Button (interactive, sends customId) ---
        const primaryButton = new ButtonBuilder()
            .setCustomId('standard_button_click')
            .setLabel('Click Me!')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👍'); // Added an emoji

        // --- Create a Link Button (non-interactive, just a URL) ---
        const secondaryButton = new ButtonBuilder()
            .setLabel('Discord.js Guide')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discordjs.guide/')
            .setEmoji('🔗'); // Added an emoji

        // --- Create an Action Row to hold the buttons ---
        const row = new ActionRowBuilder()
            .addComponents(primaryButton, secondaryButton);

        try {
            await message.channel.send({
                embeds: [exampleEmbed],
                components: [row],
            });
            console.log('Successfully sent standard Discord.js message with embed and button!');
        } catch (error) {
            console.error('Error sending standard Discord.js message:', error);
            await message.reply('There was an error sending the message. Please check console.');
        }
    },
};
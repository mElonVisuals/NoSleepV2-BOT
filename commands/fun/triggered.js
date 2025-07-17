// D:\NoSleepV2\commands\fun\triggered.js
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    data: {
        name: 'triggered',
        description: 'Generates a "triggered" GIF overlay on a user\'s avatar.',
        cooldown: 10,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const targetUser = message.mentions.users.first() || message.author;

        await message.channel.sendTyping(); // Show "Bot is typing..."

        try {
            const avatarURL = targetUser.displayAvatarURL({ extension: 'png', size: 128 });
            const avatar = await loadImage(avatarURL);

            const canvas = createCanvas(avatar.width, avatar.height);
            const ctx = canvas.getContext('2d');

            // Draw avatar
            ctx.drawImage(avatar, 0, 0, avatar.width, avatar.height);

            // Create red overlay
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add "triggered" text (optional, but iconic)
            ctx.font = '20px sans-serif'; // Choose a font
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('TRIGGERED', 10, canvas.height - 10); // Adjust position as needed

            const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'triggered.png' });

            const embed = new EmbedBuilder()
                .setColor(0xFF0000) // Red
                .setTitle('💢 Triggered!')
                .setImage('attachment://triggered.png')
                .setTimestamp()
                .setFooter({ text: `Generated for ${targetUser.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error('Error generating triggered image:', error);
            await message.reply({ content: '❌ An error occurred while generating the triggered image. Ensure the user has a valid avatar and `canvas` dependencies are installed.', ephemeral: true });
        }
    },
};
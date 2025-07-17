// D:\NoSleepV2\commands\general\invite.js
const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: {
        name: 'invite',
        description: 'Provides the invite link for the bot.',
        cooldown: 5,
    },
    async execute(message, args, client) {
        // You need to decide what permissions your bot requires to function fully.
        // A common set might be:
        const permissions = new PermissionsBitField([
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.KickMembers,       // For kick/warn/timeout
            PermissionsBitField.Flags.BanMembers,        // For ban
            PermissionsBitField.Flags.ManageMessages,    // For clear
            PermissionsBitField.Flags.ModerateMembers,   // For timeout/untimeout
            PermissionsBitField.Flags.ManageChannels,    // If you plan features like mod logs channel setup
            PermissionsBitField.Flags.ManageWebhooks     // For mod log webhooks
        ]);

        const inviteLink = client.generateInvite({
            permissions: permissions,
            scopes: ['bot', 'applications.commands'] // 'applications.commands' for slash commands if you ever add them
        });

        const inviteEmbed = new EmbedBuilder()
            .setColor(0x5865f2) // Discord Blurple
            .setTitle('🔗 Invite Me to Your Server!')
            .setDescription(`Click the button below to invite **${client.user.username}** to your Discord server!`)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Permissions Requested', value: `I'll ask for the following permissions to function:\n\`\`\`\n${permissions.toArray().join(', ')}\n\`\`\``, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(inviteLink),
            );

        await message.channel.send({ embeds: [inviteEmbed], components: [row] });
    },
};
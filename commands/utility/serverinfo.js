// D:\NoSleepV2\commands\general\serverinfo.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'serverinfo',
        description: 'Displays detailed information about the server.',
        aliases: ['sinfo', 'guildinfo'],
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const guild = message.guild;
        await guild.fetch(); // Ensure guild data is up-to-date

        const owner = await guild.members.fetch(guild.ownerId).catch(() => null);
        const verificationLevels = {
            NONE: 'None',
            LOW: 'Low',
            MEDIUM: 'Medium',
            HIGH: 'High (╯°□°）╯︵ ┻━┻',
            VERY_HIGH: 'Very High (┻━┻彡 ゜Д゜)彡 ┻━┻'
        };

        const premiumTier = guild.premiumTier === 0 ? 'None' : `Tier ${guild.premiumTier}`;

        const embed = new EmbedBuilder()
            .setColor(0x3498DB) // Blue
            .setTitle(`🌐 Server Info: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Name', value: `\`${guild.name}\``, inline: true },
                { name: 'ID', value: `\`${guild.id}\``, inline: true },
                { name: 'Owner', value: owner ? `${owner.user.tag} (\`${owner.user.id}\`)` : `\`Unknown\``, inline: false },
                { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`, inline: false },
                { name: 'Members', value: `\`${guild.memberCount}\``, inline: true },
                { name: 'Humans', value: `\`${guild.members.cache.filter(member => !member.user.bot).size}\``, inline: true },
                { name: 'Bots', value: `\`${guild.members.cache.filter(member => member.user.bot).size}\``, inline: true },
                { name: 'Channels', value: `\`${guild.channels.cache.size}\` (Text: \`${guild.channels.cache.filter(c => c.type === 0).size}\`, Voice: \`${guild.channels.cache.filter(c => c.type === 2).size}\`)`, inline: false },
                { name: 'Roles', value: `\`${guild.roles.cache.size}\``, inline: true },
                { name: 'Emojis', value: `\`${guild.emojis.cache.size}\``, inline: true },
                { name: 'Boost Level', value: `${premiumTier} (${guild.premiumSubscriptionCount || 0} Boosts)`, inline: true },
                { name: 'Verification Level', value: `\`${verificationLevels[guild.verificationLevel]}\``, inline: true },
                { name: 'Preferred Locale', value: `\`${guild.preferredLocale}\``, inline: true },
                { name: 'Features', value: guild.features.length > 0 ? `\`${guild.features.join('`, `')}\`` : '`None`', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};
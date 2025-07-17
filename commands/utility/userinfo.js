// D:\NoSleepV2\commands\general\userinfo.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getUserBalance } = require('../../utils/economyManager'); // For economy balance
const { getUserLevel } = require('../../utils/levelManager');   // For level and XP

module.exports = {
    data: {
        name: 'userinfo',
        description: 'Displays detailed information about a user.',
        aliases: ['whois', 'uinfo'],
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
        const user = member.user; // Get the User object from the GuildMember

        // Get roles
        const roles = member.roles.cache
            .filter(r => r.id !== message.guild.id) // Exclude @everyone role
            .sort((a, b) => b.position - a.position)
            .map(r => r.toString());
        const rolesDisplay = roles.length > 0 ? roles.join(', ') : 'None';

        // Get permissions (higher role permissions)
        const memberPermissions = member.permissions.toArray().join(', ');

        // Get economy and level data
        const balance = await getUserBalance(user.id, message.guild.id, pool);
        const { xp, level } = await getUserLevel(user.id, message.guild.id, pool);

        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor !== '#000000' ? member.displayHexColor : 0x3498DB) // Use member's highest role color or blue
            .setTitle(`👤 User Info: ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Tag', value: `\`${user.tag}\``, inline: true },
                { name: 'ID', value: `\`${user.id}\``, inline: true },
                { name: 'Bot', value: user.bot ? '✅ Yes' : '❌ No', inline: true },
                { name: 'Created Account', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`, inline: false },
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`, inline: false },
                { name: 'Roles', value: rolesDisplay, inline: false },
                { name: 'Highest Role', value: `${member.roles.highest.name} (\`${member.roles.highest.id}\`)`, inline: true },
                { name: 'Boosted Server', value: member.premiumSince ? `Since <t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>` : 'No', inline: true },
                { name: 'Economy Balance', value: `$${balance.toLocaleString()}`, inline: true }, // NEW
                { name: 'Level & XP', value: `Level: ${level}, XP: ${xp}`, inline: true },     // NEW
                { name: 'Key Permissions', value: member.permissions.has(PermissionsBitField.Flags.Administrator) ? '`Administrator`' : `\`${memberPermissions.split(', ').slice(0, 5).join(', ')}${memberPermissions.split(', ').length > 5 ? '...' : ''}\``, inline: false } // Show a few key perms
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

        await message.channel.send({ embeds: [embed] });
    },
};
// D:\NoSleepV2\commands\leveling\setlevel.js
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { setLevelAndXp, getXpForLevel } = require('../../utils/levelManager');

module.exports = {
    data: {
        name: 'setlevel',
        description: 'Sets a user\'s level and/or XP. (Admin Only)',
        usage: '!setlevel <@user> <level> [xp_within_level]',
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        // Permission check: Only users with MANAGE_GUILD or Administrator permission
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.reply({ content: '❌ You do not have permission to use this command. You need `Manage Server` permission.', ephemeral: true });
        }

        const targetMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!targetMember) {
            return message.reply({ content: `Please mention a user or provide their ID. Usage: \`${currentGuildSettings.prefix || '!'}${this.data.name} ${this.data.usage}\``, ephemeral: true });
        }

        const newLevel = parseInt(args[1]);
        if (isNaN(newLevel) || newLevel < 0) {
            return message.reply({ content: 'Please provide a valid number for the new level (must be 0 or higher).', ephemeral: true });
        }

        let newXp = 0; // Default XP at the start of the new level
        if (args[2]) {
            const parsedXp = parseInt(args[2]);
            if (isNaN(parsedXp) || parsedXp < 0) {
                return message.reply({ content: 'Please provide a valid number for the XP within the level (must be 0 or higher).', ephemeral: true });
            }
            newXp = parsedXp;
        }

        const xpForNextLevel = getXpForLevel(newLevel);
        if (newXp >= xpForNextLevel) {
            return message.reply({ content: `The provided XP (${newXp}) for Level ${newLevel} is too high. It exceeds the XP needed for the next level (${xpForNextLevel}). Please provide XP less than ${xpForNextLevel}.`, ephemeral: true });
        }

        const success = await setLevelAndXp(targetMember.id, message.guild.id, newLevel, newXp, pool);

        if (success) {
            const embed = new EmbedBuilder()
                .setColor(0x2ECC71) // Green for success
                .setTitle('✅ Level & XP Updated')
                .setDescription(`Successfully set ${targetMember.user.tag}'s level to **${newLevel}** and XP to **${newXp}**.`)
                .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Set by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [embed] });
        } else {
            await message.reply({ content: '❌ An error occurred while trying to set the user\'s level and XP.', ephemeral: true });
        }
    },
};
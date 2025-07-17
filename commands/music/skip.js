// D:\NoSleepV2\commands\music\skip.js
const musicManager = require('../../utils/musicManager');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'skip',
        description: 'Skips the current song.',
        cooldown: 3,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = musicManager.getQueue(message.guild.id);

        if (!voiceChannel) {
            return message.reply({ content: 'You need to be in a voice channel to skip music!', ephemeral: true });
        }
        if (!serverQueue || !serverQueue.songs.length) {
            return message.reply({ content: 'There is no song that I could skip!', ephemeral: true });
        }
        if (!musicManager.isInSameVoiceChannel(message)) {
            return message.reply({ content: 'You must be in the same voice channel as the bot to skip music!', ephemeral: true });
        }

        const skipped = musicManager.skipSong(message.guild);
        if (skipped) {
            const embed = new EmbedBuilder()
                .setColor(0xEB459E) // Pink
                .setDescription('⏭️ Skipped the current song.');
            return message.channel.send({ embeds: [embed] });
        } else {
            return message.reply({ content: 'Could not skip the song.', ephemeral: true });
        }
    },
};
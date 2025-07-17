// D:\NoSleepV2\commands\music\pause.js
const musicManager = require('../../utils/musicManager');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'pause',
        description: 'Pauses the current song.',
        cooldown: 3,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = musicManager.getQueue(message.guild.id);

        if (!voiceChannel) {
            return message.reply({ content: 'You need to be in a voice channel to pause music!', ephemeral: true });
        }
        if (!serverQueue || !serverQueue.songs.length) {
            return message.reply({ content: 'There is no music playing to pause!', ephemeral: true });
        }
        if (!musicManager.isInSameVoiceChannel(message)) {
            return message.reply({ content: 'You must be in the same voice channel as the bot to pause music!', ephemeral: true });
        }

        const paused = musicManager.pauseMusic(message.guild);
        if (paused) {
            const embed = new EmbedBuilder()
                .setColor(0xFEE75C) // Yellow
                .setDescription('⏸️ Paused the current song.');
            return message.channel.send({ embeds: [embed] });
        } else {
            return message.reply({ content: 'The music is not currently playing or is already paused.', ephemeral: true });
        }
    },
};
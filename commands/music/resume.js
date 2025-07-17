// D:\NoSleepV2\commands\music\resume.js
const musicManager = require('../../utils/musicManager');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'resume',
        description: 'Resumes the paused song.',
        cooldown: 3,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = musicManager.getQueue(message.guild.id);

        if (!voiceChannel) {
            return message.reply({ content: 'You need to be in a voice channel to resume music!', ephemeral: true });
        }
        if (!serverQueue || !serverQueue.songs.length) {
            return message.reply({ content: 'There is no music to resume!', ephemeral: true });
        }
        if (!musicManager.isInSameVoiceChannel(message)) {
            return message.reply({ content: 'You must be in the same voice channel as the bot to resume music!', ephemeral: true });
        }

        const resumed = musicManager.resumeMusic(message.guild);
        if (resumed) {
            const embed = new EmbedBuilder()
                .setColor(0x57F287) // Green
                .setDescription('▶️ Resumed the music.');
            return message.channel.send({ embeds: [embed] });
        } else {
            return message.reply({ content: 'The music is not currently paused.', ephemeral: true });
        }
    },
};
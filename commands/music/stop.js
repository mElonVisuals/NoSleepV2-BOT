// D:\NoSleepV2\commands\music\stop.js
const musicManager = require('../../utils/musicManager');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'stop',
        description: 'Stops the music and clears the queue.',
        cooldown: 3,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const voiceChannel = message.member.voice.channel;
        const serverQueue = musicManager.getQueue(message.guild.id);

        if (!voiceChannel) {
            return message.reply({ content: 'You need to be in a voice channel to stop music!', ephemeral: true });
        }
        if (!serverQueue) {
            return message.reply({ content: 'There is no music playing to stop!', ephemeral: true });
        }
        if (!musicManager.isInSameVoiceChannel(message)) {
            return message.reply({ content: 'You must be in the same voice channel as the bot to stop music!', ephemeral: true });
        }

        const stopped = musicManager.stopMusic(message.guild);
        if (stopped) {
            const embed = new EmbedBuilder()
                .setColor(0xED4245) // Red
                .setDescription('⏹️ Stopped the music and cleared the queue. Leaving voice channel.');
            return message.channel.send({ embeds: [embed] });
        } else {
            return message.reply({ content: 'Could not stop the music.', ephemeral: true });
        }
    },
};
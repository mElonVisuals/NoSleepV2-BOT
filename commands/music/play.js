// D:\NoSleepV2\commands\music\play.js
const { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');
const { EmbedBuilder } = require('discord.js');
const musicManager = require('../../utils/musicManager'); // Import the music manager

module.exports = {
    data: {
        name: 'play',
        description: 'Plays music from YouTube (and other sources) in a voice channel.',
        cooldown: 5,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply({ content: 'You need to be in a voice channel to play music!', ephemeral: true });
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return message.reply({ content: 'I need the permissions to `Connect` and `Speak` in your voice channel!', ephemeral: true });
        }

        const songUrl = args[0];
        if (!songUrl) {
            return message.reply({ content: 'Please provide a song link or search query!', ephemeral: true });
        }

        let songInfo;
        try {
            // play-dl can handle various link types, but for simplicity, we focus on YouTube links provided directly
            // For a search query, you would use play.search() instead of play.yt_info()
            const result = await play.yt_info(songUrl); // Get detailed YouTube info
            if (!result || !result.video_details) {
                return message.reply('Could not find video information for the provided link. Please ensure it\'s a valid YouTube URL.');
            }

            songInfo = {
                title: result.video_details.title,
                url: result.video_details.url,
                duration: result.video_details.durationInSec,
                thumbnail: result.video_details.thumbnails[0].url // Get the first thumbnail
            };
        } catch (error) {
            console.error('Error fetching song info with play-dl:', error);
            return message.reply('Error fetching song information. Please ensure it\'s a valid YouTube link and try again.');
        }

        let serverQueue = musicManager.getQueue(message.guild.id);

        if (!serverQueue) {
            // Construct the queue object if it doesn't exist
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                player: null, // Discord.js v13 audio player
                songs: [],
                volume: 0.5,
                playing: true,
            };

            musicManager.setQueue(message.guild.id, queueContruct); // Store the new queue in the manager
            queueContruct.songs.push(songInfo); // Add the first song

            try {
                // Create voice connection
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });
                queueContruct.connection = connection;

                // Create audio player
                queueContruct.player = createAudioPlayer();
                connection.subscribe(queueContruct.player); // Subscribe the connection to the player

                // Event listener for when a song finishes
                queueContruct.player.on(AudioPlayerStatus.Idle, () => {
                    queueContruct.songs.shift(); // Remove the finished song
                    musicManager.playSong(message.guild, queueContruct.songs[0]); // Play the next song using the manager
                });

                // Error handling for the audio player
                queueContruct.player.on('error', error => {
                    console.error(`Error in audio player for guild ${message.guild.id}:`, error);
                    queueContruct.textChannel.send(`An error occurred during playback: \`${error.message}\`. Skipping song.`);
                    queueContruct.songs.shift(); // Skip the problematic song
                    if (queueContruct.songs.length > 0) {
                        musicManager.playSong(message.guild, queueContruct.songs[0]); // Try playing the next one
                    } else {
                        // If no more songs, clean up
                        queueContruct.textChannel.send('Queue finished! Leaving voice channel.');
                        if (queueContruct.connection) queueContruct.connection.destroy();
                        musicManager.deleteQueue(message.guild.id);
                    }
                });

                // Start playing the first song
                musicManager.playSong(message.guild, queueContruct.songs[0]);

            } catch (err) {
                console.error('Failed to join voice channel or play:', err);
                musicManager.deleteQueue(message.guild.id); // Clean up queue on error
                return message.channel.send(`Failed to join the voice channel: \`${err.message}\``);
            }
        } else {
            // If a queue already exists, just add the song
            serverQueue.songs.push(songInfo);
            const addedEmbed = new EmbedBuilder()
                .setColor(0xFEE75C) // Yellow
                .setTitle('🎶 Song Added to Queue')
                .setDescription(`**[${songInfo.title}](${songInfo.url})** has been added to the queue!`)
                .addFields(
                    { name: 'Position in queue', value: `${serverQueue.songs.length - 1}`, inline: true },
                    { name: 'Duration', value: `${new Date(songInfo.duration * 1000).toISOString().slice(11, 19)}`, inline: true }
                )
                .setThumbnail(songInfo.thumbnail)
                .setTimestamp();
            return message.channel.send({ embeds: [addedEmbed] });
        }
    },
    // The playSong method is now handled by musicManager and should no longer be here
};
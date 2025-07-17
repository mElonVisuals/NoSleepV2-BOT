// D:\NoSleepV2\commands\music\play.js
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl'); // Import play-dl
const { EmbedBuilder } = require('discord.js');

// Your existing queue map structure
const queue = new Map();

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
            // play-dl can handle direct YouTube links or even search queries
            // For simplicity, let's assume direct YouTube link for now
            // You can add search functionality later if desired
            const result = await play.yt_info(songUrl, {
                // You can add options here, e.g., 'quality': 'highestaudio'
            });

            if (!result || !result.video_details) {
                return message.reply('Could not find video information for the provided link.');
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

        let serverQueue = queue.get(message.guild.id);

        if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                player: null, // Discord.js v13 audio player
                songs: [],
                volume: 0.5,
                playing: true,
            };

            queue.set(message.guild.id, queueContruct);
            queueContruct.songs.push(songInfo);

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });
                queueContruct.connection = connection;

                queueContruct.player = createAudioPlayer();
                connection.subscribe(queueContruct.player); // Subscribe the connection to the player

                // When the player enters the Idle state, play the next song
                queueContruct.player.on(AudioPlayerStatus.Idle, () => {
                    queueContruct.songs.shift(); // Remove the finished song
                    this.playSong(message.guild, queueContruct.songs[0]);
                });

                // Handle player errors
                queueContruct.player.on('error', error => {
                    console.error(`Error in audio player for guild ${message.guild.id}:`, error);
                    queueContruct.textChannel.send(`An error occurred during playback: \`${error.message}\`. Skipping song.`);
                    queueContruct.songs.shift(); // Skip the problematic song
                    if (queueContruct.songs.length > 0) {
                        this.playSong(message.guild, queueContruct.songs[0]);
                    } else {
                        queueContruct.textChannel.send('Queue finished!');
                        queueContruct.connection.destroy();
                        queue.delete(message.guild.id);
                    }
                });

                this.playSong(message.guild, queueContruct.songs[0]);

            } catch (err) {
                console.error(err);
                queue.delete(message.guild.id);
                return message.channel.send(err);
            }
        } else {
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

    // This is a helper method, define it outside execute but within module.exports
    async playSong(guild, song) {
        const serverQueue = queue.get(guild.id);
        if (!song) {
            serverQueue.textChannel.send('Queue finished!');
            serverQueue.connection.destroy();
            queue.delete(guild.id);
            return;
        }

        try {
            // Get stream using play-dl
            const stream = await play.stream(song.url);
            const resource = createAudioResource(stream.stream, { inputType: stream.type });

            serverQueue.player.play(resource);

            const playingEmbed = new EmbedBuilder()
                .setColor(0x57F287) // Green
                .setTitle('▶️ Now Playing')
                .setDescription(`**[${song.title}](${song.url})**`)
                .addFields(
                    { name: 'Duration', value: `${new Date(song.duration * 1000).toISOString().slice(11, 19)}`, inline: true }
                )
                .setThumbnail(song.thumbnail)
                .setTimestamp();

            serverQueue.textChannel.send({ embeds: [playingEmbed] });
        } catch (error) {
            console.error(`Error playing song ${song.title}:`, error);
            serverQueue.textChannel.send(`Failed to play **${song.title}**: \`${error.message}\`. Skipping.`);
            serverQueue.songs.shift(); // Skip this problematic song
            this.playSong(guild, serverQueue.songs[0]); // Try playing the next one
        }
    },
};
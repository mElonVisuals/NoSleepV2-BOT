// D:\NoSleepV2\commands\music\play.js
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { EmbedBuilder } = require('discord.js');

// Simple queue for now (in-memory, won't persist across restarts)
const queue = new Map(); // guildId -> { voiceChannel, textChannel, connection, player, songs }

module.exports = {
    data: {
        name: 'play',
        description: 'Plays music from YouTube in a voice channel.',
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

        const songInfo = args.join(' ');
        if (!songInfo) {
            return message.reply({ content: 'Please provide a song title or YouTube URL!', ephemeral: true });
        }

        let song;
        try {
            // Basic URL validation
            if (ytdl.validateURL(songInfo)) {
                const info = await ytdl.getInfo(songInfo);
                song = {
                    title: info.videoDetails.title,
                    url: info.videoDetails.video_url,
                    thumbnail: info.videoDetails.thumbnails[0]?.url,
                    duration: info.videoDetails.lengthSeconds,
                    requester: message.author.tag
                };
            } else {
                // For simplicity, we'll just try to search for the first result using a dummy URL
                // In a real bot, you'd integrate with a search API (e.g., YouTube Data API)
                return message.reply({ content: 'Currently, I only support direct YouTube URLs for playing. Searching by title is not yet implemented.', ephemeral: true });
                // Placeholder if you want to implement search later:
                // const searchResult = await ytsr(songInfo, { limit: 1 });
                // if (!searchResult.items.length) {
                //     return message.reply({ content: 'Could not find any results for that query.', ephemeral: true });
                // }
                // const firstResult = searchResult.items[0];
                // song = {
                //     title: firstResult.title,
                //     url: firstResult.url,
                //     thumbnail: firstResult.thumbnail,
                //     duration: firstResult.duration,
                //     requester: message.author.tag
                // };
            }
        } catch (error) {
            console.error('Error fetching song info:', error);
            return message.reply({ content: 'Could not find that song or an error occurred.', ephemeral: true });
        }

        const serverQueue = queue.get(message.guild.id);

        if (!serverQueue) {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();

            const queueContruct = {
                voiceChannel: voiceChannel,
                textChannel: message.channel,
                connection: connection,
                player: player,
                songs: [],
                volume: 0.5,
                playing: true,
            };

            queue.set(message.guild.id, queueContruct);
            queueContruct.songs.push(song);

            try {
                // Play the song
                play(message.guild, queueContruct.songs[0]);
                player.on(AudioPlayerStatus.Idle, () => {
                    queueContruct.songs.shift(); // Remove current song
                    if (queueContruct.songs.length > 0) {
                        play(message.guild, queueContruct.songs[0]); // Play next song
                    } else {
                        queueContruct.connection.destroy();
                        queue.delete(message.guild.id);
                        queueContruct.textChannel.send('Queue finished, leaving voice channel.');
                    }
                });

                player.on('error', error => {
                    console.error('Audio Player Error:', error);
                    queueContruct.textChannel.send(`An error occurred while playing: ${error.message}`);
                    queueContruct.connection.destroy();
                    queue.delete(message.guild.id);
                });

            } catch (err) {
                console.error(err);
                queue.delete(message.guild.id);
                connection.destroy();
                return message.channel.send(err);
            }
        } else {
            serverQueue.songs.push(song);
            const embed = new EmbedBuilder()
                .setColor(0x00FF00) // Green
                .setTitle('🎶 Song Added to Queue')
                .setDescription(`**[${song.title}](${song.url})** has been added to the queue!`)
                .setThumbnail(song.thumbnail || null)
                .setTimestamp()
                .setFooter({ text: `Requested by ${song.requester}` });
            return message.channel.send({ embeds: [embed] });
        }

        async function play(guild, song) {
            const serverQueue = queue.get(guild.id);
            if (!song) {
                serverQueue.connection.destroy();
                queue.delete(guild.id);
                return;
            }

            const stream = ytdl(song.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25 // 32MB
            });

            const resource = createAudioResource(stream);
            serverQueue.player.play(resource);
            serverQueue.connection.subscribe(serverQueue.player);

            const embed = new EmbedBuilder()
                .setColor(0x0099FF) // Blue
                .setTitle('▶️ Now Playing')
                .setDescription(`**[${song.title}](${song.url})**`)
                .addFields(
                    { name: 'Requested By', value: song.requester, inline: true },
                    { name: 'Duration', value: song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : 'Live', inline: true }
                )
                .setThumbnail(song.thumbnail || null)
                .setTimestamp()
                .setFooter({ text: `Enjoy the music!` });

            serverQueue.textChannel.send({ embeds: [embed] });
        }
    },
};
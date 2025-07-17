// D:\NoSleepV2\utils\musicManager.js
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');
const { EmbedBuilder } = require('discord.js');

const queue = new Map(); // Centralized queue for all music commands

module.exports = {
    // Get the queue for a specific guild
    getQueue(guildId) {
        return queue.get(guildId);
    },

    // Set or update the queue for a specific guild
    setQueue(guildId, queueContruct) {
        queue.set(guildId, queueContruct);
    },

    // Delete the queue for a specific guild (e.g., when bot leaves VC)
    deleteQueue(guildId) {
        queue.delete(guildId);
    },

    /**
     * Plays the next song in the queue for a guild.
     * @param {Guild} guild The guild object.
     * @param {Object} song The song object to play.
     */
    async playSong(guild, song) {
        const serverQueue = queue.get(guild.id);
        if (!song) {
            // No more songs in queue
            serverQueue.textChannel.send('Queue finished! Leaving voice channel.');
            if (serverQueue.connection) {
                try {
                    serverQueue.connection.destroy(); // Disconnect
                } catch (e) {
                    console.error('Error destroying connection:', e);
                }
            }
            queue.delete(guild.id); // Delete queue from map
            return;
        }

        try {
            const stream = await play.stream(song.url); // Get stream using play-dl
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
            console.error(`Error playing song ${song.title} in guild ${guild.id}:`, error);
            serverQueue.textChannel.send(`Failed to play **${song.title}**: \`${error.message}\`. Skipping.`);
            serverQueue.songs.shift(); // Skip this problematic song
            // Try playing the next one recursively
            if (serverQueue.songs.length > 0) {
                 this.playSong(guild, serverQueue.songs[0]);
            } else {
                // If no more songs after skipping a problematic one, clean up
                serverQueue.textChannel.send('Queue finished! Leaving voice channel.');
                if (serverQueue.connection) {
                    try {
                        serverQueue.connection.destroy();
                    } catch (e) {
                        console.error('Error destroying connection:', e);
                    }
                }
                queue.delete(guild.id);
            }
        }
    },

    /**
     * Skips the current song.
     * @param {Guild} guild The guild object.
     * @returns {boolean} True if successful, false otherwise.
     */
    skipSong(guild) {
        const serverQueue = queue.get(guild.id);
        if (!serverQueue || !serverQueue.player) {
            return false; // No queue or player to skip
        }
        serverQueue.player.stop(); // This triggers AudioPlayerStatus.Idle, which plays the next song
        return true;
    },

    /**
     * Stops music playback, clears the queue, and makes the bot leave the voice channel.
     * @param {Guild} guild The guild object.
     * @returns {boolean} True if successful, false otherwise.
     */
    stopMusic(guild) {
        const serverQueue = queue.get(guild.id);
        if (!serverQueue) {
            return false; // No queue to stop
        }
        serverQueue.songs = []; // Clear the entire queue
        if (serverQueue.player) serverQueue.player.stop(); // Stop current playback
        if (serverQueue.connection) {
            try {
                serverQueue.connection.destroy(); // Disconnect bot from VC
            } catch (e) {
                console.error('Error destroying connection during stop:', e);
            }
        }
        queue.delete(guild.id); // Remove queue from map
        return true;
    },

    /**
     * Pauses the current song.
     * @param {Guild} guild The guild object.
     * @returns {boolean} True if successful, false otherwise.
     */
    pauseMusic(guild) {
        const serverQueue = queue.get(guild.id);
        if (!serverQueue || !serverQueue.player) {
            return false;
        }
        if (serverQueue.player.state.status === AudioPlayerStatus.Playing || serverQueue.player.state.status === AudioPlayerStatus.Buffering) {
            serverQueue.player.pause();
            return true;
        }
        return false; // Not playing/buffering, so can't pause
    },

    /**
     * Resumes a paused song.
     * @param {Guild} guild The guild object.
     * @returns {boolean} True if successful, false otherwise.
     */
    resumeMusic(guild) {
        const serverQueue = queue.get(guild.id);
        if (!serverQueue || !serverQueue.player) {
            return false;
        }
        if (serverQueue.player.state.status === AudioPlayerStatus.Paused) {
            serverQueue.player.unpause();
            return true;
        }
        return false; // Not paused, so can't resume
    },

    /**
     * Checks if the user is in the same voice channel as the bot.
     * @param {Message} message The Discord message object.
     * @returns {boolean} True if in same VC, false otherwise.
     */
    isInSameVoiceChannel(message) {
        const serverQueue = queue.get(message.guild.id);
        if (!serverQueue || !message.member.voice.channel) {
            return false; // Bot not in VC or user not in VC
        }
        return serverQueue.voiceChannel.id === message.member.voice.channel.id;
    }
};
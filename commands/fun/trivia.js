// D:\NoSleepV2\commands\fun\trivia.js
const { EmbedBuilder } = require('discord.js');
const axios = require('axios'); // npm install axios

// A simple map to store active trivia games per guild
const activeGames = new Map(); // guildId -> { question, answer, collector, timeout }

module.exports = {
    data: {
        name: 'trivia',
        description: 'Starts a trivia game with a random question.',
        cooldown: 10,
    },
    async execute(message, args, client, currentGuildSettings, pool) {
        if (activeGames.has(message.guild.id)) {
            return message.reply({ content: 'There is already an active trivia game in this server!', ephemeral: true });
        }

        await message.channel.sendTyping();

        try {
            // Fetch a random trivia question from Open Trivia Database API
            const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
            const data = response.data.results[0];

            if (!data) {
                return message.reply({ content: 'Could not fetch a trivia question at this moment. Please try again later.', ephemeral: true });
            }

            const question = data.question
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/&uuml;/g, 'ü')
                .replace(/&ldquo;/g, '“')
                .replace(/&rdquo;/g, '”')
                .replace(/&hellip;/g, '…')
                .replace(/&deg;/g, '°')
                .replace(/&shy;/g, '')
                .replace(/&rdquo;/g, '”')
                .replace(/&prime;/g, '′')
                .replace(/&Prime;/g, '″')
                .replace(/&frac14;/g, '¼')
                .replace(/&frac12;/g, '½')
                .replace(/&frac34;/g, '¾')
                .replace(/&ndash;/g, '–');


            const correctAnswer = data.correct_answer
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/&uuml;/g, 'ü')
                .replace(/&ldquo;/g, '“')
                .replace(/&rdquo;/g, '”')
                .replace(/&hellip;/g, '…')
                .replace(/&deg;/g, '°')
                .replace(/&shy;/g, '')
                .replace(/&rdquo;/g, '”')
                .replace(/&prime;/g, '′')
                .replace(/&Prime;/g, '″')
                .replace(/&frac14;/g, '¼')
                .replace(/&frac12;/g, '½')
                .replace(/&frac34;/g, '¾')
                .replace(/&ndash;/g, '–');

            const incorrectAnswers = data.incorrect_answers.map(ans =>
                ans.replace(/&quot;/g, '"')
                   .replace(/&#039;/g, "'")
                   .replace(/&amp;/g, '&')
                   .replace(/&uuml;/g, 'ü')
                   .replace(/&ldquo;/g, '“')
                   .replace(/&rdquo;/g, '”')
                   .replace(/&hellip;/g, '…')
                   .replace(/&deg;/g, '°')
                   .replace(/&shy;/g, '')
                   .replace(/&rdquo;/g, '”')
                   .replace(/&prime;/g, '′')
                   .replace(/&Prime;/g, '″')
                   .replace(/&frac14;/g, '¼')
                   .replace(/&frac12;/g, '½')
                   .replace(/&frac34;/g, '¾')
                   .replace(/&ndash;/g, '–')
            );

            const allAnswers = [...incorrectAnswers, correctAnswer].sort(() => Math.random() - 0.5); // Shuffle answers

            const embed = new EmbedBuilder()
                .setColor(0xFFA500) // Orange
                .setTitle('❓ Trivia Time!')
                .setDescription(question)
                .addFields(
                    { name: 'Category', value: data.category, inline: true },
                    { name: 'Difficulty', value: data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1), inline: true },
                    { name: 'Options', value: allAnswers.map((ans, i) => `${i + 1}. ${ans}`).join('\n') }
                )
                .setTimestamp()
                .setFooter({ text: `You have 30 seconds to answer! Type the number of your choice.` });

            const sentMessage = await message.channel.send({ embeds: [embed] });

            activeGames.set(message.guild.id, {
                question: question,
                answer: correctAnswer,
                allAnswers: allAnswers,
                collector: null,
                timeout: null
            });

            const filter = m => !m.author.bot && ['1', '2', '3', '4'].includes(m.content);
            const collector = message.channel.createMessageCollector({ filter, time: 30000 }); // 30 seconds

            activeGames.get(message.guild.id).collector = collector;

            collector.on('collect', async m => {
                const guessIndex = parseInt(m.content) - 1;
                const guess = allAnswers[guessIndex];

                if (guess === correctAnswer) {
                    const winnerEmbed = new EmbedBuilder()
                        .setColor(0x2ECC71)
                        .setTitle('🎉 Correct Answer!')
                        .setDescription(`${m.author} got the correct answer! The answer was **${correctAnswer}**!`)
                        .setTimestamp()
                        .setFooter({ text: `Winner: ${m.author.tag}`, iconURL: m.author.displayAvatarURL({ dynamic: true }) });
                    await message.channel.send({ embeds: [winnerEmbed] });
                    collector.stop('answered');
                } else {
                    await m.reply({ content: `❌ Incorrect! Try again.`, ephemeral: true });
                }
            });

            collector.on('end', async (collected, reason) => {
                activeGames.delete(message.guild.id);
                if (reason === 'time') {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('⏰ Time Up!')
                        .setDescription(`Time's up! No one got the answer. The correct answer was **${correctAnswer}**.`)
                        .setTimestamp()
                        .setFooter({ text: `Game Over` });
                    await message.channel.send({ embeds: [timeoutEmbed] });
                }
                // 'answered' reason is handled by the 'collect' event before stopping
            });

        } catch (error) {
            console.error('Error in trivia command:', error);
            activeGames.delete(message.guild.id); // Ensure game is removed on error
            await message.reply({ content: '❌ An error occurred while trying to start the trivia game. Please try again later.', ephemeral: true });
        }
    },
};
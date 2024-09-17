
import { Client, GatewayIntentBits } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, AudioPlayer } from '@discordjs/voice';
import ytdl from 'ytdl-core';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const prefix = '$';

client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (command === 'join') {
        if (!message.member?.voice.channel) {
            return message.reply('You need to be in a voice channel to use this command.');
        }

        const channel = message.member.voice.channel;
        joinVoiceChannel({
            channelId: channel.id,
            guildId: message.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
        message.reply(`Joined ${channel.name}`);
    }

    if (command === 'play') {
        if (!args.length) {
            return message.reply('You need to provide a YouTube URL.');
        }

        const url = args[0];
        if (!ytdl.validateURL(url)) {
            return message.reply('Please provide a valid YouTube URL.');
        }

        const voiceChannel = message.member?.voice.channel;
        if (!voiceChannel) {
            return message.reply('You need to be in a voice channel to play music.');
        }

        const player: AudioPlayer = createAudioPlayer();
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        connection.on('stateChange', (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle) {
                connection.disconnect();
            }
        });

        const resource = createAudioResource(ytdl(url, { filter: 'audioonly' }));
        player.play(resource);
        connection.subscribe(player);

        message.reply(`Now playing: ${url}`);
    }
});

client.login('TOKEN');

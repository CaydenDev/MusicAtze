import { Client, GatewayIntentBits } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import ytdl from 'ytdl-core';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const prefix = '!';
const playlists: { [userId: string]: string[] } = {};


const playTrack = (url: string, voiceChannel: any) => {
    const player = createAudioPlayer();
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
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

    player.on(AudioPlayerStatus.Playing, () => {
        console.log(`Now playing: ${url}`);
    });
};

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


        playTrack(url, voiceChannel);
        message.reply(`Now playing: ${url}`);
    }

    if (command === 'pause') {
        const player = client.voice.adapters.get(message.guild.id)?.player;
        if (player) {
            player.pause();
            message.reply('Paused the music.');
        } else {
            message.reply('No music is currently playing.');
        }
    }

    if (command === 'stop') {
        const player = client.voice.adapters.get(message.guild.id)?.player;
        if (player) {
            player.stop();
            message.reply('Stopped the music.');
        } else {
            message.reply('No music is currently playing.');
        }
    }

    if (command === 'playlist') {
        const userId = message.author.id;
        const url = args[0];
        if (url) {
            if (!ytdl.validateURL(url)) {
                return message.reply('Please provide a valid YouTube URL.');
            }

            if (!playlists[userId]) {
                playlists[userId] = [];
            }
            playlists[userId].push(url);
            message.reply(`Added to your playlist: ${url}`);
        } else {
            const userPlaylist = playlists[userId];
            if (userPlaylist && userPlaylist.length > 0) {
                message.reply(`Your playlist: \n${userPlaylist.join('\n')}`);
            } else {
                message.reply('Your playlist is empty.');
            }
        }
    }

    if (command === 'saveplaylist') {
        const userId = message.author.id;

        const userPlaylist = playlists[userId] || [];
        if (userPlaylist.length === 0) {
            message.reply('You have no playlist to save.');
        } else {

            message.reply(`Your playlist has been saved (in-memory example): \n${userPlaylist.join('\n')}`);
        }
    }

    if (command === 'restart') {
        const userId = message.author.id;
        const allowedUserId = 'USERID';
        if (userId === allowedUserId) {
            message.reply('Restarting the bot...');
            client.destroy();
            client.login('TOKEN');
        } else {
            message.reply('You do not have permission to restart the bot.');
        }
    }
});

client.login('TOKEN');

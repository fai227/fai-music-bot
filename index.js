require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const MusicList = require("./scripts/musicList");
const ytdl = require("ytdl-core");
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, StreamType, demuxProbe, AudioPlayerStatus } = require("@discordjs/voice");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// #region コマンド
const Commands = [
    {
        name: "queue",
        description: "キューの追加・表示（追加の場合、コマンド使用者はボイスチャットに入っている必要があります）",
        options: [{
            type: 3,
            name: "url",
            description: "流したい音楽のURLを入力してください。このオプションを省略すると、現在のキューを表示します。",
            required: false
        }],
        async execute(interaction) {
            let url = interaction.options.getString(this.options[0].name);

            //キューの閲覧
            if (url == null) {
                interaction.reply(MusicList.toString());
                return;
            }

            //URLチェック
            if (!ytdl.validateURL(url)) {
                interaction.reply("URLが無効です。");
                return;
            }

            //ボイスチャンネル取得、登録
            try {
                const guildName = interaction.guild.name;
                const member = client.guilds.cache.get(interaction.guild.id).members.cache.get(interaction.member.id);
                const voiceChannelId = member.voice.channelId;

                MusicList.push(voiceChannelId, guildName, url);

            } catch (e) {
                interaction.reply("キューに追加するには、Botがいるサーバーのボイスチャットに入り、同サーバーのテキストチャットで使用する必要があります。");
            }

            //キューに追加した報告
            const info = await ytdl.getInfo(url);
            interaction.reply(`キューに追加されました：${info.videoDetails.title}`);

            //ボイスチャンネルに入っていない場合は接続
            let connection = joinVoiceChannel({
                channelId: MusicList.next().id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });
            let readableStream = await ytdl(url, { filter: "audio" });
            const player = createAudioPlayer();

            const { stream, type } = await demuxProbe(readableStream);
            const resource = createAudioResource(stream, { inputType: type });

            connection.subscribe(player);

            player.play(resource);
            player.on(AudioPlayerStatus.Buffering, async () => {
                console.log("aaa");


            })

            //再生していない場合は再生

        }
    }, {
        name: "loop",
        description: "楽曲ループのオンオフ設定（別サーバーの予約が入っている際はループされません。）",
        options: [{
            type: 3,
            name: "status",
            description: "「on」か「off」を入力すると直接設定をすることができます。このオプションを省略するとオンオフが切り替わります。",
            required: false,
            choices: [{ name: "on", value: "on" }, { name: "off", value: "off" }]
        }],
        async execute(interaction) {
            let status = interaction.options.getString("status");
            if (status) {
                loop = status == "on";
            } else {
                loop = !loop;
            }
            interaction.reply(`ループが**${loop ? "有" : "無"}効化**されました。`);
        }
    }
];
// #endregion

// #region 楽曲再生メイン部分

//必要定数
let loop = false;
async function MusicPlay() {

}

async function MusicStart() {

}

// #endregion


client.once(Events.ClientReady, async (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    //SetCommand();
    client.application.commands.set([]);
    client.application.commands.set(Commands, "569768541826580480");

});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) {
        return;
    }

    //console.log(interaction);

    for (let i = 0; i < Commands.length; i++) {
        if (Commands[i].name === interaction.commandName) {
            await Commands[i].execute(interaction);
            return;
        }
    }
});


client.login(process.env.DISCORD_TOKEN);
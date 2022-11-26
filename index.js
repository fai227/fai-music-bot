require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const MusicList = require("./scripts/musicList");
const ytdl = require("ytdl-core");
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, StreamType, demuxProbe, AudioPlayerStatus } = require("@discordjs/voice");
const PriorityUser = require("./priority.json");


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
            await interaction.reply({
                content: "読み込み中です…",
                ephemeral: true
            });

            const url = interaction.options.getString(this.options[0].name);

            //キューの閲覧
            if (url == null) {
                await interaction.editReply(MusicList.ToString());
                return;
            }

            //URLチェック
            if (!ytdl.validateURL(url)) {
                await interaction.editReply("URLが無効です。");
                return;
            }

            //ボイスチャンネル取得、登録
            try {
                const guildId = interaction.guildId;
                const guildName = interaction.guild.name;
                const voiceAdapterCreator = interaction.guild.voiceAdapterCreator;

                const member = await client.guilds.cache.get(interaction.guildId).members.cache.get(interaction.member.id).fetch(true);

                const channelId = member.voice.channelId;  // member.voice.channelId;

                if (!channelId) {
                    throw "Voice channel not found.";
                }

                //優先の場合
                if (PriorityUser.includes(interaction.user.username)) {
                    MusicList.PriorityPush(
                        guildId,
                        guildName,
                        channelId,
                        voiceAdapterCreator,
                        url
                    );
                }
                //普通の場合
                else {
                    MusicList.Push(
                        guildId,
                        guildName,
                        channelId,
                        voiceAdapterCreator,
                        url
                    );
                }
            } catch (e) {
                await interaction.editReply("キューに追加するには、Botがいるサーバーのボイスチャットに入り、同サーバーのテキストチャットで使用する必要があります。");
                return;
            }

            //キューに追加した報告
            const info = await ytdl.getInfo(url);
            await interaction.editReply(`キューに追加されました：${info.videoDetails.title}`);

            //ボイスチャンネルに入っていない場合は接続
            if (connection == null) {
                await StartMusic();
            }
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
let connection;
async function StartMusic() {
    const nowTrack = MusicList.Now();
    connection = joinVoiceChannel({
        channelId: nowTrack.channelId,
        guildId: nowTrack.guildId,
        adapterCreator: nowTrack.voiceAdapterCreator,
    });

    const readbleStream = await ytdl(nowTrack.url, { filter: "audio" });
    const player = createAudioPlayer();
    const { stream, type } = await demuxProbe(readbleStream);
    const resource = createAudioResource(stream, { inputType: type });

    connection.subscribe(player);
    player.play(resource);

    //終了時
    player.on(AudioPlayerStatus.Idle, async () => {
        //ループ判別が必要


        const nextTrack = MusicList.Next();
        //次の楽曲がある場合
        if (nextTrack) {

        }
        //次の楽曲がないときは終了
        else {
            connection.destroy();
        }

        //キューを進める
        MusicList.Shift();
    });
}

// #endregion


client.once(Events.ClientReady, async (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    //SetCommand();
    await client.application.commands.set([]);
    await client.application.commands.set(Commands);  //, "704182270474322010");
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) {
        return;
    }

    console.log(`${interaction.commandName}コマンド使用：${interaction.user.username}(${interaction.user.id})`);
    //console.log(interaction);

    for (let i = 0; i < Commands.length; i++) {
        if (Commands[i].name === interaction.commandName) {
            await Commands[i].execute(interaction);
            return;
        }
    }
});


client.login(process.env.DISCORD_TOKEN);
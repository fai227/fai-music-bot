console.log("Node Application Started");
require("dotenv").config();
require("./scripts/web")();
const { Client, GatewayIntentBits, Events, ActivityType } = require("discord.js");
const Queue = require("./scripts/queue");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const PriorityUser = require("./priority.json");
const play = require("play-dl");


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

            const musicUrl = interaction.options.getString(this.options[0].name);

            //キューの閲覧
            if (musicUrl == null) {
                await interaction.editReply(Queue.ToString());
                return;
            }

            //URLチェック
            if (!musicUrl.startsWith('https') || play.yt_validate(musicUrl) != 'video') {
                await interaction.editReply("URLが無効です。また、プレイリストは再生できません。");
                return;
            }

            //名前を取得
            const musicInfo = await play.video_info(musicUrl);
            const musicName = musicInfo.video_details.title;

            //ボイスチャンネル取得、登録
            try {
                const guildId = interaction.guildId;
                const guildName = interaction.guild.name;
                const voiceAdapterCreator = interaction.guild.voiceAdapterCreator;
                const member = await client.guilds.cache.get(interaction.guildId).members.cache.get(interaction.member.id).fetch(true);
                const channelId = member.voice.channelId;

                if (!channelId) {
                    throw "Voice channel not found.";
                }

                //優先の場合
                if (PriorityUser.includes(interaction.user.username)) {
                    Queue.PriorityPushTrack(guildId, guildName, channelId, voiceAdapterCreator, musicUrl, musicName);
                }
                //普通の場合
                else {
                    Queue.PushTrack(guildId, guildName, channelId, voiceAdapterCreator, musicUrl, musicName);
                }
            } catch (e) {
                await interaction.editReply("キューに追加するには、Botがいるサーバーのボイスチャットに入り、同サーバーのテキストチャットで使用する必要があります。");
                return;
            }

            //キューに追加した報告
            await interaction.editReply(`キューに追加されました：${musicName}`);

            //ボイスチャンネルに入っていない場合は開始
            if (connection == null) {
                StartMusic();
            }
        }
    }, {
        name: "loop",
        description: "楽曲ループのオンオフ設定（キューに楽曲が入っている場合は適用されません。）",
        options: [{
            type: 3,
            name: "status",
            description: "「on」か「off」を入力すると直接設定をすることができます。このオプションを省略するとループの状態を変更することができます。",
            required: false,
            choices: [{ name: "on", value: "on" }, { name: "off", value: "off" }]
        }],
        async execute(interaction) {
            let status = interaction.options.getString("status");
            let loop = status == "on" ? true : false;

            if (!status) {
                loop = !Queue.GetRepeat(interaction.guildId);
            }

            Queue.SetRepeat(interaction.guildId, loop);
            await interaction.reply({
                content: `ループが**${loop ? "有" : "無"}効化**されました。`,
                ephemeral: true
            });
        }
    }, {
        name: "skip",
        description: "現在の楽曲をスキップします。",
        async execute(interaction) {
            //楽曲がかかっていないとき
            if (!connection) {
                await interaction.reply({
                    content: "楽曲が再生されていません。",
                    ephemeral: true
                });
            }
            //かかっているとき
            else {
                await interaction.reply({
                    content: "楽曲をスキップします。",
                    ephemeral: true
                });
                await NextTrack();
            }
        }
    }
];
// #endregion

// #region 楽曲再生メイン部分

//必要定数
const player = createAudioPlayer();
let connection;
async function StartMusic() {
    const nowTrack = Queue.GetNowTrack();

    if (!connection) {
        await Join(nowTrack.channelId, nowTrack.guildId, nowTrack.voiceAdapterCreator);
    }

    //Get Stream
    const source = await play.stream(nowTrack.musicUrl, { discordPlayerCompatibility: true });
    const resource = createAudioResource(source.stream, { inputType: source.type });

    //Set Stream
    connection.subscribe(player);
    player.play(resource);

    //Set Activity
    client.user.setActivity(nowTrack.musicName, {
        type: ActivityType.Listening
    });

    //On Finish
    player.on(AudioPlayerStatus.Idle, async () => {
        console.log("Idle");
        NextTrack();
    });
    /*
    player.on(AudioPlayerStatus.AutoPaused, () => {
        console.log("Auto Paused");
    })
    player.on(AudioPlayerStatus.Buffering, () => {
        console.log("Buffering");
    })
    player.on(AudioPlayerStatus.Paused, () => {
        console.log("Paused");
    })
    player.on(AudioPlayerStatus.Playing, () => {
        console.log("Playing");
    })
    */
}

async function Join(channelId, guildId, voiceAdapterCreator) {
    LeaveVC();

    connection = joinVoiceChannel({
        channelId: channelId,
        guildId: guildId,
        adapterCreator: voiceAdapterCreator,
    });
}

async function NextTrack() {
    const nowTrack = Queue.GetNowTrack();
    const nextTrack = Queue.GetNextTrack();

    if (!nowTrack) {
        LeaveVC();
        return;
    }

    //次の楽曲がある場合
    if (nextTrack) {
        //違うチャンネルに移動する必要がある時
        if (nowTrack.channelId != nextTrack.channelId) {
            await Join(nextTrack.channelId, nextTrack.guildId, nextTrack.voiceAdapterCreator);
        }

        //次に進める
        Queue.ShiftTrack();

        //楽曲開始
        StartMusic();
    }
    //次の楽曲がないときはループを見る
    else {
        //ループがあるときは続ける
        if (Queue.GetRepeat(nowTrack.guildId)) {
            StartMusic();
        }
        //ループが無いときは終了
        else {
            LeaveVC();

            //キューを進める
            Queue.ShiftTrack();
        }
    }
}

function LeaveVC() {
    if (!connection) {
        return;
    }

    ResetActivity();

    connection.destroy();
    connection = null;
}

function ResetActivity() {
    client.user.setActivity("Type /queue", {
        type: ActivityType.Playing
    });

}

// #endregion


client.once(Events.ClientReady, async (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    //SetCommand();
    await client.application.commands.set([]);
    await client.application.commands.set(Commands);  //, "704182270474322010");

    ResetActivity();
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) {
        return;
    }

    console.log(`${interaction.commandName} command is used by ${interaction.user.username}(${interaction.user.id})`);
    //console.log(interaction);

    for (let i = 0; i < Commands.length; i++) {
        if (Commands[i].name === interaction.commandName) {
            await Commands[i].execute(interaction);
            return;
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
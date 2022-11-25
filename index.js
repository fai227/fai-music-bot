require("dotenv").config();
const { Client, GatewayIntentBits, Events, ApplicationCommandOptionType } = require("discord.js");
const musicList = require("./scripts/musicList");
const MusicList = require("./scripts/musicList");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// #region コマンド
const Commands = [
    {
        name: "queue",
        description: "キューの追加・表示（追加の場合、コマンド使用者はボイスチャットに入っている必要があります。）",
        options: [{
            type: 3,
            name: "url",
            description: "流したい音楽のURLを入力してください。このオプションを省略すると、現在のキューを表示します。",
            required: false
        }],
        async execute(interaction) {
            let url = interaction.options.getString(this.name);

            //キューの閲覧
            if (url === null) {
                interaction.reply(musicList.toString());
            }

            //URLチェック


            //キューに登録


            //再生開始
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

async function Play() {

}

// #endregion


client.once(Events.ClientReady, async (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    //SetCommand();
    client.application.commands.set([]);
    client.application.commands.set(Commands, "704182270474322010");

});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isCommand()) {
        return;
    }

    for (let i = 0; i < Commands.length; i++) {
        if (Commands[i].name === interaction.commandName) {
            await Commands[i].execute(interaction);
        }
    }
});


client.login(process.env.DISCORD_TOKEN);
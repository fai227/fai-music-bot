require("dotenv").config();
const { Client, GatewayIntentBits, Events, ApplicationCommandOptionType } = require("discord.js");
const MusicList = require("./scripts/musicList");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// #region コマンド
/*
const { SlashCommandBuilder } = require("discord.js");
const Commands = [
    new SlashCommandBuilder()
        .setName("queue")
]
*/

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
            if (url === null) {
                interaction.reply();
            }
        }
    }
];


function SetCommand() {
    Commands.forEach(command => {
        const json = command.toJSON();
        //client.commands.set(command.);
    });


    console.log("Commands Ready!");
}

// #endregion



client.once(Events.ClientReady, async (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    //SetCommand();
    client.application.commands.set([]);
    client.application.commands.set(Commands, "704182270474322010");

});

client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isCommand()) {
        return;
    }

    console.log(interaction.commandName);
    console.log(interaction.options.getString("url"));
});


client.login(process.env.DISCORD_TOKEN);
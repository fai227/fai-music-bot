const Discord = require("discord.js");
const ytdl = require('ytdl-core');
const client = new Discord.Client({
    intents: ["Intents.FLAGS.GUILDS", "Intents.FLAGS.GUILD_MESSAGES", "Intents.FLAGS.GUILD_VOICE_STATES"]
});


const discordButton = require('discord.js-buttons')(client);

const keepAlive = require("./server");
const fs = require("fs");

const { Player } = require("discord-music-player");
const player = new Player(client, {
    leaveOnEmpty: false, // This options are optional.
});
client.player = player;

const { RepeatMode } = require('discord-music-player');

const translate = require("deepl");

let mainTextChannel;
let mainVoiceChannel;
let learnChannel = "917995975858090015";
let commandList = [];

let isPlaying = false;

let latestTranslation = "最新の翻訳が存在しません。";
let latestLanguage = "";

let queue = [];
let queueNumber = 0;
let connection;

let repeat = false;

let latestImage;
let imageURLs = [];

const { google } = require('googleapis');
const customSearch = google.customsearch("v1");

const backButton = new discordButton.MessageButton().setStyle("blurple").setLabel("<<").setID("backButton");
const playButton = new discordButton.MessageButton().setStyle("green").setLabel("▷").setID("playButton");
const repeatButton = new discordButton.MessageButton().setStyle("red").setLabel("↻").setID("repeatButton");
const nextButton = new discordButton.MessageButton().setStyle("blurple").setLabel(">>").setID("nextButton");

keepAlive();

let serverMode = "JOSHISU";

client.on("ready", () => {

    console.log(`Logged in as ${client.user.tag}!`);
    changeServerMode();
})

function changeServerMode() {
    if (serverMode == "JOSHISU") {
        mainTextChannel = client.channels.cache.get('831367778686205962');
        mainVoiceChannel = client.channels.cache.get("831367778686205963");
        client.user.setActivity("情シスサーバーモード");
    } else if (serverMode == "KOJIN") {
        mainTextChannel = client.channels.cache.get('704182270474322013');
        mainVoiceChannel = client.channels.cache.get("704182270474322014");
        client.user.setActivity("ファイの個人サーバーモード");
    } else if (serverMode == "UNDERTALE") {
        mainTextChannel = client.channels.cache.get('905074642597847130');
        mainVoiceChannel = client.channels.cache.get("569768541826580487");
        client.user.setActivity("同国サーバーモード");
    } else if (serverMode == "DQX") {
        mainTextChannel = client.channels.cache.get('732241202815959040');
        mainVoiceChannel = client.channels.cache.get("574351486327455749");
        client.user.setActivity("ドラクエサーバーモード");
    } else if (serverMode == "ASOBITAI") {
        mainTextChannel = client.channels.cache.get('871380349270249486');
        mainVoiceChannel = client.channels.cache.get("871380349270249487");
        client.user.setActivity("遊びたいサーバーモード");
    } else if (serverMode == "ARUPEJIO") {
        mainTextChannel = client.channels.cache.get('939547730391482388');
        mainVoiceChannel = client.channels.cache.get("935802800238112779");
        client.user.setActivity("アルペジオ音ゲーサーバーモード");
    } else {
        mainTextChannel = client.channels.cache.get('903191893238759454');
        mainVoiceChannel = client.channels.cache.get("569768541826580487");
        client.user.setActivity("情シスサーバーモード");
    }
}

client.on("message", msg => {
    if (msg.attachments.size > 0) {
        latestImage = msg;
        return;
    }

    if (msg.channel.id == "704182270474322013") {
        learn(msg.channel);
    }

    if (msg.author != client.user && msg.content.charAt(0) == '?') {
        sendMessage(msg, msg.content);
    } else if (msg.author != client.user) { //人工知能を用いてポジティブ度を計算
        let ans = calcuPos(msg.content);
        if (ans > 0.9) {
            //めっちゃポジティブ
            msg.channel.send("とても喜んでいる人間がいます。潰しましょう。");
        } else if (ans < 0.1) {
            //めっちゃネガティブ
            msg.channel.send("とても悲しんでいる人間がいます。\r励ましてあげましょう。");
        }
    }
})

//機械学習する
let messageArray = [];
async function learn(channel) {
    channel.messages.fetch({ limit: 100 }).then(async messages => {
        messages.forEach(message => { messageArray[messageArray.length] = message.content })
    })
}

function calcuPos(content) {
    //ポジティブ度計算
    let ans = 0.5;

    console.log("ポジティブ度：" + ans);
    return ans;
}

function sendMessage(msg, str) {
    let bot = msg.channel;
    let mojiIchi = str.indexOf(" ");
    let command;
    let content = "";
    if (mojiIchi == -1) {
        command = str.substring(1);
    } else {
        command = str.substring(1, mojiIchi);
        content = str.substr(mojiIchi + 1);
    }
    switch (command) {
        case 'help':
            let code = ["help", "omu", "code", "write", "view", "viewAll", "execute", "g", "join", "leave", "play", "next", "repeat", "back", "q", "music", "loadImage", "saveImage"];
            let string = "";
            for (let i = 0; i < code.length; i++) {
                string += code[i] + ", ";
            }
            bot.send(string);

            bot.send("r/remind/reminderでリマインダーを作成。\r「?r 時間 内容」と半角スペースを空けて設定。\r時間は、「YYYY/MM/DD HH/MM」「MM/DD HH/MM」「MM/DD」「HH/MM」の形式で設定してください。\r日付を入力しなかった場合は次の日に、時間を入力しなかった場合は朝9時になります。");
            bot.send("")

            break;
        case 'music':

            bot.send("音楽", { buttons: [backButton, playButton, repeatButton, nextButton] });
            break;

        case 'omu':
            bot.send(content);
            break;

        case 'code':

            eval(content);
            break;

        case "r":
        case "reminder":
        case "remind":
            //2021/09/12 09:09
            //09/29 09:09
            //09/29
            //09:09
            let time = "";
            let remindContent = ""
            if (content.substring(4, 5) == '/') {
                time = content.substring(0, 16);
                remindContent = content.substring(17);
            } else if (content.substring(8, 9) == ':') {
                let tmpDate = new Date();
                tmpDate.setHours(tmpDate.getHours() + 9);
                tmpDate.setMonth(tmpDate.getMonth() + 1);

                time = (tmpDate.getFullYear()) + "/" + content.substring(0, 11);
                remindContent = content.substring(11);
            } else if (content.substring(2, 3) == '/') {
                let tmpDate = new Date();
                tmpDate.setHours(tmpDate.getHours() + 9);
                tmpDate.setMonth(tmpDate.getMonth() + 1);
                time = tmpDate.getFullYear() + "/" + content.substring(0, 5) + " 09:00";
                remindContent = content.substring(6);
            } else if (content.substring(2, 3) == ':') {
                let tmpDate = new Date();
                tmpDate.setHours(tmpDate.getHours() + 9);
                tmpDate.setMonth(tmpDate.getMonth() + 1);
                tmpDate.setDate(tmpDate.getDate() + 1);

                time = tmpDate.getFullYear() + "/" + toDoubleDigits(tmpDate.getMonth()) + "/" + toDoubleDigits(tmpDate.getDate()) + " " + content.substring(0, 5);
                remindContent = content.substring(6);
            } else {
                let tmpDate = new Date();
                tmpDate.setHours(tmpDate.getHours() + 9);
                tmpDate.setMonth(tmpDate.getMonth() + 1);
                tmpDate.setDate(tmpDate.getDate() + 1);

                time = tmpDate.getFullYear() + "/" + toDoubleDigits(tmpDate.getMonth()) + "/" + toDoubleDigits(tmpDate.getDate()) + " 09:00";
                remindContent = content;
            }

            addReminder(time, remindContent, bot.id)
            bot.send("**リマインダーを登録しました。**\r" + time + "：" + remindContent)
            break;

        case "t":
            content = content.replace("\r", "");
            content = content.replace("\n", "");
            content = content.replace(/\r?\n/g, "");
            translate({
                free_api: true,
                text: content,
                target_lang: 'EN',
                auth_key: '088b11c4-0e32-50cc-05a3-4228acfffd44:fx'
            })
                .then(result => {
                    bot.send(result.data.translations[0].text);
                }).catch(error => {
                    bot.send(error + "");
                })
            break;

        case "rt":
            if (content == "") {
                bot.send(latestLanguage + "：" + latestTranslation);
                return;
            }
            let languageArray = ["DE", "EN", "ES", "FR", "IT", "RU"];
            let languageNumber = Math.floor(Math.random() * languageArray.length);
            content = content.replace("\r", "");
            content = content.replace("\n", "");
            content = content.replace(/\r?\n/g, "");
            let translateResult = "";
            translate({
                free_api: true,
                text: content,
                target_lang: languageArray[languageNumber],
                auth_key: '088b11c4-0e32-50cc-05a3-4228acfffd44:fx'
            })
                .then(result => {

                    translateResult = result.data.translations[0].text + "";
                    latestTranslation = translateResult;
                    latestLanguage = languageArray[languageNumber];
                    translate({
                        free_api: true,
                        text: translateResult,
                        target_lang: 'JA',
                        auth_key: '088b11c4-0e32-50cc-05a3-4228acfffd44:fx'
                    })
                        .then(result1 => {
                            translateResult = result1.data.translations[0].text;
                            bot.send(translateResult);
                        }).catch(error => {
                            bot.send(error + "");
                        })
                }).catch(error => {
                    bot.send(error + "");
                })


            break;

        case "p":
            bot.send("与えられた文章のポジティブ度は、" + Math.round(culcuPos(content) * 100) + "％です。");
            break;



        case 'q':
            try {
                if (content == "") { //queue表示
                    for (let i = queueNumber; i < queue.length; i++) {
                        bot.send("キュー" + (i - queueNumber + 1) + "番目：" + queue[i]);
                    }
                    if (queue.length - 1 == queueNumber) {
                        bot.send("キューには曲がありません。");
                    }
                } else {
                    if (content.slice(0, 32) == "https://www.youtube.com/watch?v=") {
                        queue[queue.length] = content;
                        bot.send("キューに追加されました。");
                        if (isPlaying == false) {
                            play();

                        }
                    } else {
                        bot.send("YouTubeのURLが読み込めませんでした。");
                        bot.send("「https://www.youtube.com/watch?v=～」の形にしてください。");
                    }
                }
            } catch (e) {
                bot.send(e + "");
            }



            break;

        case 'play':
            play();
            break;

        case "repeat":
            repeat();
            break;

        case "next":
        case "skip":
            next();
            break;

        case "back":
            back();
            break;

        case "clear":
            queue = [];
            queueNumber = 0;

            break;

        case 'join':
            try {
                if (msg.member.voice.channel) {
                    connection = msg.member.voice.channel.join();
                }
            } catch (e) {
                bot.send(e + "");
            }
            break;


        case 'g':
            //htmlからキーワードを取ってくる

            async function search_keyword(event) {

                //htmlからキーワードを取ってくる
                let keyword = content;
                if (!keyword) return;

                //非同期処理なので実行終了まで待つ
                let result = await customSearch.cse.list({

                    //APIキー
                    auth: "AIzaSyDQzOjDmz78mG2j5yuY-pgK2gfFE4OlbXU",

                    //カスタムエンジン名ID
                    cx: "054758dc6af7433c9",

                    //検索したいキーワード
                    q: keyword
                });

                //結果表示
                let answer = "";
                answer += "**検索結果：**\r";
                try {
                    for (let i = 0; i < 3; i++) {
                        answer += "　・" + result.data.items[i].title + " より\r　" + result.data.items[i].snippet + "\r\r";
                    }
                    bot.send(answer);
                } catch (e) {
                    bot.send("検索中にエラーが発生しました。\r検索結果がないなどが考えられます。");
                }

            }
            search_keyword();
            break;


        //スケジュール送信
        case 'schedule':
            if (content == "") {
                let now = new Date();
                bot.send(schedule((now.getDay() + 6) % 7));
            } else {
                bot.send(schedule((Number(content) + 6) % 7));
            }


            break;

        case "change":
            switch (content) {
                case "UNDERTALE":
                case "undertale":
                case "アンテ":
                case "アンダーテール":
                    serverMode = "UNDERTALE";
                    break;

                case "情シス":
                case "情報システムデザイン":
                case "JOSHISU":
                    serverMode = "JOSHISU";
                    break;

                case "個人":
                case "ファイのサーバー":
                case "ファイ":
                case "KOJIN":
                    serverMode = "KOJIN";
                    break;

                case "ドラクエ10":
                case "ドラクエ":
                case "ドラクエX":
                case "ドラゴンクエスト":
                case "ドラゴンクエスト10":
                case "ドラゴンクエストX":
                case "DQX":
                case "DQ":
                case "DQ10":
                case "dq":
                case "dqx":
                case "dq10":
                    serverMode = "DQX";
                    break;

                case "arrpegio":
                case "arupejio":
                case "ARUPEJIO":
                case "アルペジオ音ゲー":
                case "アルペジオ":
                case "arupejiootoge-":
                    serverMode = "ARUPEJIO";
                    break;

                case "asobitai":
                case "ASOBITAI":
                case "遊びたい":
                case "あそびたい":
                    serverMode = "ASOBITAI";
                    break;

                default:
                    serverMode = "JOSHISU";
                    break;
            }
            changeServerMode();
            bot.send("サーバーモードが「" + serverMode + "」に変更されました。");

            break;


        case 'leave':
            try {
                msg.member.voice.channel.leave();
            } catch (e) {
                bot.send(e + "");
            }
            break;

        default:
            bot.send("There's no such command.");
            break;
    }
}

function addCommand(commandName, commandContent, bot) {
    let content = fs.readFileSync("command.txt", 'utf-8');
    let mojiIchi = content.indexOf(':');
    let allCommand = content.substring(0, mojiIchi);
    let allContent = content.substr(mojiIchi + 1);

    allCommand += commandName + ",";
    allContent += commandContent + ",";

    fs.writeFile("command.txt", allCommand + ":" + allContent, function (err) {
        if (err) { throw err; }
        bot.send('Command Added.');
    });
}

function reloadCommand() {

}

let flagForAlerm = true;
let latestTime = "";
function toDoubleDigits(num) {
    num += "";
    if (num.length === 1) {
        num = "0" + num;
    }
    return num;
}
function format(date) {
    year = toDoubleDigits(date.getFullYear())
    month = toDoubleDigits(date.getMonth())
    day = toDoubleDigits(date.getDate())
    hour = toDoubleDigits(date.getHours())
    minute = toDoubleDigits(date.getMinutes())

    return year + "/" + month + "/" + day + " " + hour + ":" + minute
}
function timeCheck() {
    let now = new Date;
    now.setHours(now.getHours() + 9);
    now.setMonth(now.getMonth() + 1);

    if (latestTime != format(now)) {
        //1分経過
        latestTime = format(now);

        //リマインダー読み込み
        reminderArray = JSON.parse(fs.readFileSync('remind.json', 'utf8'));

        for (let i = reminderArray.length - 1; i >= 0; i--) {
            if (latestTime == reminderArray[i].time) {
                client.channels.cache.get(reminderArray[i].channelID).send("**リマインダー**：\r" + reminderArray[i].message);
                reminderArray.splice(i, 1);
            }
        }



        //10分ごとにログに出す
        if (latestTime.slice(14) == "0") {
            console.log(latestTime);
        }

        //朝９時設定もどす
        if (latestTime.slice(11) == "09:00") {
            console.log("設定を戻します。");
            serverMode = "JOSHISU";
            changeServerMode();


            queue = [];
            queueNumber = 0;
            sendDialyMessage(now.getDay());
            flagForAlerm = false;
        }

    }
}

let reminderArray = [];
function addReminder(time, message, channelID) {
    reminderArray[reminderArray.length] = {
        "time": time,
        "message": message,
        "channelID": channelID
    };
    console.log(reminderArray[reminderArray.length - 1]);

    const toJSON = JSON.stringify(reminderArray);
    fs.writeFile("remind.json", toJSON, (err) => {
        if (err) console.log(err);
    });
}

function sendDailyMessage(num) {
    //1が月
    mainTextChannel.send(schedule((num + 6) % 7));
    /*
    try{
      text = fs.readFileSync(txt, 'utf-8');
    }catch (error){
      mainTextChannel.send(error + "");
    }
    mainTextChannel.send(text);
    */

}


client.login("ODU5NTkzNzQ3NTczNzY4MjEy.YNu9Dw.es1gbwhi7kRZ7qdtfuvz3zLiT7g");


setInterval(timeCheck, 5000);


async function play() {
    if (queue.length <= queueNumber) {
        mainTextChannel.send("キューに曲がありません。");
    } else {
        const stream = ytdl(queue[queueNumber], { filter: "audioonly" });
        const con = await mainVoiceChannel.join();
        isPlaying = true;
        con.play(stream, { seek: 0, volume: 0.5 }).on("finish", () => {
            isPlaying = false;
            if (repeat == true) {
                play();
            } else {
                next();
            }
        });
    }
}

function back() {
    if (queueNumber == 0) {
        mainTextChannel.send("これ以上戻れません。");
    } else {
        queueNumber--;
    }
    play();
}

function schedule(day) {
    let jsonData;
    try {
        jsonData = fs.readFileSync("schedule.json", 'utf-8');
        jsonData = JSON.parse(jsonData);
    } catch (e) {
        return e + "";
    }

    if (day == 6) {
        return "今日は日曜日です。\r講義は休みです。";
    }
    let text = "今日は**";
    let dayText = "";
    switch (day) {
        case 0:
            text += "月";
            break;
        case 1:
            text += "火";
            break;
        case 2:
            text += "水";
            break;
        case 3:
            text += "木";
            break;
        case 4:
            text += "金";
            break;
        case 5:
            text += "土";
            break;
    }
    text += "曜日**です。\r";

    jsonData.Member.forEach(User => {
        text += User.Name + "：\r";
        User.Schedule[day].forEach(date => {
            text += date.Time + "時間目：" + date.Name + "（" + date.Teacher + " " + date.Place + "）\r";
        });
    });

    //text += "授業の時間割が見れるシステムを開発中ですお待ちください。";
    //console.log(text);
    return text;
}

function next() {
    if (queueNumber >= queue.length) {
        mainTextChannel.send("キューに曲がありません。");
    } else {
        queueNumber++;
        play();
    }
}

client.on("clickButton", async (button) => {
    await button.think(false);
    switch (button.id) {
        case "playButton":
            button.reply.delete();
            play();
            break;

        case "repeatButton":
            button.reply.delete();
            if (repeat == true) {
                mainTextChannel.send("リピートが無効になりました。");
                repeat = false;
            } else {
                mainTextChannel.send("リピートが有効になりました。");
                repeat = true;
            }
            break;

        case "nextButton":
            button.reply.delete();
            next();
            break;

        case "backButton":
            button.reply.delete();
            back();
            break;

        default:

            break;
    }
});
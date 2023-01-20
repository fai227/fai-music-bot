module.exports = {
    queue: [],
    PushTrack(guildId, guildName, channelId, voiceAdapterCreator, musicUrl, musicName) {
        this.queue.push({
            guildId: guildId,
            guildName: guildName,
            channelId: channelId,
            voiceAdapterCreator: voiceAdapterCreator,
            musicUrl: musicUrl,
            musicName: musicName,
        });
    },
    PriorityPushTrack(guildId, guildName, channelId, voiceAdapterCreator, musicUrl, musicName) {
        if (this.queue.length === 0) {
            this.PushTrack(guildId, guildName, channelId, voiceAdapterCreator, musicUrl, musicName);
            return;
        }
        this.queue.splice(1, 0, {
            guildId: guildId,
            guildName: guildName,
            channelId: channelId,
            voiceAdapterCreator: voiceAdapterCreator,
            musicUrl: musicUrl,
            musicName: musicName,
        });
    },
    repeatList: {},
    SetRepeat(guildId, flag) {
        this.repeatList[guildId] = flag;
        return flag;
    },
    GetRepeat(guildId) {
        if (!this.repeatList[guildId]) {
            this.repeatList[guildId] = false;
        }

        return this.repeatList[guildId];
    },
    GetNowTrack() {
        if (this.queue.length === 0) {
            return false;
        }
        return this.queue[0];
    },
    GetNextTrack() {
        if (this.queue.length <= 1) {
            return false;
        }
        return this.queue[1];
    },
    ShiftTrack() {
        return this.queue.shift();
    },
    ToString() {
        //キューが無いとき
        if (this.queue.length === 0) {
            return "現在、キューは空です。";
        }

        //キューが1つの時
        let result = "**再生中**";
        result += `\n├楽曲名：${this.queue[0].musicName}`;
        result += `\n└サーバー名：${this.queue[0].guildName}`;
        if (this.queue.length === 1) {
            return result;
        }

        //キューが２つ以上の時
        result += "\n\n**現在のキュー**\n";
        for (let i = 1; i < this.queue.length; i++) {
            if (i >= 5) {
                break;
            }

            result += `${i}番目\n├楽曲名：${this.queue[i].queue}\n└サーバー名：${this.queue[i].guildName}\n\n`;
        }

        if (this.queue.length >= 6) {
            result += `他 ${this.queue.length - 5}曲…`;
        }
        return result;
    }
};
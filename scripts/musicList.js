module.exports = {
    list: [],
    Push(guildId, guildName, channelId, voiceAdapterCreator, url) {
        this.list.push({
            guildId: guildId,
            guildName: guildName,
            channelId: channelId,
            voiceAdapterCreator: voiceAdapterCreator,
            url: url,
        });
    },
    PriorityPush(guildId, guildName, channelId, voiceAdapterCreator, url) {
        if (this.list.length === 0) {
            this.Push(guildId, guildName, channelId, voiceAdapterCreator, url);
            return;
        }
        this.list.splice(1, 0, {
            guildId: guildId,
            guildName: guildName,
            channelId: channelId,
            voiceAdapterCreator: voiceAdapterCreator,
            url: url,
        });
    },
    Now() {
        if (this.list.length === 0) {
            return false;
        }
        return this.list[0];
    },
    Next() {
        if (this.list.length <= 1) {
            return false;
        }
        return this.list[1];
    },
    Shift() {
        this.list.shift();
    },
    ToString() {
        if (this.list.length === 0) {
            return "現在、キューは空です。";
        }

        let result = "**現在のキュー**\n";

        let previousServerName = "";

        for (let i = 0; i < this.list.length; i++) {
            result += `${i + 1}番目, URL:${this.list[i].url}`;
            if (previousServerName == this.list[i].guildName) {
                previousServerName == this.list[i].guildName;
                result += `  サーバー名：${this.list[i].guildName}`;
            }
            result += "\n";
        }

        return result;
    }
};
module.exports = {
    list: [],
    push(id, name, url) {
        this.list.push({ id: id, name: name, url: url });
    },
    next() {
        if (this.list.length === 0) {
            return false;
        }
        return this.list[0];
    },
    delete() {
        this.list.shift();
    },
    toString() {
        if (this.list.length === 0) {
            return "現在、キューは空です。";
        }

        let result = "**現在のキュー**\n";

        let previousServerName = "";

        for (let i = 0; i < this.list.length; i++) {
            result += `${i + 1}番目, URL:${this.list[i].url}`;
            if (previousServerName == this.list[i].name) {
                previousServerName == this.list[i].name;
                result += `  サーバー名：${this.list[i].name}`;
            }
            result += "\n";
        }

        return result;
    }
};
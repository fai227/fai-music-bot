module.exports = {
    list: [],
    push(id, name, url) {
        this.list.push({ id: id, name: name, url: url });
    },
    toString() {
        let result = "現在のキュー\n";

        this.list.forEach(item => {
            result += ``;
        });

        return result;
    }
};
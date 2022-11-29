module.exports = function () {
    const express = require("express");
    const app = express();
    const port = process.env.PORT || 8080;
    app.get("/", (req, res) => {
        res.send("I am alive.");
    });
    app.listen(port, () => {
        console.log(`Port Listening: ${port}`);
    });
}
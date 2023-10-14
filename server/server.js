const express = require("express");
const app = express();
const PORT = 8080;


app.get("/api/test", (req, res) => {
    res.json({ message: "Success" });
});


app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
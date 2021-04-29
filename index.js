const { response } = require("express");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Notice = require("./src/routes/notice");
require("./src/database/mongoose");
const noticeRouter = require("./src/routes/notice");
const userRouter = require("./src/routes/users");

const app = express();
const port = process.env.PORT;
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json());
app.use(noticeRouter);
app.use(userRouter);

app.listen(3000, () => {
  console.log("Server has started in port 3000");
});

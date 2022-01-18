const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
// const authRouter = require("./routes/auth.routes");
const authRouter = require("./routes/auth.routes");
const app = express(); // из экспресса создадим сам сервер
const PORT = config.get("serverPort"); // с помощью ф-и get у конфига по ключу получаем значение порта
const corsMiddleware = require("./routes/cors.middleware");
// const UsersOrders = require("./models/UsersOrders");
const morgan = require("morgan");

app.use(corsMiddleware);
// app.use(express.json());
// app.use(
//   express.json({
//     limit: "100kb",
//     type: ["application/json", "text/plain"],
//   })
// );
app.use(
  express.json({
    limit: "100kb",
    type: ["application/json", "text/plain"],
  })
);
app.use(morgan("dev"))

app.use("/api/auth", authRouter);
app.get("/users", getUsers);

async function getUsers(req, res) {
  try {
    const users = await UsersOrders.findOne({
      UserEmail: "danigirland@yahoo.com",
    });
    console.log(users);
    res.send({ users });
  } catch {}
}

async function start() {
  try {
    await mongoose.connect(config.get("dbUrl"));

    app.listen(PORT, () => {
      console.log("Server started on port :", PORT);
    });
  } catch (e) {
    console.log(e);
  }
}
start();

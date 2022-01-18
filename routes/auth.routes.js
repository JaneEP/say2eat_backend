const Router = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const config = require("config");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const router = new Router();
const UsersOrders = require("../models/UsersOrders");
const moment = require("moment");

router.post(
  "/registration",
  [
    check("email", "Поле email должно быть корректно заполнено  ").isEmail(),
    check("password", "Полe password должно быть корректно заполнено").isLength(
      {
        min: 3,
        max: 12,
      }
    ),
  ],
  async (req, res) => {
    try {
      // console.log(req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Произошла ошибка : Поля не должны быть пустые" });
      }

      const { email, password, passwordRepiet, name } = req.body;

      const candidate = await User.findOne({ email });

      if (candidate) {
        return res
          .status(400)
          .json({ message: `Пользователь с email:  ${email} уже существует` });
      }

      const hashPassword = await bcrypt.hash(password, 8); // степень хеширования пароля
      const user = new User({
        email,
        password: hashPassword,
      });
      await user.save();
      return res.json({ message: "User was created" });
    } catch (e) {
      console.log(e);
      res.send({ message: "Server error" });
    }
  }
);

router.post("/login", async (req, res) => {
  try {
    // console.log(req.body);
    const { email, password } = req.body;
    // console.log(email, password);
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPassValid = bcrypt.compareSync(password, user.password); //сравниваем пароль, полученный в запросе с тем,что хранится в бд; ф-я compareSync  сравгивает зашифр пароль с незашифр
    if (!isPassValid) {
      // если пароли совпадают, ф-я compareSync вернет true
      return res.status(400).json({ message: "Invalid password" }); // если пароли не совпадают, отправляем ошибку
    }
    const token = jwt.sign({ id: user.id }, config.get("secretKey"), {
      expiresIn: "12h",
    });
    return res.json({
      token,
      user,
    });
  } catch (e) {
    // console.log(e);
    res.send({ message: "Server error" });
  }
});

router.post("/aggregate", async (req, res) => {
  try {
    // Даты из запроса:
    // const startDate = new Date("2021-03-10T14:30:04.702+00:00");
    // const endDate = new Date("2021-03-30T14:30:04.702+00:00");

    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    // console.log("startDate:", req.body.startDate);
    // console.log("endDate:", req.body.endDate);

    // const startDate = new Date(
    //   "Wed Mar 10 2021 00:00:00 GMT+0200 (Eastern European Standard Time)"
    // );
    // const endDate = new Date(
    //   "Tue Mar 30 2021 00:00:00 GMT+0300 (Eastern European Summer Time)"
    // );
    // -------------------------------

    // Выборка в таблицу:
    const tableData = await UsersOrders.aggregate([
      {
        $match: {
          EndTime: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },

      { $unwind: "$CartObject.OrderItems" },

      {
        $group: {
          _id: "$CartObject.OrderItems.Name",
          orderPOS_ID: { $first: "$orderPOS_ID" },
          img: { $first: "$CartObject.OrderItems.PictureURL" },
          totalOrders: { $sum: "$CartObject.OrderItems.Quantity" },
          totalSales: {
            $push: {
              price: "$CartObject.OrderItems.PricePerUnit",
              quantity: "$CartObject.OrderItems.Quantity",
            },
          },
        },
      },

      { $sort: { totalOrders: -1 } },
    ]);
    // console.log(tableData);
    // -------------------------------

    // Подсчёт общего колличества заказов:
    const totalOrders = await UsersOrders.find({
      EndTime: {
        $gte: startDate,
        $lte: endDate,
      },
    }).count();
    console.log("общее кол-во заказов:", totalOrders);

    // console.log("message:1");

    // -------------------------------

    // Выбока для построения графика:

    // Функция, для получения массива всех дней по очереди:
    function getDates(startDate, stopDate) {
      var dateArray = [];
      var currentDate = moment(startDate);
      var stopDate = moment(stopDate);
      while (currentDate <= stopDate) {
        dateArray.push(moment(currentDate).format("MMM Do YY"));
        currentDate = moment(currentDate).add(1, "days");
      }
      return dateArray;
    }
    const arrayOfDays = getDates(startDate, endDate);
    console.log(arrayOfDays);

    // Выборка всех документов за указанные даты:
    const chartDocs = await UsersOrders.aggregate([
      {
        $match: {
          EndTime: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
    ]);

    // console.log(chartDocs);
    // Собираем все даты заказов в массив:
    const chartArr = new Array();

    for (const doc of chartDocs) {
      chartArr.push(moment(doc.EndTime).format("MMM Do YY"));
    }
    console.log("chartArr is: ", chartArr);

    // Собираем объект для графика:
    const chartObject = new Object();

    for (const element of arrayOfDays) {
      chartObject[element] = chartArr.filter((item) => item === element).length;
    }
    // -------------------------------

    // Выборка уникальных клиентов за указанный промежуток:
    const totalCustomers = await UsersOrders.aggregate([
      {
        $match: {
          EndTime: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },

      {
        $group: {
          _id: "null",
          UserEmail: {
            $addToSet: "$UserEmail",
          },
          UserName: {
            $addToSet: "$UserName",
          },
        },
      },
    ]);

    const customersLength = totalCustomers[0]["UserEmail"].length;
    console.log("totalCustomers:", totalCustomers);
    console.log("customersLength is : ", customersLength);
    const userName = totalCustomers[0]["UserName"];
    // const itemName = tableData[0]["$CartObject.OrderItems.Name"];
    // console.log(customersLength);

    // -------------------------------

    res.status(200).json({
      status: "success",
      data: {
        totalOrders,
        customersLength,
        tableData,
        chartObject,
      },
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;

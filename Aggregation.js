// // function ordersCount (req, res, next) {

// // const startDate = new Date("2021-03-11T14:30:04.702+00:00")
// // const endDate = new Date("2021-04-11T14:30:04.702+00:00")


// // const rank = await UsersOrders.aggregate([
// //   {
// //     $match: {
// //       EndTime: {
// //         $gte: startDate,
// //         $lte: endDate,
// //       },
// //     },
// //   },

// //   { $unwind: "$CartObject.OrderItems" },

// //   {
// //     $group: {
// //       _id: "$CartObject.OrderItems.Name",
// //       img: { $first: "$CartObject.OrderItems.PictureURL" },
// //       totalOrders: { $sum: "$CartObject.OrderItems.Quantity" },
// //       totalSales: {
// //         $push: {
// //           price: "$CartObject.OrderItems.PricePerUnit",
// //           quantity: "$CartObject.OrderItems.Quantity",
// //         },
// //       },
// //     },
// //   },

// //   { $sort: { totalOrders: -1 } },
// // ]);

// // const totalOrders = await UsersOrders.find({
// //         EndTime: {
// //           $gte: startDate,
// //           $lte: endDate,
// //         },
// //       }).count()

// // const totalCustomers = await UsersOrders.aggregate([
// //     {
// //         $match: {
// //             EndTime: {
// //               $gte: startDate,
// //               $lte: endDate,
// //             },
// // },

// //     $group: {
// //         _id: "null",
// //         UserEmail : {
// //             $addToSet: '$UserEmail'
// //         }}
// //     }]);

// //     const customersLength = totalCustomers.length()

// // }


// // {
// //     _id: null,
// //     UserEmail : {
// //      $addToSet: '$UserEmail'
// //     }
// //   }



// exports.ordersAnalytics = async (req, res, next) => {
//   try {
//     // Даты из запроса:
//     const startDate = new Date("2021-03-10T14:30:04.702+00:00");
//     const endDate = new Date("2021-03-30T14:30:04.702+00:00");
//     // -------------------------------

//     // Выборка в таблицу:
//     const tableData = await Orders.aggregate([
//       {
//         $match: {
//           EndTime: {
//             $gte: startDate,
//             $lte: endDate,
//           },
//         },
//       },

//       { $unwind: "$CartObject.OrderItems" },

//       {
//         $group: {
//           _id: "$CartObject.OrderItems.Name",
//           img: { $first: "$CartObject.OrderItems.PictureURL" },
//           totalOrders: { $sum: "$CartObject.OrderItems.Quantity" },
//           totalSales: {
//             $push: {
//               price: "$CartObject.OrderItems.PricePerUnit",
//               quantity: "$CartObject.OrderItems.Quantity",
//             },
//           },
//         },
//       },

//       { $sort: { totalOrders: -1 } },
//     ]);
//     // -------------------------------

//     // Подсчёт общего колличества заказов:
//     const totalOrders = await Orders.find({
//       EndTime: {
//         $gte: startDate,
//         $lte: endDate,
//       },
//     }).countDocuments();
//     // -------------------------------

//     // Выбока для построения графика:

//     // Функция, для получения массива всех дней по очереди:
//     function getDates(startDate, stopDate) {
//       var dateArray = [];
//       var currentDate = moment(startDate);
//       var stopDate = moment(stopDate);
//       while (currentDate <= stopDate) {
//         dateArray.push(moment(currentDate).format("MMM Do YY"));
//         currentDate = moment(currentDate).add(1, "days");
//       }
//       return dateArray;
//     }
//     const arrayOfDays = getDates(startDate, endDate);

//     // Выборка всех документов за указанные даты:
//     const chartDocs = await Orders.aggregate([
//       {
//         $match: {
//           EndTime: {
//             $gte: startDate,
//             $lte: endDate,
//           },
//         },
//       },
//     ]);

//     // Собираем все даты заказов в массив:
//     const chartArr = new Array();

//     for (const doc of chartDocs) {
//       chartArr.push(moment(doc.EndTime).format("MMM Do YY"));
//     }

//     // Собираем объект для графика:
//     const chartObject = new Object();

//     for (const element of arrayOfDays) {
//       chartObject[element] = chartArr.filter((item) => item === element).length;
//     }
//     // -------------------------------

//     // Выборка уникальных клиентов за указанный промежуток:
//     const totalCustomers = await Orders.aggregate([
//       {
//         $match: {
//           EndTime: {
//             $gte: startDate,
//             $lte: endDate,
//           },
//         },
//       },

//       {
//         $group: {
//           _id: "null",
//           UserEmail: {
//             $addToSet: "$UserEmail",
//           },
//         },
//       },
//     ]);

//     const customersLength = totalCustomers[0]["UserEmail"].length;
//     // -------------------------------

//     res.status(200).json({
//       status: "success",
//       data: {
//         totalOrders,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };
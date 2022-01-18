const mongoose = require("mongoose");

const UserOrdersSchema = new mongoose.Schema({
  UserName: String,
  fake: Boolean,
  EndTime: Date,
  UserEmail: String,
});

const UsersOrders = mongoose.model(
  "UsersOrders",
  UserOrdersSchema,
  "UsersOrders"
);
module.exports = UsersOrders;

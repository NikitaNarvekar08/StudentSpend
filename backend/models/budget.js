
const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    pocketMoney: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Budget", budgetSchema);

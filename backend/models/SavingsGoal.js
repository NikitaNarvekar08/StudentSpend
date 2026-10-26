
const mongoose = require("mongoose");

const savingsGoalSchema = new mongoose.Schema(
  {
    goalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    savedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

savingsGoalSchema.pre("validate", function () {
  if (this.savedAmount > this.targetAmount) {
    this.invalidate(
      "savedAmount",
      "Saved amount cannot exceed target amount"
    );
  }
});

module.exports = mongoose.model("SavingsGoal", savingsGoalSchema);

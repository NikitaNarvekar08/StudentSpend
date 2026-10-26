
const express = require("express");
const mongoose = require("mongoose");
const SavingsGoal = require("../models/SavingsGoal");

const router = express.Router();

// Get all savings goals
router.get("/", async (req, res) => {
  try {
    const goals = await SavingsGoal.find().sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch goals" });
  }
});

// Create a savings goal
router.post("/", async (req, res) => {
  try {
    const { goalName, targetAmount, savedAmount = 0, deadline } = req.body;
    const target = Number(targetAmount);
    const saved = Number(savedAmount);

    if (typeof goalName !== "string" || !goalName.trim()) {
      return res.status(400).json({ message: "Goal name is required" });
    }

    if (
      targetAmount === "" ||
      targetAmount === null ||
      targetAmount === undefined ||
      !Number.isFinite(target) ||
      target <= 0
    ) {
      return res.status(400).json({
        message: "Target amount must be greater than zero",
      });
    }

    if (
      savedAmount === "" ||
      savedAmount === null ||
      !Number.isFinite(saved) ||
      saved < 0 ||
      saved > target
    ) {
      return res.status(400).json({
        message: "Saved amount must be between zero and the target",
      });
    }

    if (
      deadline &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
        Number.isNaN(Date.parse(deadline)))
    ) {
      return res.status(400).json({ message: "Invalid deadline" });
    }

    const goal = await SavingsGoal.create({
      goalName: goalName.trim(),
      targetAmount: target,
      savedAmount: saved,
      deadline: deadline || null,
    });

    res.status(201).json(goal);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create goal" });
  }
});

// Update saved amount
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const saved = req.body.savedAmount;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid goal ID" });
    }

    if (
      saved === "" ||
      saved === null ||
      saved === undefined ||
      !Number.isFinite(Number(saved)) ||
      Number(saved) < 0
    ) {
      return res.status(400).json({ message: "Invalid saved amount" });
    }

    const goal = await SavingsGoal.findById(id);

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    if (Number(saved) > goal.targetAmount) {
      return res.status(400).json({
        message: "Saved amount cannot exceed target amount",
      });
    }

    goal.savedAmount = Number(saved);
    await goal.save();

    res.json(goal);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update goal" });
  }
});

// Delete a savings goal
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid goal ID" });
    }

    const goal = await SavingsGoal.findByIdAndDelete(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json({ message: "Savings goal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete goal" });
  }
});

module.exports = router;

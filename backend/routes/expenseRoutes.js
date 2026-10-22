
const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

// GET: Fetch all expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Add a new expense
router.post("/", async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Expense title is required." });
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero." });
    }

    const allowedCategories = [
      "Food",
      "Travel",
      "Education",
      "Shopping",
      "Entertainment",
      "Other",
    ];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: "Please select a valid category." });
    }

    const expense = await Expense.create({
      title: title.trim(),
      amount: parsedAmount,
      category,
      date: date || new Date(),
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE: Remove an expense
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    res.json({ message: "Expense deleted successfully." });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid expense ID." });
    }

    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

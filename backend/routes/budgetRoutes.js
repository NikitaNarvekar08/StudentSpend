
const express = require("express");
const router = express.Router();
const Budget = require("../models/budget");

// Get the current budget
router.get("/", async (req, res) => {
  try {
    let budget = await Budget.findOne();

    if (!budget) {
      budget = await Budget.create({ pocketMoney: 0 });
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update the budget
router.put("/", async (req, res) => {
  try {
    const pocketMoney = Number(req.body.pocketMoney);

    if (!Number.isFinite(pocketMoney) || pocketMoney < 0) {
      return res.status(400).json({
        message: "Pocket money must be a valid non-negative number."
      });
    }

    let budget = await Budget.findOne();

    if (budget) {
      budget.pocketMoney = pocketMoney;
      await budget.save();
    } else {
      budget = await Budget.create({ pocketMoney });
    }

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

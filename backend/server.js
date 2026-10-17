const budgetRoutes = require("./routes/budgetRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/budget", budgetRoutes);

app.get("/", (req, res) => {
  res.send("StudentSpend Backend is running!");
});


app.get("/api/test-db", async (req, res) => {
  try {
    const result = await mongoose.connection.db
      .collection("connectiontests")
      .insertOne({
        message: "StudentSpend database test successful",
        createdAt: new Date()
      });

    res.json({
      success: true,
      message: "Data saved to MongoDB!",
      id: result.insertedId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB connected ✅");
  } catch (err) {
    console.error("MongoDB error ❌", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

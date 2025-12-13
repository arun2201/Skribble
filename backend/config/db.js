const mongoose = require("mongoose");

const options = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4, // Force IPv4, skip IPv6
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, options);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

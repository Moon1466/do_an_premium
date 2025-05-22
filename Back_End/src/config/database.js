const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const dbState = [
  { value: 0, label: "disconnected" },
  { value: 1, label: "connected" },
  { value: 2, label: "connecting" },
  { value: 3, label: "disconnecting" }
];



const connection = async () => {  
  try {
    await mongoose.connect(process.env.DB_HOST);
    const state = Number(mongoose.connection.readyState);
  } catch (error) {
    console.error("Database connection error:", error);
  }
};

module.exports = connection;
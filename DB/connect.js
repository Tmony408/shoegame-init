// const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const uri = process.env.MONGO_URI;
const connect = async (mongoose) => {
  mongoose
    .connect(uri)
    .then(() => {
      console.log("Connected to the MongoDB server");
    })
    .catch((err) => console.error("Error connecting to MongoDB:", err));
};

module.exports = connect;

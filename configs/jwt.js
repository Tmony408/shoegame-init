const jwt = require('jsonwebtoken');
const dotenv = require("dotenv").config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "2h" });
};

const generateEmailVerificationToken = (email, password) => {
  return jwt.sign({ email, password }, process.env.JWT_SECRET, { expiresIn: 10*60*1000 });
};

module.exports= {
    generateToken,
    generateEmailVerificationToken
}
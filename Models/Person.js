const mongoose = require('mongoose');
const bcrypt = require("bcrypt")
const PersonSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Hash password before saving the user
PersonSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    const saltRounds = 8;
    const salt = await bcrypt.genSalt(saltRounds);
    user.password = await bcrypt.hash(user.password, salt);
  }
  next();
});

// Compare plain password with hashed password
PersonSchema.methods.comparePassword = async function (password) {
  const isMatch = await bcrypt.compare(password, this.password);
  return isMatch;
};

const Person= mongoose.model('Person', PersonSchema);


module.exports = Person;
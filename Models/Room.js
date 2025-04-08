const mongoose = require('mongoose');
const bcrypt = require("bcrypt")

const RoomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Person"
    },
    // players: [{
    //     _id: false,
    //     person: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "Person"
    //     }
    //     ,
    //     role: {
    //         type: String,
    //         enum: ["player", "spectator"]
    //     },
    //     color: String
    // }],
    persons:[
        { 
            person: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Person"
            }
            ,
            role: {
                type: String,
                enum: ["player", "spectator"]
            },
            color: String
        }
    ],
    messages: [{
        user: String, message: String, timestamp: {
            type: Date,
            default: Date.now()
        }
    }],
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
        }
    ],
    responses: [{ player: {
         type: mongoose.Schema.Types.ObjectId,
            ref: "Person"
    }, 
    question: {
        type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
    },
    questionIndex: Number,
     chosenShoe: String }] 

});
// Hash password before saving the user
RoomSchema.pre('save', async function (next) {
    const room = this;
    if (room.isModified('password')) {
        const saltRounds = 4;
        const salt = await bcrypt.genSalt(saltRounds);
        room.password = await bcrypt.hash(room.password, salt);
    }
    next();
});

// Compare plain password with hashed password
RoomSchema.methods.comparePassword = async function (password) {
    const isMatch = await bcrypt.compare(password, this.password);
    return isMatch;
};
const Room = mongoose.model('Room', RoomSchema);
module.exports = Room; 
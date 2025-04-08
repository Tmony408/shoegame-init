const Room = require("../Models/Room")


const getRoom = async (playerId) => {
    const rooms = await Room.find({ "persons.person": playerId });
    if (rooms.length > 0) {
        return rooms[0].roomId;  // Assuming the player is in only one room
    }
    return null;
}

module.exports = {
    getRoom
};
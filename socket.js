const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Room = require('./Models/Room');
const Person = require("./Models/Person")
const { generateUniqueID } = require("./configs/utils");
const Question = require('./Models/Question');
const mongoose = require("mongoose")


const rooms = {}; // In-memory store of active rooms

module.exports = (server) => {
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    // **Socket Authentication Middleware**
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("Authentication required"));

        jwt.verify(token, process.env.JWT_SECRET, (err, person) => {
            if (err) return next(new Error("Invalid token"));
            socket.person = person;
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log(`Person connected: ${socket.person.username} (${socket.id})`);
        // **CREATE ROOM**
        socket.on('createRoom', async ({ color, password }) => {
            const roomId = uuidv4();
            const questions = await Question.aggregate([{ $sample: { size: 10 } }]);
            const person = await Person.findById(socket.person.id)
            console.log(person, color)
            const newRoom = await Room.create({
                roomId,
                password: password,
                messages: [{ user: socket.person.username, message: "Welcome you all to this game" }],
                questions: questions.map(q => q._id),
                responses: [],
                players: [person],
                persons: [{ person: person._id, role: "player", color }]
            });
            // newRoom.players.push({ person: person._id, role: "player", color })
            await newRoom.save();
            console.log(newRoom)
            rooms[roomId] = { players: [socket.person], spectators: [], messages: [newRoom.messages[0]], color, questions };
            socket.join(roomId);
            socket.emit('roomCreated', { roomId, password });
        });

        // **JOIN ROOM**
        socket.on('joinRoom', async ({ roomId, password, shoeColor }) => {
            const room = await Room.findOne({ roomId }).populate('persons.person');

            if (!room) {
                socket.emit('error', { message: 'Room not found!' });
                return;
            }

            if (!room.comparePassword(password)) {
                socket.emit('error', { message: 'Incorrect password!' });
                return;
            }
            let players = room.persons.filter(p => p.role === "player")
            if (players.length < 2) {
                room.persons.push({ person: socket.person.id, role: "player", color: shoeColor });
                rooms[roomId].players.push(socket.person);

            } else {
                room.persons.push({ person: socket.person.id, role: "spectator", color: shoeColor });
                // rooms[roomId].spectators.push(socket.person);
            }

            await room.save();

            players = room.persons.filter(p => p.role === "player")
            const spectators = room.persons.filter(p => p.role === "spectator")
            console.log(players)
            socket.join(roomId);
            console.log(rooms)
            console.log(socket.person.username + " Joined the room")
            socket.emit("userJoined", { message: "user Joined" })
            io.to(roomId).emit('updateRoom', { players: players, spectators: spectators });
        });

        // **START GAME - SERVER SENDS 5 RANDOM QUESTIONS**
        socket.on('startGame', async ({ roomId }) => {
            const room = await Room.findOne({ roomId }).populate('questions');

            if (!room) return;
            const questions = room.questions.map(async (q) => {
                return await Question.findById(q)
            })
            io.to(roomId).emit('gameStarted', { questions });
        });

        // **PLAYER ANSWERS A QUESTION**
        socket.on('answerQuestion', async ({ roomId, questionIndex, chosenShoe }) => {
            const room = await Room.findOne({ roomId });
            if (!room) return;

            const response = { username: socket.person.username, questionIndex, chosenShoe };
            room.responses.push(response);
            await room.save();

            io.to(roomId).emit('newAnswer', response);
        });


        socket.on('reconnectToRoom', async ({ roomId }) => {
            const room = await Room.findOne({ roomId });

            if (!room) {
                socket.emit('error', { message: 'Room not found!' });
                return;
            }

            if (room.players.find(p => p.id === socket.person.id)) {
                rooms[roomId].players.push(socket.person);
            } else {
                rooms[roomId].spectators.push(socket.person);
            }

            socket.join(roomId);
            io.to(roomId).emit('updateRoom', { players: room.players, spectators: rooms[roomId].spectators });
        });



        socket.on('status', async ({ roomId }) => {
            try {
                console.log("dammy askking for room")
                const room = await Room.findOne({ roomId });

                if (!room) {
                    socket.emit('error', { message: 'Room not found!' });
                    return;
                }
                console.log("i am responding to dammy", room)
                const answer = socket.rooms.has(roomId)
                if (answer) {
                    console.log("is he in the room", answer)
                    io.to(roomId).emit('currentstatus', { message: "I love dammy, from moyin in the room" });
                } else {
                    console.log("is he in the room", answer)
                    io.emit('currentstatus', { message: "I love dammy, from moyin, outside the room" });
                }
                // socket.join(roomId);
                // Emit room object directly (no need for JSON.stringify)

            } catch (error) {
                console.error('Error fetching room:', error);
                io.to(roomId).emit('error', { message: 'An error occurred while fetching room data.' });
            }
        });

        // **DISCONNECT & RECONNECT**
        socket.on('disconnect', async () => {
            console.log(`${socket.person.username} disconnected`);

            for (const roomId in rooms) {
                rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.person.id);
                rooms[roomId].spectators = rooms[roomId].spectators.filter(s => s.id !== socket.person.id);
                await Room.updateOne({ roomId }, { players: rooms[roomId].players });

                io.to(roomId).emit('updateRoom', rooms[roomId]);
            }
        });
    });

    return io;
};

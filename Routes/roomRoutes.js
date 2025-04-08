const express = require("express");
const router = express.Router();

const { verifyRoom } = require("../Controller/room")

// const {
//     validate,
//     validateParams,
//     idParameterRules,
//     validateOrder

// } = require("../Middlewares/validateOrder");


const { authMiddleware, isAdmin } = require("../Middlewares/authMiddleware")


// Route for creating order
router.post("/verif", authMiddleware, verifyRoom);






module.exports = router;
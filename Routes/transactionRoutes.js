const express = require("express");
const router = express.Router();

const {
  initiateTransaction,
  verifyTransaction,
  webhookHandler
} = require("../Controller/transaction")

// const {
//     validate,
//     validateParams,
//     idParameterRules,
//     validateOrder

// } = require("../Middlewares/validateOrder");


const { authMiddleware, isAdmin } = require("../Middlewares/authMiddleware")


// Route for creating order
router.post("/initialize", initiateTransaction);
router.get("/verify",  verifyTransaction);
router.post('/webhook', webhookHandler);






module.exports = router;
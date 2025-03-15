const express = require("express");
const router = express.Router();
const {authMiddleware, isAdmin} = require("../Middlewares/authMiddleware")

const {
    signUp,
    userLogin,
    
} = require("../Controller/person")

router.post("/createuser", signUp);
router.post("/signin", userLogin);
module.exports = router;
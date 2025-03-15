const Person = require("../Models/Person")
const asyncHandler = require("express-async-handler")
const jwt = require('jsonwebtoken');


const signUp = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
  

    try {
        if (await Person.findOne({ username })) {
            return res.status(400).json({ success: false, error: 'Username already exists' });
        }

        const newPerson = new Person({ username, password});
        await newPerson.save();
        res.status(201).json({success: true, message: 'Person created successfully' });
        

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }



})
               
const userLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    try {
        const person = await Person.findOne({ username });
        if (!person) {
            return res
                .status(404)
                .json({ success: false, error: "User not found" });
        }

       
        // Check if passwords match
        const isPasswordMatch = await person.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                error:
                    "The username or password provided is incorrect. Please try again."
            });
        }

        // Generate refresh token 
        const token = jwt.sign({ id: person._id, username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        // Send response with cookies and tokens
        res
            .cookie("refreshToken", token, {
                httpOnly: true,
                maxAge: 2 * 60 * 60 * 1000 // 2 hours
            })
            .json({
                success: true,
                message: "Login successful",
                data: {
                    _id: person._id,
                    email: password.username,
                    token,
                }
            });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});




module.exports = {
    signUp,
    userLogin,

}
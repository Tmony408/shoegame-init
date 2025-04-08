const Person = require("../Models/Person")
const Room = require("../Models/Room")
const asyncHandler = require("express-async-handler")
const newSendMail = require("../configs/nodemailer");
const { generateUniqueID } = require("../configs/utils")

const initiateTransaction = asyncHandler(async (req, res) => {
    try {
        const { user_id } = req.body;

        // Find the user by ID
        const user = await User.findById(user_id);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        if (user.paid)
            return res
                .status(400)
                .json({ success: false, message: "Account has been created, payment has been made" });


        const parties = await PoliticalParty.find({}, "isFilled total members");
        if (parties.every(party => party.isFilled))
            return res
                .status(400)
                .json({ success: false, message: "Event is filled, try again next year" });


        // Generate a unique reference for the transaction
        const ref = generateUniqueID(10, user_id, "TRANS")

        // Create a new transaction in the database
        const transaction = new Transaction({
            user: user._id,
            amount: user.category.amount,
            currency: "NGN",
            ref,
        });
        await transaction.save();

        // Link the transaction to the user
        user.Transactions.push(transaction._id);
        await user.save();

        // Payload for Flutterwave API
        const payload = {
            tx_ref: ref,
            amount: transaction.amount,
            currency: transaction.currency,
            redirect_url: process.env.FLW_REDIRECTLINK,
            payment_options: 'card,banktransfer',
            customer: {
                email: user.email,
                phonenumber: user.phoneNumber,
                name: user.fullName,
            },
            customizations: {
                title: 'Model National Assembly',
            },
        };

        // Call Flutterwave API
        const flutterwaveResponse = await axios.post(
            'https://api.flutterwave.com/v3/payments',
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, // Your secret key
                    'Content-Type': 'application/json',
                },
            }
        );

        // Check API response
        const responseData = flutterwaveResponse.data;

        if (responseData.status === 'success') {
            return res.status(200).json({
                status: true,
                paymentLink: responseData.data.link,
            });
        } else {
            // Update transaction status to failed
            transaction.status = "failed";
            await transaction.save();

            return res.status(400).json({
                status: false,
                message: responseData.message,
            });
        }
    } catch (error) {
        console.log(error);

        // Handle unexpected errors
        if (error.response) {
            console.log(error.response.data);
        }

        return res.status(500).json({
            status: false,
            message: 'An error occurred while initiating the transaction.',
        });
    }
});

const verifyRoom = asyncHandler(async(req, res)=>{
    const {roomId, password} = req.body;
    const room = await Room.findOne({ roomId });
        try {
             if (!room) {
               return res.status(404).json({error:"Ivalid credentials", message:"room Id or password incorrect"}) 
            }
            console.log(password)
            if (!await room.comparePassword(password)) {
                return res.status(404).json({error:"Ivalid credentials", message:"room Id or password incorrect"})
            }
           res.status(200).json({status: true, message:"Room authenticated successfully"})
        } catch (error) {
            console.log(error)
            res.status(500).json({error: "server error", message: "Internal Server error"})
        }
    
           

})




module.exports = {
    verifyRoom
}
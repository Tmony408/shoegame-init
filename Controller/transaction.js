const User = require("../Models/Person")
const PoliticalParty = require("../Models/PoliticalParty")
const Committee = require("../Models/Room")
const Transaction = require("../Models/Transaction")
const asyncHandler = require("express-async-handler")
const newSendMail = require("../configs/nodemailer");
const flw = require("../configs/flw")
const axios = require('axios');
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

// const initiateTransaction = asyncHandler(async (req, res) => {
//     try {
//         const { user_id } = req.body;

//         const user = await User.findById(user_id);
//         if (!user) {
//             return res
//                 .status(404)
//                 .json({ success: false, message: "User not found" });
//         }

//     const ref = generateUniqueID(10,user_id,"TRANS")        
//         // Create a new transaction in the database
//         const transaction = new Transaction({
//             user: user._id,
//             amount: user.category.amount,
//             currency: "NGN",
//             ref
//         });
//         await transaction.save();
//         user.Transactions.push(transaction._id);
//         await user.save();

//         // Payload for Flutterwave
//         const payload = {
//             tx_ref: transaction._id,
//             amount: transaction.amount,
//             currency:transaction.currency,
//             redirect_url: 'http://localhost:3000/api/verify',
//             payment_options: 'card,banktransfer',
//             customer: {
//                 email:user.email,
//                 phonenumber: user.phoneNumber,
//                 name: user.fullName,
//             },
//             customizations: {
//                 title: 'Model National Assembly',
//                 description: 'Payment for services',
//                 // logo: 'https://example.com/logo.png',
//             },
//         };

//         const response = await flw.PaymentInitiate(payload);
//         console.log("good")

//         if (response.status === 'success') {
//             return res.status(200).json({status: true,  paymentLink: response.data.link});
//         } else {
//             transaction.status = "failed"
//             await transaction.save();
//             return res.status(400).json({ status:false, message: response.message });
//         }
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ status: false, message: 'An error occurred while initiating the transaction.' });
//     }
// })

const verifyTransaction = asyncHandler(async (req, res) => {
    try {
        const transactionId = req.query.transaction_id;

        const response = await axios.get(
            `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
                },
            }
        );

        if (response.data.status === 'success') {
            const tx_ref = response.data.data.tx_ref;

            // Update the transaction in the database
            const transaction = await Transaction.findOneAndUpdate(
                { ref: tx_ref },
                {
                    flw_id: transactionId,
                    status: response.data.data.status, // 'successful' or 'failed'
                },
                { new: true }
            );

            if (!transaction) {
                // return res.status(404).json({
                //     status: false,
                //     message: 'Transaction not found.',
                // });

                return res.redirect("https://mna-lmu.netlify.app/dashboard");

            }

            // Update user details and mark as paid
            const user = await User.findById(transaction.user);
            if (!user) {
                // return res.status(404).json({
                //     success: false,
                //     message: "User not found",
                // });
                return res.redirect("https://mna-lmu.netlify.app/dashboard");

            }

            // user.regNo = generateUniqueID(8, user._id, user.category.name.slice(0, 5));
            // user.paid = true;



            // // Get the list of already assigned committees
            // if (!user.committee) {
            //     const assignedCommittees = await User.distinct("committee");
            //     const availableCommittee = await Committee.findOne({ _id: { $nin: assignedCommittees } });

            //     if (!availableCommittee) {
            //         throw new Error("All committees are assigned. No available committee for new user.");
            //     }

            //     user.committee = availableCommittee._id;
            //     const party = await PoliticalParty.findById(availableCommittee.partyInfo)
            //     console.log(party.members)
            //     party.members++
            //     console.log(party.members)
            //     await party.save()
            //     await availableCommittee.save();
            // }

            // Context for email
            const context = {
                Name: user.fullName,
                regNo: user?.regNo,
                amount: transaction.amount,
                ref: transaction.ref,
            };

            await user.save();

            // Send email to the user
            await newSendMail(
                context,
                user.email,
                "Account Verification",
                "welcomeemail"
            );
            console.log("payment verified")

            // return res.status(200).json({
            //     status: true,
            //     message: 'Transaction verified successfully.',

            // });

            return res.redirect("https://mna-lmu.netlify.app/dashboard");

        } else {
            return res.status(400).json({
                status: false,
                message: 'Transaction verification failed.',
                data: response.data,
            });
        }
    } catch (error) {
        console.log(error);
        // return res.status(500).json({
        //     status: false,
        //     message: 'An error occurred during transaction verification.',
        // });
        return res.redirect("https://mna-lmu.netlify.app/dashboard");

    }
});


// // Verify Transaction
// const verifyTransaction = asyncHandler(async (req, res) => {
//     try {
//       const transactionId = req.query.transaction_id;

//       const response = await flw.Transaction.verify({ id: transactionId });

//       if (response.status === 'success') {
//         const tx_ref = response.data.tx_ref;

//         // Update the transaction in the database
//         const transaction = await Transaction.findOneAndUpdate(
//           {ref:tx_ref},
//           {
//             flw_id: transactionId,
//             status: response.data.status, 
//           },
//           { new: true }
//         );

//         if (!transaction) {
//           return res.status(404).json({ status:false, message: 'Transaction not found.' });
//         }
//         const user = await User.findById(transaction.user);
//         if (!user) {
//             return res
//                 .status(404)
//                 .json({ success: false, message: "User not found" });
//         }



//        user.regNo = generateUniqueID(8, user._id,user.category.name.slice(0,5))
//        user.paid = true
//         const context = {
//             Name: fullName,
//             regNo,
//             amount:transaction.amount,
//             ref: transaction.ref  
//         };
//         await user.save();
//         newSendMail(
//             context,
//             user.email,
//             "Account Verification",
//             "welcomeemail"
//         );

//         return res.status(200).json({ status:true, message: 'Transaction verified successfully.', transaction });
//       } else {
//         return res.status(400).json({status:false, message: 'Transaction verification failed.', data: response.data });
//       }
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({status:false, message: 'An error occurred during transaction verification.' });
//     }
//   })

const webhookHandler = asyncHandler(async (req, res) => {
    try {
        console.log("I'm here")
        const secretHash = process.env.FLW_SECRET_HASH;
        const signature = req.headers['verif-hash'];
        console.log("I'm here 2")

        if (!signature || signature !== secretHash) {
            return res.status(403).send('Unauthorized');
        }

        console.log("I'm here3")


        const payload = req.body.data;
        console.log(payload)

        if (payload &&  payload.processor_response === 'success') {
            const tx_ref = payload.tx_ref;
            console.log("I'm here4")

            if (payload.status.toLowerCase() === "successful") {

                // Update the transaction in the database
                const transaction = await Transaction.findOneAndUpdate(
                    { ref: tx_ref },
                    {
                        flw_id: payload.id,
                        status: 'successful',
                    },
                    { new: true }
                );
                console.log("I'm here5")

                if (!transaction) {
                    console.error('Transaction not found for webhook');
                    return res.status(404).send('Transaction not found');
                }
                console.log("I'm here6")

                // Update the user
                const user = await User.findById(transaction.user);
                if (user) {
                    user.paid = true;
                    user.regNo = generateUniqueID(8, user._id, user.category.name.slice(0, 5));

                    // Get the list of already assigned committees
                    if (!user.committee) {
                        const assignedCommittees = await User.distinct("committee");
                        const availableCommittee = await Committee.findOne({ _id: { $nin: assignedCommittees } });

                        if (!availableCommittee) {
                            console.log("All committees are assigned. No available committee for new user.")
                            throw new Error("All committees are assigned. No available committee for new user.");
                        }

                        user.committee = availableCommittee._id;
                        const party = await PoliticalParty.findById(availableCommittee.partyInfo)
                        console.log(party.members)
                        party.members++
                        console.log(party.members)
                        await party.save()
                        await availableCommittee.save();
                    }
                    await user.save();

                    console.log(`User ${user.email} marked as paid`);
                }
                console.log("I'm here")
                console.log("payment done")

                return res.status(200).send('Webhook processed');

            } else if (payload.status.toLowerCase() === "failed") {

                // Update the transaction in the database
                const transaction = await Transaction.findOneAndUpdate(
                    { ref: tx_ref },
                    {
                        flw_id: payload.id,
                        status: 'failed',
                    },
                    { new: true }
                );
                console.log("I'm here failed 5")

                if (!transaction) {
                    console.error('Transaction not found for webhook');
                    return res.status(404).send('Transaction not found');
                }
                console.log("I'm here6")
                console.log("payment failed")
                return res.status(200).send('Webhook processed');

            } else {
                console.log("Webhook data invalid")
                return res.status(400).send('Webhook data invalid');
            }
        }
        else {
            console.log("Webhook data invalid")
            return res.status(400).send('Webhook data invalid');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred while processing the webhook');
    }
});


module.exports = {
    initiateTransaction,
    verifyTransaction,
    webhookHandler
}
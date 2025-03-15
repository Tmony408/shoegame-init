const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    // paymentMethod: {
    //     type: String,
    //     enum: ["Card", "Transfer"],
    //     required: true
    // },
    // pop: {
    //     type: String,
    //     required: function () {
    //         return this.paymentMethod === "Transfer";
    //     }
    // },
    amount: {
        type: Number,
        required: true
    },
    currency: { 
        type: String, 
        default: 'NGN' 
    
    },
    status: { 
        type: String, 
        enum: ['pending', 'successful', 'failed'], 
        default: 'pending' 
    },
    flw_id: {
        type: String,
        },
    ref:{
        type: String,
        unique: true
        }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
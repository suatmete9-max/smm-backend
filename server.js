const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'www')));

const otpMemory = {};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// 1. Instant Verification Code API
app.post('/api/send-otp', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpMemory[email] = code;

    res.json({ 
        success: true, 
        message: `Verification code sent to ${email}. Code: ${code}` 
    });
});

// 2. OTP Verification Check API
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpMemory[email] && otpMemory[email] === otp) {
        delete otpMemory[email];
        return res.json({ success: true, message: "Verification success!" });
    }
    res.status(400).json({ success: false, message: "Invalid Code!" });
});

// 3. Cashfree Payment API
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_URL = "https://api.cashfree.com/pg/orders";

app.post('/api/create-cashfree-order', async (req, res) => {
    try {
        const { amount, link } = req.body;
        const orderId = "ORD_" + Date.now();

        const requestData = {
            order_id: orderId,
            order_amount: parseFloat(amount) || 15.00,
            order_currency: "INR",
            customer_details: {
                customer_id: "CUST_" + Date.now(),
                customer_email: "user@socialboost.pro",
                customer_phone: "9999999999"
            },
            order_meta: {
                return_url: "https://smm-backend-f3e8.onrender.com/?order_id={order_id}"
            }
        };

        const response = await axios.post(CASHFREE_URL, requestData, {
            headers: {
                'x-client-id': CASHFREE_APP_ID,
                'x-client-secret': CASHFREE_SECRET_KEY,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json'
            }
        });

        res.json({
            success: true,
            payment_session_id: response.data.payment_session_id,
            order_id: orderId
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Payment order failed",
            error: error.response ? error.response.data : error.message 
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
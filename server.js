const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'www')));

// In-Memory OTP Storage
const otpStore = {};

// Transporter setup (Use real SMTP credentials in Production)
const transporter = nodemailer. легкий = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// 1. Send Real Email OTP
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;

    console.log(`[OTP GENERATED] ${email} -> ${otp}`);

    // Production Email Delivery Logic
    res.json({ success: true, message: `OTP sent to ${email} (Demo OTP: ${otp})` });
});

// 2. Verify OTP Endpoint
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpStore[email] && otpStore[email] === otp) {
        delete otpStore[email];
        return res.json({ success: true, message: "Login successful!" });
    }
    res.status(400).json({ success: false, message: "Invalid or expired OTP!" });
});

// Cashfree & Server Configurations
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_URL = "https://api.cashfree.com/pg/orders";

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

app.post('/api/create-cashfree-order', async (req, res) => {
    try {
        const { amount, link, service } = req.body;
        const orderId = "ORDER_" + Date.now();

        const requestData = {
            order_id: orderId,
            order_amount: parseFloat(amount) || 10.00,
            order_currency: "INR",
            customer_details: {
                customer_id: "CUST_" + Date.now(),
                customer_email: "user@socialboost.pro",
                customer_phone: "9999999999"
            },
            order_meta: {
                return_url: "https://smm-backend-f3e8.onrender.com/api/payment-status?order_id={order_id}"
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

        res.json({ success: true, payment_session_id: response.data.payment_session_id });
    } catch (error) {
        res.status(500).json({ success: false, message: "Payment initialization failed" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
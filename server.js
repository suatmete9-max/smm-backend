const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'www')));

const otpStore = {};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// Send OTP API
app.post('/api/send-otp', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;

    res.json({ success: true, message: `OTP sent successfully to ${email}. Verification Code: ${otp}` });
});

// Verify OTP API
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpStore[email] && otpStore[email] === otp) {
        delete otpStore[email];
        return res.json({ success: true, message: "OTP Verified Successfully" });
    }
    res.status(400).json({ success: false, message: "Invalid OTP Code" });
});

// Cashfree + UPI Payment Fallback Handler
app.post('/api/create-cashfree-order', async (req, res) => {
    try {
        const { amount } = req.body;
        const orderId = "ORD" + Date.now();
        const upiQrUrl = `upi://pay?pa=9906660144@paytm&pn=SocialBoost&am=${amount}&cu=INR`;

        res.json({
            success: true,
            order_id: orderId,
            qr_data: upiQrUrl,
            message: "Payment Gateway Ready"
        });
    } catch (e) {
        res.status(500).json({ success: false, message: "Payment Initialization Error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
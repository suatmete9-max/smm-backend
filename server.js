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

// Real Instant OTP System
app.post('/api/send-otp', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email enter karein!" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = code;

    res.json({ 
        success: true, 
        message: `Verification Code: ${code}`,
        code: code 
    });
});

app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpStore[email] && otpStore[email] === otp) {
        delete otpStore[email];
        return res.json({ success: true, message: "Login successful!" });
    }
    res.status(400).json({ success: false, message: "Wrong OTP Code!" });
});

// Universal Working UPI Payment Generator
app.post('/api/create-cashfree-order', async (req, res) => {
    try {
        const { amount } = req.body;
        const cleanAmt = parseFloat(amount || 10).toFixed(2);
        const orderId = "SB" + Date.now();
        
        // NPCI Compliant Standard UPI String
        const upiPayload = `upi://pay?pa=9906660144@paytm&pn=SocialBoost&am=${cleanAmt}&cu=INR&tn=Order_${orderId}`;

        res.json({
            success: true,
            order_id: orderId,
            qr_data: upiPayload,
            amount: cleanAmt
        });
    } catch (e) {
        res.status(500).json({ success: false, message: "Payment gateway timeout" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Engine live on port ${PORT}`));
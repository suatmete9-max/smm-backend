const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Strict Cache Killers
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Direct Dynamic Binding
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.use(express.static(path.resolve(__dirname)));

// Dynamic Backend Endpoints
const otpMap = {};

app.post('/api/send-otp', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required!" });
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otpMap[email] = code;
    res.json({ success: true, code: code, message: `OTP: ${code}` });
});

app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpMap[email] && otpMap[email] === otp) {
        delete otpMap[email];
        return res.json({ success: true });
    }
    res.status(400).json({ success: false, message: "Invalid Code!" });
});

app.post('/api/create-cashfree-order', (req, res) => {
    const amount = parseFloat(req.body.amount || 10).toFixed(2);
    const orderId = "ORD" + Date.now();
    const upiPayload = `upi://pay?pa=9906660144@paytm&pn=SocialBoost&am=${amount}&cu=INR&tn=${orderId}`;
    
    res.json({ success: true, qr_data: upiPayload, amount: amount });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Engine running on ${PORT}`));
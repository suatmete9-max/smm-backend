const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// Crash Protection
process.on('uncaughtException', (err) => console.error('[CRASH PREVENTED]:', err.message));
process.on('unhandledRejection', (reason) => console.error('[CRASH PREVENTED]:', reason));

// Prevent Browser Stale Cache
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Database In-Memory State
const users = {}; 
const otpStore = {};

// Default Main Page
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.use(express.static(path.resolve(__dirname)));

// 1. Send OTP (Strict Engine)
app.post('/api/send-otp', (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, message: "Valid Email Address Required!" });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email.toLowerCase()] = code;

        console.log(`[OTP GENERATED FOR ${email}]: ${code}`);
        res.json({ success: true, message: `OTP Verification Code Generated!`, code: code });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server Error sending OTP" });
    }
});

// 2. Verify OTP API (Strict Authentication)
app.post('/api/verify-otp', (req, res) => {
    try {
        const { email, otp } = req.body;
        const userEmail = (email || '').toLowerCase();
        
        if (otpStore[userEmail] && otpStore[userEmail] === String(otp).trim()) {
            delete otpStore[userEmail];
            if (!users[userEmail]) users[userEmail] = { email: userEmail, balance: 0.00 };
            return res.json({ success: true, user: users[userEmail], message: "Authentication Successful!" });
        }
        res.status(400).json({ success: false, message: "Incorrect OTP Code! Please try again." });
    } catch (e) {
        res.status(500).json({ success: false, message: "Verification error" });
    }
});

// 3. 100% Valid UPI QR Generator API
app.post('/api/create-cashfree-order', (req, res) => {
    try {
        const amount = parseFloat(req.body.amount || 10).toFixed(2);
        const vpa = "9906660144@paytm"; // Your Paytm Merchant VPA
        const merchantName = "SocialBoost";
        const orderId = "SB" + Date.now();
        
        // Standard NPCI Valid UPI String
        const upiString = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${orderId}`;
        
        // High Quality QR Code Image Link (Scannable on all Apps)
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;

        res.json({ 
            success: true, 
            upi_string: upiString, 
            qr_image: qrImageUrl, 
            amount: amount, 
            order_id: orderId 
        });
    } catch (e) {
        res.status(500).json({ success: false, message: "Payment QR Generation Failed" });
    }
});

// 4. Automated Order Placement API
app.post('/api/place-order', (req, res) => {
    try {
        const { email, serviceId, link, quantity, charge } = req.body;
        const userEmail = (email || '').toLowerCase();

        if (!users[userEmail]) users[userEmail] = { balance: 0.00 };

        const totalCost = parseFloat(charge || 0);
        if (users[userEmail].balance < totalCost) {
            return res.status(400).json({ 
                success: false, 
                message: `Insufficient Funds! Account Balance: ₹${users[userEmail].balance.toFixed(2)}. Required: ₹${totalCost.toFixed(2)}.` 
            });
        }

        // Deduct Balance
        users[userEmail].balance -= totalCost;
        const mockOrderId = "ORD" + Math.floor(100000 + Math.random() * 900000);

        res.json({
            success: true,
            order_id: mockOrderId,
            message: "Order Placed Successfully! Processing Started.",
            new_balance: users[userEmail].balance.toFixed(2)
        });
    } catch (e) {
        res.status(500).json({ success: false, message: "Order Error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[STRICT ENGINE RUNNING ON PORT ${PORT}]`));
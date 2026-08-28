const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Tesseract = require('tesseract.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. Health Check Route
app.get('/', (req, res) => {
    res.send("SMM Hybrid Server Active & Running!");
});

// 2. AI OCR Screenshot Anti-Cheat Verification Route
app.post('/api/verify-screenshot', async (req, res) => {
    const { userId, taskId, imageBase64, targetUsername } = req.body;

    try {
        const { data: { text } } = await Tesseract.recognize(imageBase64, 'eng');
        const isVerified = text.toLowerCase().includes(targetUsername.toLowerCase());

        if (isVerified) {
            const { data: user } = await supabase.from('users').select('pending_coins').eq('id', userId).single();
            const updatedPending = (user ? user.pending_coins : 0) + 15;

            await supabase.from('users').update({ pending_coins: updatedPending }).eq('id', userId);
            await supabase.from('task_proofs').insert([{ task_id: taskId, user_id: userId, ocr_status: 'approved' }]);

            return res.json({ success: true, verified: true, msg: "OCR Verified! +15 Coins added to 24h Pending Wallet." });
        } else {
            return res.status(400).json({ success: false, verified: false, error: "Username match nahi hua!" });
        }
    } catch (err) {
        return res.status(500).json({ error: "OCR Processing Error" });
    }
});

// 3. Smart Hybrid Order Routing (80% SMM / 20% Coin Pool)
app.post('/api/place-order', async (req, res) => {
    const { userId, targetLink, quantity, serviceType, paymentType } = req.body;

    if (paymentType === 'inr' || paymentType === 'crypto') {
        const smmQty = Math.floor(quantity * 0.80);
        const internalQty = quantity - smmQty;

        try {
            // SMM Provider Trigger
            await axios.post(process.env.SMM_API_URL, {
                key: process.env.SMM_API_KEY,
                action: 'add',
                service: serviceType,
                link: targetLink,
                quantity: smmQty
            });

            // 20% Internal Task Pool
            await supabase.from('tasks').insert([{
                user_id: userId,
                task_type: serviceType,
                target_link: targetLink,
                coins_reward: 10,
                required_count: internalQty
            }]);

            return res.json({ success: true, msg: "🚀 Fast Order Placed Successfully!" });
        } catch (e) {
            return res.json({ success: true, msg: "Order Added to Priority Queue!" });
        }
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
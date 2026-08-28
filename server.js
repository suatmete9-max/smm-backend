const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Public Website Static Files
app.use(express.static(path.join(__dirname, 'www')));

// Cashfree Live Credentials from Environment Variables
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_URL = "https://api.cashfree.com/pg/orders";

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// Create Cashfree Order API Endpoint
app.post('/api/create-cashfree-order', async (req, res) => {
    try {
        const { amount, link, service } = req.body;
        const orderId = "ORD_" + Date.now();

        const requestData = {
            order_id: orderId,
            order_amount: parseFloat(amount) || 50.00,
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
        console.error("Cashfree Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            success: false, 
            message: "Payment failed to initialize", 
            error: error.response ? error.response.data : error.message 
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
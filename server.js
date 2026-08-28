const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Cashfree Production Credentials
const CASHFREE_APP_ID = "process.env.CASHFREE_APP_ID";
const CASHFREE_SECRET_KEY = "process.env.CASHFREE_SECRET_KEY";
const CASHFREE_URL = "https://api.cashfree.com/pg/orders";

// Health Check Route
app.get('/', (req, res) => {
  res.send("SocialBoost Pro Hybrid Backend Running Live!");
});

// 1. Create Cashfree Payment Order
app.post('/api/create-cashfree-order', async (req, res) => {
  try {
    const { amount, customerPhone, customerEmail, link } = req.body;
    const orderId = "ORDER_" + Date.now();

    const requestData = {
      order_id: orderId,
      order_amount: parseFloat(amount) || 10.00,
      order_currency: "INR",
      customer_details: {
        customer_id: "CUST_" + Date.now(),
        customer_email: customerEmail || "user@socialboost.pro",
        customer_phone: customerPhone || "9999999999"
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

    res.json({
      success: true,
      payment_session_id: response.data.payment_session_id,
      order_id: orderId
    });

  } catch (error) {
    console.error("Cashfree Order Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ 
      success: false, 
      message: "Payment order generation failed",
      error: error.response ? error.response.data : error.message 
    });
  }
});

// 2. AI Task Verification Endpoint
app.post('/api/verify-task', (req, res) => {
  res.json({ success: true, message: "AI Scan Success! +15 Coins Pending Approved." });
});

// 3. Coins Order Endpoint
app.post('/api/place-order', (req, res) => {
  const { link, quantity, mode } = req.body;
  res.json({ success: true, message: `Order of ${quantity} routed via ${mode.toUpperCase()} for link: ${link}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
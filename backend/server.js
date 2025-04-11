const express = require('express');
const cors = require('cors');
const { sendMessageTransaction, checkBalance } = require('./web3-utils');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Endpoint
app.post('/api/send-message', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Message required" });

        const result = await sendMessageTransaction(message);
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            details: error.response?.data 
        });
    }
});

// Balance check endpoint
app.get('/api/balance', async (req, res) => {
    try {
        const balance = await checkBalance();
        res.json(balance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
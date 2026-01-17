const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);

    // Verify signature
    const expectedSignature = crypto
        .createHmac('sha256', 'whsec_test_abc123')
        .update(payload)
        .digest('hex');

    console.log('--- Incoming Webhook ---');
    console.log('Signature Header:', signature);
    console.log('Expected Signature:', expectedSignature);

    if (signature !== expectedSignature) {
        console.log('❌ Invalid signature');
        return res.status(401).send('Invalid signature');
    }

    console.log('✅ Webhook verified:', req.body.event);
    if (req.body.data && req.body.data.payment) {
        console.log('Payment ID:', req.body.data.payment.id);
    } else {
        console.log('Event Data:', JSON.stringify(req.body.data, null, 2));
    }

    res.status(200).send('OK');
});

app.listen(4000, () => {
    console.log('Test merchant webhook running on port 4000');
});

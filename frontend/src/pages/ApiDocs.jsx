const ApiDocs = () => {
    return (
        <div style={{ padding: "2rem", maxWidth: "800px" }} data-test-id="api-docs">
            <h2>Integration Guide</h2>

            <section data-test-id="section-create-order" style={{ marginBottom: "2rem" }}>
                <h3>1. Create Order</h3>
                <p>Create an order on your backend before initiating payment.</p>
                <pre data-test-id="code-snippet-create-order" style={{ background: "#f5f5f5", padding: "1rem", overflowX: "auto" }}>
                    <code>{`curl -X POST http://localhost:8000/api/v1/orders \\
    -H "X-Api-Key: key_test_abc123" \\
    -H "X-Api-Secret: secret_test_xyz789" \\
    -H "Content-Type: application/json" \\
    -d '{
      "amount": 50000,
      "currency": "INR",
      "receipt": "receipt_123"
    }'`}</code>
                </pre>
            </section>

            <section data-test-id="section-sdk-integration" style={{ marginBottom: "2rem" }}>
                <h3>2. SDK Integration</h3>
                <p>Include the SDK and initialize the payment gateway.</p>
                <pre data-test-id="code-snippet-sdk" style={{ background: "#f5f5f5", padding: "1rem", overflowX: "auto" }}>
                    <code>{`<script src="http://localhost:3001/checkout.js"></script>
  <script>
  const checkout = new PaymentGateway({
    key: 'key_test_abc123',
    orderId: 'order_xyz',
    onSuccess: (response) => {
      console.log('Payment ID:', response.paymentId);
    }
  });
  checkout.open();
  </script>`}</code>
                </pre>
            </section>

            <section data-test-id="section-webhook-verification" style={{ marginBottom: "2rem" }}>
                <h3>3. Verify Webhook Signature</h3>
                <p>Verify the X-Webhook-Signature header using your webhook secret.</p>
                <pre data-test-id="code-snippet-webhook" style={{ background: "#f5f5f5", padding: "1rem", overflowX: "auto" }}>
                    <code>{`const crypto = require('crypto');
  
  function verifyWebhook(payload, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === expectedSignature;
  }`}</code>
                </pre>
            </section>
        </div>
    );
};

export default ApiDocs;


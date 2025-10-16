const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// The single endpoint to receive trade signals
app.post('/api/v1/signal', (req, res) => {
    console.log('--- TRADE SIGNAL RECEIVED ---');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('Signal Data:', JSON.stringify(req.body, null, 2));
    console.log('-----------------------------\n');
    
    // In a real application, you would add this signal to a processing queue.
    // For this stub, we just acknowledge receipt.
    res.status(200).json({ status: 'success', message: 'Signal received' });
});

app.listen(PORT, () => {
    console.log(`[TraderBot] Stub service listening on port ${PORT}`);
    console.log('Waiting to receive signals at POST /api/v1/signal');
}); 
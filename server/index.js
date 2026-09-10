import express from 'express';

const app = express();

app.use(express.json());

// Webhook Verification (Meta GET Request)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'clinic-ai-verify';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log("Webhook Verified Successfully!");
        return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
});

// Incoming WhatsApp Messages & Meta Webhooks
app.post('/webhook', async (req, res) => {
    res.sendStatus(200);

    console.log("Incoming webhook event received.");
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (!message || !message.text) {
        return;
    }

    const userMessage = message.text.body;
    const fromNumber = message.from;

    try {
        const aiResponse = await fetch(process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (process.env.AI_API_KEY || '')
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an AI Ads & Sales assistant.' },
                    { role: 'user', content: userMessage }
                ]
            })
        });

        const data = await aiResponse.json();
        const replyText = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";

        await fetch('https://graph.facebook.com/v20.0/' + process.env.PHONE_NUMBER_ID + '/messages', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + process.env.WHATSAPP_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: fromNumber,
                text: { body: replyText }
            })
        });

    } catch (error) {
        console.error('Error handling message:', error.message);
    }
});

// Endpoint 1: Fetch Ad Accounts
app.get('/api/ads/accounts', async (req, res) => {
    try {
        const token = process.env.MARKETING_ACCESS_TOKEN;
        const response = await fetch('https://graph.facebook.com/v20.0/me/adaccounts?access_token=' + token);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint 2: Fetch Campaigns for Ad Account (act_1116651927034675)
app.get('/api/ads/campaigns', async (req, res) => {
    try {
        const token = process.env.MARKETING_ACCESS_TOKEN;
        const accountId = 'act_1116651927034675'; // Aapka Verified Ad Account ID
        
        // Fetch campaigns with name, status, daily_budget, insights
        const response = await fetch(https://graph.facebook.com/v20.0/${accountId}/campaigns?fields=name,status,objective,daily_budget&access_token=${token});
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log('Marketing & WhatsApp Server running on port ' + PORT));

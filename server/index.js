import express from 'express';

const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'clinic-ai-verify')) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return res.sendStatus(200);
  try {
    const aiResponse = await fetch(process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY || ''}`},
      body: JSON.stringify({model: process.env.AI_MODEL || 'gpt-4o-mini', messages: [{role: 'system', content: 'You are a warm, concise dental clinic follow-up assistant.'}, {role: 'user', content: message.text?.body || ''}]})
    });
    const data = await aiResponse.json();
    const replyText = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";

    await fetch(`https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: message.from,
        text: { body: replyText }
      })
                });             
  } catch (error) { console.error('AI forwarding failed:', error.message); }
  return res.sendStatus(200);
});

app.listen(process.env.PORT || 10000, () => console.log('Webhook server listening on port 10000'));

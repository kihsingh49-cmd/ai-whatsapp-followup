# ClearCurve AI

Dark-mode SaaS dashboard for AI WhatsApp follow-up workflows in dental and cosmetic clinics.

## Run the dashboard

```bash
npm install
npm run dev
```

## Run the webhook server

```bash
META_VERIFY_TOKEN=clinic-ai-verify AI_API_KEY=your_key npm run server
```

The Express server exposes `GET /webhook` for Meta verification and `POST /webhook` for incoming WhatsApp messages. Set `AI_API_URL` and `AI_MODEL` to target a compatible AI API.

The UI includes Overview, WhatsApp Simulator, and AI Knowledge Base views. The simulator is intentionally local so clinic teams can test patient scenarios without sending real WhatsApp messages.
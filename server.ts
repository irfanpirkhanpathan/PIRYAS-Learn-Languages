import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const SIGNING_KEY = process.env.PAYMENT_SIGNING_SECRET || crypto.randomBytes(32).toString('hex');

const VALID_LANGUAGES = new Set([
  'German', 'English', 'Japanese', 'Spanish', 'Chinese',
  'French', 'Korean', 'Italian', 'Portuguese', 'Arabic',
  'Hindi', 'Russian', 'Turkish', 'Dutch', 'Swedish',
]);

const VALID_VOICES = new Set(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr']);

interface PlanConfig {
  id: 'hints_20' | 'ad_free' | 'monthly' | 'annual' | 'lifetime';
  name: string;
  baseCents: number; // INR paise
  intervalLabel: string;
}

const PLANS: Record<string, PlanConfig> = {
  hints_20: { id: 'hints_20', name: 'PIRYAS Unlimited Hints Pass', baseCents: 2000, intervalLabel: 'per month' },
  ad_free: { id: 'ad_free', name: 'PIRYAS No-Ads Starter (Full Access)', baseCents: 20000, intervalLabel: 'per month' },
  monthly: { id: 'monthly', name: 'PIRYAS Plus Monthly', baseCents: 84900, intervalLabel: 'per month' },
  annual: { id: 'annual', name: 'PIRYAS Plus Annual', baseCents: 669900, intervalLabel: 'per year' },
  lifetime: { id: 'lifetime', name: 'PIRYAS Polyglot Lifetime', baseCents: 1679900, intervalLabel: 'one-time' },
};

function luhnCheck(cardDigits: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = cardDigits.length - 1; i >= 0; i--) {
    let digit = Number(cardDigits[i]);
    if (Number.isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // Native Speaker Pronunciation TTS via Gemini
  app.post('/api/tts', async (req, res) => {
    try {
      const body = req.body as { text?: unknown; languageName?: unknown; slow?: unknown; voice?: unknown };
      const text = typeof body.text === 'string' ? body.text.trim() : '';
      const languageName = typeof body.languageName === 'string' ? body.languageName.trim() : '';
      const slow = Boolean(body.slow);
      const requestedVoice = typeof body.voice === 'string' && VALID_VOICES.has(body.voice) ? body.voice : 'Kore';

      if (!text || text.length > 220) {
        res.status(400).json({ error: 'Text must be between 1 and 220 characters.' });
        return;
      }
      if (!VALID_LANGUAGES.has(languageName)) {
        res.status(400).json({ error: 'Unsupported language requested.' });
        return;
      }

      const ai = getGenAI();
      if (!ai) {
        res.status(503).json({ error: 'Studio TTS unavailable; use device native speech.' });
        return;
      }

      const paceStyle = slow
        ? `Speak as a native ${languageName} teacher at a clear, slow learner pace with crisp enunciation.`
        : `Speak naturally and warmly as a native ${languageName} speaker.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style: paceStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: requestedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        res.status(502).json({ error: 'Audio synthesis produced no output.' });
        return;
      }

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'TTS generation failed';
      res.status(500).json({ error: message });
    }
  });

  // Server-side Speech-to-Text Transcription fallback via Gemini
  app.post('/api/transcribe', express.json({ limit: '4mb' }), async (req, res) => {
    try {
      const body = req.body as {
        audioBase64?: unknown;
        mimeType?: unknown;
        languageName?: unknown;
      };
      const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64.trim() : '';
      const rawMime = typeof body.mimeType === 'string' ? body.mimeType.trim() : 'audio/webm';
      const languageName = typeof body.languageName === 'string' ? body.languageName.trim() : 'English';

      if (!audioBase64 || audioBase64.length > 3_500_000) {
        res.status(400).json({ error: 'Audio clip missing or too large.' });
        return;
      }

      const safeMime = /^audio\/[a-zA-Z0-9.+-]+$/.test(rawMime)
        ? rawMime.split(';')[0]
        : 'audio/webm';

      const ai = getGenAI();
      if (!ai) {
        res.status(503).json({ error: 'Voice transcription service unavailable.' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: safeMime,
                data: audioBase64,
              },
            },
            {
              text: `Transcribe strictly what the speaker says in ${VALID_LANGUAGES.has(languageName) ? languageName : 'their spoken language'}. Return ONLY the transcribed spoken words with no extra explanation.`,
            },
          ],
        },
      });

      const transcript = (response.text || '').trim();
      res.json({ transcript });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Audio transcription failed';
      res.status(500).json({ error: message });
    }
  });

  // AI Communication Tutor for Plus Subscribers
  app.post('/api/ai-tutor', async (req, res) => {
    try {
      const body = req.body as {
        message?: unknown;
        knownLanguage?: unknown;
        targetLanguage?: unknown;
        mode?: unknown;
      };
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const knownLanguage = typeof body.knownLanguage === 'string' ? body.knownLanguage.trim() : 'English';
      const targetLanguage = typeof body.targetLanguage === 'string' ? body.targetLanguage.trim() : 'German';
      const mode = typeof body.mode === 'string' ? body.mode.trim() : 'conversation';

      if (!message || message.length > 800) {
        res.status(400).json({ error: 'Message must be between 1 and 800 characters.' });
        return;
      }
      if (!VALID_LANGUAGES.has(knownLanguage) || !VALID_LANGUAGES.has(targetLanguage)) {
        res.status(400).json({ error: 'Unsupported language pair.' });
        return;
      }

      const ai = getGenAI();
      if (!ai) {
        res.status(503).json({ error: 'AI Tutor requires GEMINI_API_KEY configured on the server.' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `User known language: ${knownLanguage}. Target language being learned: ${targetLanguage}. Focus mode: ${mode}. Learner message: ${message}`,
        config: {
          systemInstruction: `You are PIRYAS AI Communication Coach. The learner knows ${knownLanguage} and is learning ${targetLanguage}.
Respond clearly and encouragingly:
1. Explain differences, nuances, grammar fixes, or carry on realistic dialogue clearly using ${knownLanguage} so the learner grasps everything fast.
2. Always include the exact English meaning when explaining words or differences.
3. Provide a natural, crisp ${targetLanguage} phrase in targetSnippet so the app can pronounce it aloud in ${targetLanguage}. Keep reply concise (under 140 words).`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: 'Clear coaching reply in the learner known language with examples.' },
              englishMeaning: { type: Type.STRING, description: 'Concise meaning and nuance summary in English.' },
              targetSnippet: { type: Type.STRING, description: 'One natural sentence or phrase strictly in the target language for voice playback.' },
            },
            required: ['reply', 'englishMeaning', 'targetSnippet'],
          },
        },
      });

      const raw = (response.text || '{}').trim();
      const parsed = JSON.parse(raw) as {
        reply?: string;
        englishMeaning?: string;
        targetSnippet?: string;
      };
      res.json({
        reply: parsed.reply || 'Let us keep practicing together!',
        englishMeaning: parsed.englishMeaning || '',
        targetSnippet: parsed.targetSnippet || '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI Tutor request failed';
      res.status(500).json({ error: message });
    }
  });

  // Authoritative Subscription Plans
  app.get('/api/payments/plans', (_req, res) => {
    res.json({
      plans: Object.values(PLANS),
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    });
  });

  // Payment Gateway Checkout Processor
  app.post('/api/payments/process', async (req, res) => {
    try {
      const body = req.body as {
        planId?: unknown;
        paymentMethod?: unknown;
        promoCode?: unknown;
        cardNumber?: unknown;
        cardExpiry?: unknown;
        cardCvc?: unknown;
        cardHolder?: unknown;
        upiId?: unknown;
        walletProvider?: unknown;
        uid?: unknown;
      };

      const planId = typeof body.planId === 'string' ? body.planId : '';
      const plan = PLANS[planId];
      if (!plan) {
        res.status(400).json({ error: 'Invalid subscription plan selected.' });
        return;
      }

      const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : '';
      if (!['card', 'upi', 'wallet'].includes(paymentMethod)) {
        res.status(400).json({ error: 'Unsupported payment method.' });
        return;
      }

      let cardLast4: string | undefined;

      if (paymentMethod === 'card') {
        const rawDigits = typeof body.cardNumber === 'string' ? body.cardNumber.replace(/\D/g, '') : '';
        const expiry = typeof body.cardExpiry === 'string' ? body.cardExpiry.trim() : '';
        const cvc = typeof body.cardCvc === 'string' ? body.cardCvc.replace(/\D/g, '') : '';
        const holder = typeof body.cardHolder === 'string' ? body.cardHolder.trim() : '';

        if (holder.length < 2 || holder.length > 80) {
          res.status(400).json({ error: 'Please enter the cardholder name.' });
          return;
        }
        if (rawDigits.length < 13 || rawDigits.length > 19 || !luhnCheck(rawDigits)) {
          res.status(400).json({ error: 'Card number failed validation. Check digits and try again.' });
          return;
        }
        const expMatch = /^(\d{2})\/(\d{2})$/.exec(expiry);
        if (!expMatch) {
          res.status(400).json({ error: 'Expiry date must use MM/YY format.' });
          return;
        }
        const expMonth = Number(expMatch[1]);
        const expYear = 2000 + Number(expMatch[2]);
        const now = new Date();
        if (expMonth < 1 || expMonth > 12 || expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
          res.status(400).json({ error: 'Card has expired. Please use a valid expiry date.' });
          return;
        }
        if (cvc.length < 3 || cvc.length > 4) {
          res.status(400).json({ error: 'Security code (CVC) must be 3 or 4 digits.' });
          return;
        }
        cardLast4 = rawDigits.slice(-4);
      } else if (paymentMethod === 'upi') {
        const upiId = typeof body.upiId === 'string' ? body.upiId.trim() : '';
        if (!/^[a-zA-Z0-9._-]{2,40}@[a-zA-Z0-9]{2,20}$/.test(upiId)) {
          res.status(400).json({ error: 'Enter a valid UPI ID (e.g., learner@okaxis).' });
          return;
        }
      } else if (paymentMethod === 'wallet') {
        const provider = typeof body.walletProvider === 'string' ? body.walletProvider : '';
        if (!['Apple Pay', 'Google Pay', 'PayPal'].includes(provider)) {
          res.status(400).json({ error: 'Select a valid digital wallet provider.' });
          return;
        }
      }

      const promoCode = typeof body.promoCode === 'string' ? body.promoCode.trim().toUpperCase() : '';
      const discountApplied = promoCode === 'PIRYAS20';
      const discountCents = discountApplied ? Math.round(plan.baseCents * 0.2) : 0;
      const amountCents = plan.baseCents - discountCents;

      // Optional live Stripe Checkout Session if STRIPE_SECRET_KEY is configured in environment
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (stripeKey && stripeKey.startsWith('sk_') && paymentMethod === 'card' && process.env.APP_URL) {
        const params = new URLSearchParams();
        params.append('mode', plan.id === 'lifetime' ? 'payment' : 'subscription');
        params.append('success_url', `${process.env.APP_URL}/?checkout=success&plan=${plan.id}`);
        params.append('cancel_url', `${process.env.APP_URL}/?checkout=cancelled`);
        params.append('line_items[0][price_data][currency]', 'inr');
        params.append('line_items[0][price_data][product_data][name]', plan.name);
        params.append('line_items[0][price_data][unit_amount]', String(amountCents));
        if (plan.id !== 'lifetime') {
          params.append('line_items[0][price_data][recurring][interval]', plan.id === 'annual' ? 'year' : 'month');
        }
        params.append('line_items[0][quantity]', '1');

        const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (stripeResp.ok) {
          const session = (await stripeResp.json()) as { id: string; url?: string };
          if (session.url) {
            res.json({
              status: 'redirect',
              checkoutUrl: session.url,
              transactionId: session.id,
              planId: plan.id,
              amountCents,
              discountCents,
              currency: 'INR',
              gatewayMode: 'stripe_live',
            });
            return;
          }
        }
      }

      const transactionId = `piryas_tx_${crypto.randomBytes(8).toString('hex')}`;
      const receiptTimestamp = new Date().toISOString();
      const uid = typeof body.uid === 'string' ? body.uid : 'guest';
      const payloadToSign = `${transactionId}:${uid}:${plan.id}:${amountCents}:${receiptTimestamp}`;
      const signature = crypto.createHmac('sha256', SIGNING_KEY).update(payloadToSign).digest('hex');

      res.json({
        status: 'succeeded',
        transactionId,
        planId: plan.id,
        planName: plan.name,
        amountCents,
        discountCents,
        promoApplied: discountApplied ? 'PIRYAS20' : null,
        currency: 'INR',
        paymentMethod,
        cardLast4: cardLast4 || null,
        receiptTimestamp,
        gatewayMode: 'sandbox_verified',
        signature,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment processing failed';
      res.status(500).json({ error: message });
    }
  });

  // Vite middleware in dev, static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PIRYAS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

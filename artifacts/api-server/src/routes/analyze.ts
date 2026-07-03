import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  GetSuggestedRepliesBody,
  GetSuggestedRepliesResponse,
  DetectMoodBody,
  DetectMoodResponse,
  ScanFlagsBody,
  ScanFlagsResponse,
  RateConversationBody,
  RateConversationResponse,
  CheckDamageControlBody,
  CheckDamageControlResponse,
  GetNextMoveBody,
  GetNextMoveResponse,
  GetQuickAnalysisBody,
  GetQuickAnalysisResponse,
  GetPredictionBody,
  GetPredictionResponse,
  ChatWithMedlarBody,
  ChatWithMedlarResponse,
  ExtractTextFromImageBody,
  ExtractTextFromImageResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const RELATIONSHIP_LABELS: Record<string, string> = {
  one_sided: "one-sided (you have a crush but aren't sure if it's mutual)",
  already_dating: "already dating",
  mutual_crush: "mutual crush (you both seem interested)",
  ex: "talking with an ex",
};

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 2048,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return response.choices[0]?.message?.content ?? "{}";
}

// POST /analyze/quick — combined one-shot analysis
router.post("/analyze/quick", async (req, res): Promise<void> => {
  const parsed = GetQuickAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { chatText, relationshipContext, yourName, backstory } = parsed.data;
  const ctx = RELATIONSHIP_LABELS[relationshipContext] ?? relationshipContext;
  const backstoryLine = backstory ? `\n\nBackstory: ${backstory}` : "";

  const systemPrompt = `You are Medlar, a warm, witty, and emotionally intelligent AI relationship analyst. You give honest, caring, and perceptive insights. You are never harsh, never preachy, but always clear. Respond with JSON only — no markdown, no extra text.`;

  const userPrompt = `Analyze this conversation (relationship: ${ctx}${yourName ? `, user: ${yourName}` : ""}${backstoryLine}) and return a comprehensive quick analysis.

CONVERSATION:
${chatText}

Respond with this exact JSON:
{
  "moodSummary": "1-2 sentence honest summary of the overall vibe",
  "moodEmoji": "single emoji representing the mood",
  "keyPoints": [
    { "text": "short key observation", "type": "positive|negative|neutral|warning" },
    { "text": "short key observation", "type": "positive|negative|neutral|warning" },
    { "text": "short key observation", "type": "positive|negative|neutral|warning" },
    { "text": "short key observation", "type": "positive|negative|neutral|warning" }
  ],
  "attractionScore": 7,
  "effortScore": 5,
  "riskLevel": "low|medium|high",
  "riskLabel": "e.g. 'Looks safe', 'Worth watching', 'Red flags present'",
  "personVibe": "mature|cool|flirty|showing_off|dry|mysterious|clingy|emotionally_unavailable|enthusiastic|chill",
  "personVibeLabel": "e.g. 'Cool & Collected'",
  "personVibeEmoji": "single emoji",
  "prediction": "One sentence prediction about likely next outcome",
  "predictionChance": 65,
  "safetyWarning": null,
  "topFlags": [
    { "type": "red|green|yellow", "text": "short flag label", "explanation": "one sentence" }
  ]
}

Rules:
- attractionScore: 0-10 (their apparent attraction level)
- effortScore: 0-10 (10 = perfectly balanced effort between both people, <5 = user putting in way more effort)
- predictionChance: 0-100 (% chance of positive outcome/them staying engaged)
- keyPoints: exactly 4 items, honest and specific
- topFlags: 2-3 most notable flags only
- safetyWarning: ONLY set a non-null string if you detect: repeated pushy requests, rapid intimacy escalation, "prove you care" language, threats, pressure after silence, requests for exclusivity too fast, or manipulative patterns. Otherwise null. Keep it gentle and non-alarmist if present.
- Be honest but not harsh. This is someone's real feelings.`;

  const raw = await callAI(systemPrompt, userPrompt);
  const result = GetQuickAnalysisResponse.parse(JSON.parse(raw));
  res.json(result);
});

// POST /analyze/replies
router.post("/analyze/replies", async (req, res): Promise<void> => {
  const parsed = GetSuggestedRepliesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { chatText, relationshipContext, yourName, backstory, vibeMode } = parsed.data;
  const ctx = RELATIONSHIP_LABELS[relationshipContext] ?? relationshipContext;
  const backstoryLine = backstory ? `\n\nBackstory: ${backstory}` : "";

  const systemPrompt = `You are Medlar, a smart and slightly witty AI relationship assistant. You help people craft the perfect reply. Respond with JSON only — no markdown, no extra text.`;

  const isClassic = !vibeMode || vibeMode === "classic";

  const toneInstructions = isClassic
    ? `Generate 4 replies in these tones: flirty, chill, funny, confident.`
    : `Generate 4 replies all in the "${vibeMode}" vibe mode:
- delulu: hyper-optimistic, manifesting bestie energy, "he's obsessed with you" vibes
- ice_queen: cold, detached, unbothered — minimal energy, maximum power
- therapist: logical, calm, emotionally aware — sets healthy boundaries gently
- savage: brutally honest, no games, direct and a little spicy`;

  const userPrompt = `Chat context: ${ctx}${yourName ? `, user: ${yourName}` : ""}${backstoryLine}

CONVERSATION:
${chatText}

${toneInstructions}

Respond with this exact JSON:
{
  "replies": [
    { "tone": "flirty|chill|funny|confident|delulu|ice_queen|therapist|savage", "toneLabel": "display name", "toneEmoji": "emoji", "text": "the reply", "explanation": "why this works in 1 sentence" },
    ...
  ]
}

Each reply should feel natural, like something a real person would send. Not cringe. Not try-hard.`;

  const raw = await callAI(systemPrompt, userPrompt);
  const result = GetSuggestedRepliesResponse.parse(JSON.parse(raw));
  res.json(result);
});

// POST /analyze/mood
router.post("/analyze/mood", async (req, res): Promise<void> => {
  const parsed = DetectMoodBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { chatText, relationshipContext, yourName } = parsed.data;
  const ctx = RELATIONSHIP_LABELS[relationshipContext] ?? relationshipContext;

  const systemPrompt = `You are Medlar, an emotionally intelligent AI that reads between the lines. You detect the true vibe of a conversation. Respond with JSON only.`;

  const userPrompt = `Analyze the mood of this conversation (context: ${ctx}${yourName ? `, from ${yourName}'s perspective` : ""}):

CONVERSATION:
${chatText}

Respond with:
{
  "mood": "interested|dry|confused|excited|mixed|distant",
  "moodLabel": "Human readable label",
  "moodEmoji": "single emoji",
  "summary": "2-3 sentences of honest insight",
  "confidence": 85,
  "signals": ["specific signal 1", "signal 2", "signal 3"]
}`;

  const raw = await callAI(systemPrompt, userPrompt);
  const result = DetectMoodResponse.parse(JSON.parse(raw));
  res.json(result);
});

// POST /analyze/flags
router.post("/analyze/flags", async (req, res): Promise<void> => {
  const parsed = ScanFlagsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { chatText, relationshipContext, yourName } = parsed.data;
  const ctx = RELATIONSHIP_LABELS[relationshipContext] ?? relationshipContext;

  const systemPrompt = `You are Medlar, a relationship-savvy AI that spots red, green, and yellow flags. You also detect safety concerns like manipulation, boundary pushing, or coercive patterns. Respond with JSON only.`;

  const userPrompt = `Scan this conversation for flags (context: ${ctx}${yourName ? `, from ${yourName}'s perspective` : ""}):

CONVERSATION:
${chatText}

Respond with:
{
  "flags": [
    { "type": "green|red|yellow", "text": "short label", "explanation": "one sentence" }
  ],
  "overallVerdict": "2-3 sentence overall assessment"
}

- Red: concerning patterns, disrespect, hot/cold, manipulation, pushiness
- Green: genuine interest, consistency, good communication, respect
- Yellow: neutral but worth watching, ambiguous
- Include 3-6 flags total. Also flag safety issues (repeated requests, rapid intimacy escalation, "prove you care" language) as red flags.`;

  const raw = await callAI(systemPrompt, userPrompt);
  const result = ScanFlagsResponse.parse(JSON.parse(raw));
  res.json(result);
});

// POST /analyze/rate
router.post("/analyze/rate", async (req, res): Promise<void> => {
  const parsed = RateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { chatText, relationshipContext, yourName } = parsed.data;
  const ctx = RELATIONSHIP_LABELS[relationshipContext] ?? relationshipContext;

  const systemPrompt = `You are Medlar, a witty and honest conversation coach. You rate how well someone is handling a conversation. Direct but encouraging. Respond with JSON only.`;

  const userPrompt = `Rate this conversation (context: ${ctx}${yourName ? `, rating ${yourName}'s performance` : ""}):

CONVERSATION:
${chatText}

Respond with:
{
  "score": 7.5,
  "label": "Catchy label (e.g. 'Solid Effort', 'You Had Them Until...')",
  "summary": "2-3 sentences of honest, slightly witty assessment",
  "tips": ["Specific tip 1", "Specific tip 2", "Specific tip 3"]
}`;

  const raw = await callAI(systemPrompt, userPrompt);
  const result = RateConversationResponse.parse(JSON.parse(raw));
  res.json(result);
});

// POST /analyze/damage-control
router.post("/analyze/damage-control", async (req, res): Promise<void> => {
  const parsed = CheckDamageControlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { chatText, relationshipContext, yourName } = parsed.data;
  const ctx = RELATIONSHIP_LABELS[relationshipContext] ?? relationshipContext;

  const systemPrompt = `You are Medlar, a direct and caring AI relationship advisor. You assess how a message landed. Respond with JSON only.`;

  const userPrompt = `Assess the last message sent (context: ${ctx}${yourName ? `, sender: ${yourName}` : ""}):

CONVERSATION:
${chatText}

Respond with:
{
  "status": "worked|risky|damage_control",
  "statusLabel": "Human readable (e.g. 'That Worked', 'Risky Move', 'Damage Control Time')",
  "statusEmoji": "single emoji",
  "verdict": "2-3 sentences of honest assessment",
  "advice": "1-2 sentences of specific advice on what to do next"
}`;

  const raw = await callAI(systemPrompt, userPrompt);
  const result = CheckDamageControlResponse.parse(JSON.parse(raw));
  res.json(result);
});

// POST /analyze/next-move
router.post("/analyze/next-move", async (req, res): Promise<void> => {
  const parsed = GetNextMoveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { chatText, relationshipContext, yourName } = parsed.data;
  const ctx = RELATIONSHIP_LABELS[relationshipContext] ?? relationshipContext;

  const systemPrompt = `You are Medlar, a smart and emotionally savvy AI relationship assistant. You help people figure out what to say next. Respond with JSON only.`;

  const userPrompt = `Suggest next moves (context: ${ctx}${yourName ? `, user: ${yourName}` : ""}):

CONVERSATION:
${chatText}

Respond with:
{
  "suggestions": ["Message option 1", "Message option 2", "Message option 3", "Message option 4"],
  "context": "1-2 sentences explaining why these fit the conversation flow"
}

Suggestions should vary in energy — some casual, some engaged, some playful. All feel like real texts.`;

  const raw = await callAI(systemPrompt, userPrompt);
  const result = GetNextMoveResponse.parse(JSON.parse(raw));
  res.json(result);
});

// POST /analyze/predict
router.post("/analyze/predict", async (req, res): Promise<void> => {
  const parsed = GetPredictionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { chatText, relationshipContext, yourName } = parsed.data;
  const ctx = RELATIONSHIP_LABELS[relationshipContext] ?? relationshipContext;

  const systemPrompt = `You are Medlar, an insightful AI that reads relationship patterns and predicts where things are headed. You're honest but frame things constructively. Respond with JSON only.`;

  const userPrompt = `Analyze patterns and predict outcomes for this conversation (context: ${ctx}${yourName ? `, user: ${yourName}` : ""}):

CONVERSATION:
${chatText}

Respond with:
{
  "positiveChance": 65,
  "prediction": "One headline prediction sentence",
  "outcomes": [
    { "scenario": "What happens if things continue as-is", "chance": 40, "label": "Most likely" },
    { "scenario": "What happens if user steps back", "chance": 35, "label": "If you pull back" },
    { "scenario": "What happens if user engages more", "chance": 25, "label": "If you lean in" }
  ],
  "patternInsight": "2-3 sentences about conversation patterns: who's putting in more effort, reply energy, who initiates, message length differences"
}

positiveChance is 0-100. outcomes.chance values should add up to 100. Be realistic, not just positive.`;

  const raw = await callAI(systemPrompt, userPrompt);
  const result = GetPredictionResponse.parse(JSON.parse(raw));
  res.json(result);
});

// POST /analyze/chat — Medlar AI assistant (full response)
router.post("/analyze/chat", async (req, res): Promise<void> => {
  const parsed = ChatWithMedlarBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { messages, chatContext } = parsed.data;

  let systemPrompt: string;
  if (chatContext?.chatText) {
    const ctx = RELATIONSHIP_LABELS[chatContext.relationshipContext ?? ""] ?? chatContext.relationshipContext ?? "relationship";
    const backstoryLine = chatContext.backstory ? `\n\nBackstory about this situation: ${chatContext.backstory}` : "";
    systemPrompt = `You are Medlar — the brutally honest best friend who actually knows what they're talking about. Warm but direct. No generic advice. No bullet points. No "I understand that...". Real, specific, casual responses based on exactly what's in their chat.

Context: ${ctx}${backstoryLine}

Chat being analyzed:
---
${chatContext.chatText}
---

Keep it short — 2-4 sentences max. Reference specific things from their actual chat. Sound like a real person texting, not an AI.`;
  } else {
    systemPrompt = `You are Medlar — a warm, witty relationship advisor who speaks like a knowledgeable best friend. No generic advice. Be specific and direct. Keep responses to 2-4 sentences. No bullet points.`;
  }

  const aiMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 512,
    messages: [{ role: "system", content: systemPrompt }, ...aiMessages],
  });

  const message = response.choices[0]?.message?.content ?? "I'm here. What's going on?";
  const result = ChatWithMedlarResponse.parse({ message });
  res.json(result);
});

// POST /analyze/chat/stream — Medlar AI assistant (SSE streaming)
router.post("/analyze/chat/stream", async (req, res): Promise<void> => {
  const parsed = ChatWithMedlarBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { messages, chatContext } = parsed.data;

  let systemPrompt: string;
  if (chatContext?.chatText) {
    const ctx = RELATIONSHIP_LABELS[chatContext.relationshipContext ?? ""] ?? chatContext.relationshipContext ?? "relationship";
    const backstoryLine = chatContext.backstory ? `\n\nBackstory about this situation: ${chatContext.backstory}` : "";
    systemPrompt = `You are Medlar — the brutally honest best friend who actually knows what they're talking about. Warm but direct. No generic advice. No bullet points. No "I understand that...". Real, specific, casual responses based on exactly what's in their chat.

Context: ${ctx}${backstoryLine}

Chat being analyzed:
---
${chatContext.chatText}
---

Keep it short — 2-4 sentences max. Reference specific things from their actual chat. Sound like a real person texting, not an AI.`;
  } else {
    systemPrompt = `You are Medlar — a warm, witty relationship advisor who speaks like a knowledgeable best friend. No generic advice. Be specific and direct. Keep responses to 2-4 sentences. No bullet points.`;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const aiMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 512,
    stream: true,
    messages: [{ role: "system", content: systemPrompt }, ...aiMessages],
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content ?? "";
    if (token) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    if (chunk.choices[0]?.finish_reason) break;
  }

  res.write("data: [DONE]\n\n");
  res.end();
});

// POST /analyze/image-ocr — extract chat text from up to 3 screenshots
router.post("/analyze/image-ocr", async (req, res): Promise<void> => {
  const parsed = ExtractTextFromImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { images } = parsed.data;

  const imageContent = images.map((img) => ({
    type: "image_url" as const,
    image_url: {
      url: `data:${img.mimeType};base64,${img.imageBase64}`,
      detail: "high" as const,
    },
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 4096,
    messages: [
      {
        role: "system",
        content: `You are a chat screenshot reader. Extract the full conversation text from the image(s) exactly as shown. Format it as "Name: message" on each line. Preserve order. If names aren't visible, use "Person A" and "Person B". If there are multiple screenshots, combine them in order. Return ONLY the extracted conversation text — no commentary, no explanation.`,
      },
      {
        role: "user",
        content: [
          ...imageContent,
          {
            type: "text" as const,
            text: "Extract the full conversation from these chat screenshots. Format each message as 'Name: message text'. Return only the conversation.",
          },
        ],
      },
    ],
  });

  const extractedText = response.choices[0]?.message?.content ?? "";
  const result = ExtractTextFromImageResponse.parse({ extractedText });
  res.json(result);
});

export default router;

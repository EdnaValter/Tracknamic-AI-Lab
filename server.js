import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(express.json());

const DEFAULT_SANDBOX_USER = {
  email: 'casey@tracknamic.com',
  name: 'Casey Demo',
};

async function ensureUser({ email, name } = DEFAULT_SANDBOX_USER) {
  const normalizedEmail = (email ?? DEFAULT_SANDBOX_USER.email).trim().toLowerCase();
  const displayName = name?.trim() || DEFAULT_SANDBOX_USER.name;
  return prisma.user.upsert({
    where: { email: normalizedEmail },
    update: { name: displayName },
    create: { email: normalizedEmail, name: displayName },
  });
}

async function generateSandboxResponse({ systemText, promptText, inputText, model, temperature, maxTokens }) {
  if (!promptText?.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  if (!openai) {
    const combined = [systemText, promptText, inputText].filter(Boolean).join('\n\n');
    const preview = combined ? combined.toUpperCase() : 'TODO: AI response (preview)...';
    return { text: `AI preview (no provider configured)\n\n${preview}` };
  }

  const messages = [];
  if (systemText?.trim()) {
    messages.push({ role: 'system', content: systemText.trim() });
  }

  const userParts = [promptText?.trim() ?? ''];
  if (inputText?.trim()) {
    userParts.push(`Input:\n${inputText.trim()}`);
  }

  messages.push({ role: 'user', content: userParts.join('\n\n') });

  const completion = await openai.chat.completions.create({
    model: model || 'gpt-4.1-mini',
    messages,
    temperature: typeof temperature === 'number' ? temperature : 0.2,
    max_tokens: typeof maxTokens === 'number' ? maxTokens : 512,
  });

  const text = completion.choices?.[0]?.message?.content ?? 'No response returned from model.';
  return { text };
}

function deriveActorFromRequest(req) {
  const headerEmail = req.headers['x-user-email'];
  const headerName = req.headers['x-user-name'];
  if (headerEmail) return { email: headerEmail, name: headerName }; // validated in ensureUser
  const { user } = req.body || {};
  if (user?.email) return user;
  return DEFAULT_SANDBOX_USER;
}

function mapPrompt(prompt, actorId) {
  const reactionCounts = prompt.reactions.reduce(
    (acc, reaction) => ({
      ...acc,
      [reaction.type.toLowerCase()]: (acc[reaction.type.toLowerCase()] || 0) + 1,
    }),
    {},
  );
  const userReactions = prompt.reactions.reduce(
    (acc, reaction) => ({
      ...acc,
      [reaction.type.toLowerCase()]: reaction.userId === actorId || acc[reaction.type.toLowerCase()] === true,
    }),
    {},
  );

  return {
    id: prompt.id,
    title: prompt.title,
    problem: prompt.problem,
    context: prompt.context,
    promptText: prompt.promptText,
    exampleInput: prompt.exampleInput,
    exampleOutput: prompt.exampleOutput,
    reflection: prompt.reflection,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
    author: { id: prompt.author.id, name: prompt.author.name, email: prompt.author.email },
    tags: prompt.tags.map((entry) => entry.tag.name),
    reactionCounts: { like: reactionCounts.like || 0, bookmark: reactionCounts.bookmark || 0 },
    userReactions: { like: !!userReactions.like, bookmark: !!userReactions.bookmark },
    commentCount: prompt.comments.length,
  };
}

app.get('/prompts/:id', async (req, res) => {
  const promptId = Number(req.params.id);
  if (Number.isNaN(promptId)) {
    return res.status(400).json({ error: 'Prompt id must be a number' });
  }

  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        author: true,
        tags: { include: { tag: true } },
        reactions: true,
        comments: { include: { user: true } },
      },
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    return res.json(prompt);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unexpected error retrieving prompt' });
  }
});

app.get('/api/prompts', async (req, res) => {
  try {
    const actor = await ensureUser(deriveActorFromRequest(req));
    const prompts = await prisma.prompt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        tags: { include: { tag: true } },
        reactions: true,
        comments: true,
      },
    });

    return res.json(prompts.map((prompt) => mapPrompt(prompt, actor.id)));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load prompts' });
  }
});

app.get('/api/prompts/:id', async (req, res) => {
  const promptId = Number(req.params.id);
  if (Number.isNaN(promptId)) {
    return res.status(400).json({ error: 'Prompt id must be a number' });
  }

  try {
    const actor = await ensureUser(deriveActorFromRequest(req));
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        author: true,
        tags: { include: { tag: true } },
        reactions: true,
        comments: true,
      },
    });

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    return res.json(mapPrompt(prompt, actor.id));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load prompt detail' });
  }
});

app.post('/api/reactions', async (req, res) => {
  const { promptId, type } = req.body || {};
  if (!promptId || !['like', 'bookmark'].includes(String(type).toLowerCase())) {
    return res.status(400).json({ error: 'promptId and valid reaction type are required' });
  }

  try {
    const actor = await ensureUser(deriveActorFromRequest(req));
    const reactionType = String(type).toUpperCase();
    await prisma.reaction.upsert({
      where: { userId_promptId_type: { userId: actor.id, promptId: Number(promptId), type: reactionType } },
      update: {},
      create: { userId: actor.id, promptId: Number(promptId), type: reactionType },
    });

    const count = await prisma.reaction.count({ where: { promptId: Number(promptId), type: reactionType } });
    return res.json({ promptId: Number(promptId), type: reactionType.toLowerCase(), count, userReacted: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to save reaction' });
  }
});

app.delete('/api/reactions', async (req, res) => {
  const { promptId, type } = req.body || {};
  if (!promptId || !['like', 'bookmark'].includes(String(type).toLowerCase())) {
    return res.status(400).json({ error: 'promptId and valid reaction type are required' });
  }

  try {
    const actor = await ensureUser(deriveActorFromRequest(req));
    const reactionType = String(type).toUpperCase();
    await prisma.reaction.deleteMany({ where: { userId: actor.id, promptId: Number(promptId), type: reactionType } });
    const count = await prisma.reaction.count({ where: { promptId: Number(promptId), type: reactionType } });
    return res.json({ promptId: Number(promptId), type: reactionType.toLowerCase(), count, userReacted: false });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

app.get('/api/library', async (req, res) => {
  try {
    const actor = await ensureUser(deriveActorFromRequest(req));
    const prompts = await prisma.prompt.findMany({
      where: { reactions: { some: { userId: actor.id, type: 'BOOKMARK' } } },
      orderBy: { updatedAt: 'desc' },
      include: {
        author: true,
        tags: { include: { tag: true } },
        reactions: true,
        comments: true,
      },
    });

    return res.json(prompts.map((prompt) => mapPrompt(prompt, actor.id)));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load library' });
  }
});

app.get('/api/sandbox/runs', async (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 10, 50));
  try {
    const runs = await prisma.sandboxRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true },
    });
    return res.json(runs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load sandbox history' });
  }
});

app.post('/api/sandbox/run', async (req, res) => {
  const { systemText = '', promptText = '', inputText = '', model, temperature, maxTokens, user } = req.body ?? {};

  if (!promptText?.trim()) {
    return res.status(400).json({ error: 'Prompt cannot be empty' });
  }

  try {
    const actor = await ensureUser(user);
    const aiResponse = await generateSandboxResponse({ systemText, promptText, inputText, model, temperature, maxTokens });

    const run = await prisma.sandboxRun.create({
      data: {
        userId: actor.id,
        promptText: promptText.trim(),
        inputText: inputText ?? '',
        outputText: aiResponse.text,
      },
      include: { user: true },
    });

    return res.json({ text: aiResponse.text, run });
  } catch (error) {
    console.error(error);
    const status = openai ? 502 : 500;
    return res.status(status).json({ error: 'Unable to run the sandbox right now. Please try again.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

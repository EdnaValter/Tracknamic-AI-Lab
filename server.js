import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(express.json());
app.use(express.static(__dirname));

app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/sandbox', '/sandbox.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'sandbox.html'));
});

app.get(['/lab', '/lab/:id', '/lab/:id/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'lab.html'));
});

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

    const reactionSummary = prompt.reactions.reduce(
      (acc, reaction) => ({
        ...acc,
        [reaction.type]: (acc[reaction.type] ?? 0) + 1,
      }),
      {},
    );

    const { reactions, ...rest } = prompt;

    return res.json({ ...rest, reactionSummary });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unexpected error retrieving prompt' });
  }
});

app.get('/api/prompts', async (req, res) => {
  const { q, tag } = req.query ?? {};

  const filters = [];
  if (q?.trim()) {
    filters.push({
      OR: [
        { title: { contains: q.trim(), mode: 'insensitive' } },
        { problem: { contains: q.trim(), mode: 'insensitive' } },
      ],
    });
  }

  if (tag?.trim()) {
    filters.push({
      tags: { some: { tag: { name: { equals: tag.trim(), mode: 'insensitive' } } } },
    });
  }

  try {
    const where = filters.length > 0 ? { AND: filters } : undefined;
    const [prompts, tags] = await Promise.all([
      prisma.prompt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          tags: { include: { tag: true } },
          reactions: true,
          _count: { select: { comments: true } },
        },
      }),
      prisma.tag.findMany({ orderBy: { name: 'asc' } }),
    ]);

    const mapped = prompts.map((prompt) => {
      const reactionSummary = prompt.reactions.reduce(
        (acc, reaction) => ({
          ...acc,
          [reaction.type]: (acc[reaction.type] ?? 0) + 1,
        }),
        {},
      );

      const { reactions, ...rest } = prompt;

      return {
        ...rest,
        reactionSummary,
      };
    });

    return res.json({ prompts: mapped, tags });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load prompts' });
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
        systemText: systemText ?? '',
        promptText: promptText.trim(),
        inputText: inputText ?? '',
        outputText: aiResponse.text,
        model: model ?? 'gpt-4o',
        temperature: typeof temperature === 'number' ? temperature : 0.2,
        maxTokens: typeof maxTokens === 'number' ? maxTokens : 512,
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

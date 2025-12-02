import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import path from 'node:path';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;
const rootDir = process.cwd();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(express.json());
app.get('/lab/:id', (req, res) => {
  return res.sendFile(path.join(rootDir, 'lab.html'));
});
app.use(express.static(rootDir));

app.get('/api/prompts', async (req, res) => {
  try {
    const prompts = await prisma.prompt.findMany({ orderBy: { createdAt: 'desc' }, include: promptInclude });
    return res.json(prompts);
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
    const prompt = await prisma.prompt.findUnique({ where: { id: promptId }, include: promptInclude });
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
    return res.json(prompt);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unexpected error retrieving prompt' });
  }
});

app.post('/api/prompts', async (req, res) => {
  const { title, problem, context, promptText, exampleInput = '', exampleOutput = '', reflection = '', tags = [], user } =
    req.body ?? {};
  if (!title?.trim() || !problem?.trim() || !context?.trim() || !promptText?.trim()) {
    return res.status(400).json({ error: 'Title, problem, context, and prompt text are required.' });
  }
  try {
    const actor = await ensureUser(user);
    const normalizedTags = normalizeTagNames(tags);
    const prompt = await prisma.prompt.create({
      data: {
        title: title.trim(),
        problem: problem.trim(),
        context: context.trim(),
        promptText: promptText.trim(),
        exampleInput: exampleInput?.trim() ?? '',
        exampleOutput: exampleOutput?.trim() ?? '',
        reflection: reflection?.trim() || null,
        authorId: actor.id,
        tags: {
          create: normalizedTags.map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName },
              },
            },
          })),
        },
      },
      include: promptInclude,
    });
    return res.status(201).json(prompt);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create prompt' });
  }
});

const DEFAULT_SANDBOX_USER = {
  email: 'casey@tracknamic.com',
  name: 'Casey Demo',
};

const promptInclude = {
  author: true,
  tags: { include: { tag: true } },
  reactions: true,
  comments: { include: { user: true } },
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

function normalizeTagNames(tags = []) {
  return Array.from(
    new Set(
      (tags || [])
        .map((tag) => (typeof tag === 'string' ? tag : String(tag || '')))
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
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
      include: promptInclude,
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

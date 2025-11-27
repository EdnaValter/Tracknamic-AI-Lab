import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

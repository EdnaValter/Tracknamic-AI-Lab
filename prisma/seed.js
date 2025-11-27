import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice Example',
      email: 'alice@example.com',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      name: 'Bob Example',
      email: 'bob@example.com',
    },
  });

  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'typescript' },
      update: {},
      create: { name: 'typescript' },
    }),
    prisma.tag.upsert({
      where: { name: 'testing' },
      update: {},
      create: { name: 'testing' },
    }),
    prisma.tag.upsert({
      where: { name: 'prompting' },
      update: {},
      create: { name: 'prompting' },
    }),
  ]);

  const [typescriptTag, testingTag, promptingTag] = tags;

  await prisma.prompt.create({
    data: {
      title: 'Summarize a pull request',
      problem: 'Summaries are inconsistent across reviewers.',
      context: 'Engineers need a quick recap of changes without reading the full diff.',
      promptText:
        'You are a release notes assistant. Summarize the PR in three bullet points and call out risks.',
      exampleInput: 'PR: Adds user onboarding flow with email verification.',
      exampleOutput: '- Added onboarding screens...\n- Email verification implemented...\n- Risk: delayed email delivery.',
      reflection: 'Mention risks explicitly and stay concise.',
      authorId: alice.id,
      tags: {
        create: [
          { tag: { connect: { id: typescriptTag.id } } },
          { tag: { connect: { id: promptingTag.id } } },
        ],
      },
      reactions: {
        create: [{ type: 'LIKE', user: { connect: { id: bob.id } } }],
      },
      comments: {
        create: [
          {
            body: 'Love this structure for release notes.',
            user: { connect: { id: bob.id } },
          },
        ],
      },
    },
  });

  await prisma.prompt.create({
    data: {
      title: 'Write a unit test',
      problem: 'Developers skip edge cases in tests.',
      context: 'Prompt ensures we capture boundary conditions for API handlers.',
      promptText:
        'Given the API contract, produce Jest unit tests that cover happy path and edge cases.',
      exampleInput: 'POST /login expects email + password, returns JWT on success.',
      exampleOutput: 'Should return 200 with token... Should return 400 when missing email... etc.',
      reflection: 'Ask for mocks when external dependencies exist.',
      authorId: bob.id,
      tags: {
        create: [{ tag: { connect: { id: testingTag.id } } }],
      },
      reactions: {
        create: [{ type: 'BOOKMARK', user: { connect: { id: alice.id } } }],
      },
      comments: {
        create: [
          {
            body: 'Add examples for auth failures.',
            user: { connect: { id: alice.id } },
          },
        ],
      },
    },
  });

  await prisma.sandboxRun.create({
    data: {
      userId: alice.id,
      promptText: 'Reverse a linked list',
      inputText: '[1,2,3,4]',
      outputText: '[4,3,2,1]',
    },
  });

  await prisma.sandboxRun.create({
    data: {
      userId: bob.id,
      promptText: 'Summarize product updates',
      inputText: 'New login flow and dashboard tweaks',
      outputText: 'Users can log in with email; dashboard cards reorganized.',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

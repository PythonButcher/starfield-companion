import prisma from './prisma';

export async function getAllLogs() {
  return prisma.expeditionLog.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createLog({ title, planetName, rawNotes, aiNarrative }) {
  if (!title || !planetName || !rawNotes || !aiNarrative) {
    throw new Error('Missing required fields');
  }

  return prisma.expeditionLog.create({
    data: {
      title,
      planetName,
      rawNotes,
      aiNarrative,
    },
  });
}

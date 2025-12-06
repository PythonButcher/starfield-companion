import prisma from './prisma';

// Fetch all logs sorted by most recent
export async function getAllLogs() {
  return prisma.expeditionLog.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

// Create a new log entry with required fields
export async function createLog({ title, planetName, rawNotes, aiNarrative }) {
  if (!title || !planetName) {
    throw new Error('title and planetName are required');
  }

  return prisma.expeditionLog.create({
    data: {
      title,
      planetName,
      rawNotes: rawNotes || '',
      aiNarrative: aiNarrative || '',
    },
  });
}

const journalHandler = {
    id: 'journal-import',

    canHandle(payload, context) {
        return Boolean(
            payload &&
            payload.type === 'text' &&
            context &&
            context.route === '/journal'
        );
    },

    handle(payload, context) {
        const raw = (payload && (payload.text ?? payload.raw ?? payload.content)) || '';
        // Dumbest possible split: split by any newline, trim and drop empty lines
        const entries = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        console.log('Parsed journal entries:', entries);
        return { entries };
    }
};

export default journalHandler;
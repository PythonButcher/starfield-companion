import { logs } from '../../api/logs';
export default {
  id: 'journal-text',
  canHandle: (payload) => payload.type === 'text' || (payload.type === 'files' && payload.files.every((file) => /\.(txt|md)$/i.test(file.name))),
  async handle(payload) {
    const texts = payload.type === 'text' ? [payload.text] : await Promise.all(payload.files.map((file) => file.text()));
    const text = texts.join('\n\n').trim();
    if (!text || text.length > 30000) throw new Error('Text must contain 1–30,000 characters.');
    const log = await logs.create({ title: text.split(/\r?\n/)[0].slice(0, 100), raw_notes: text, tags: ['imported'] });
    return { message: 'Journal entry imported: ' + log.title, log };
  },
};

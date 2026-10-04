import { crew } from '../../api/crew';
export default {
  id: 'crew-assignment',
  canHandle: (payload) => payload.type === 'crew',
  async handle(payload, context) {
    if (!Number.isInteger(payload.id) || !['ship', 'outpost', 'unassigned'].includes(context.target)) throw new Error('Invalid crew assignment.');
    const name = context.name?.trim();
    if (context.target !== 'unassigned' && !name) throw new Error('Enter a ship or outpost name first.');
    return crew.update(payload.id, {
      assigned_ship: context.target === 'ship' ? name : '',
      assigned_outpost: context.target === 'outpost' ? name : '',
    });
  },
};

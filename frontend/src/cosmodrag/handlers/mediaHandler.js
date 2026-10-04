import { media, uploadMedia } from '../../api/media';
export default {
  canHandle: (payload, context) => context.media && (payload.file || payload.mediaId),
  handle: (payload, context) => payload.mediaId
    ? media.update(Number(payload.mediaId), context.associations || {})
    : uploadMedia(payload.file, context.associations, context.progress),
};

import { crud, mediaUrl, ApiError } from './client';
export const media = crud('/api/media');

/** XHR exposes actual upload progress; the browser owns multipart boundaries. */
export function uploadMedia(file, associations = {}, progress = () => {}) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    Object.entries(associations).forEach(([key, value]) => {
      if (value != null) form.append(key, key === 'tags' ? JSON.stringify(value) : value);
    });
    const xhr = new XMLHttpRequest();
    xhr.open('POST', mediaUrl('/api/media'));
    xhr.timeout = 60000;
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) progress(Math.round(event.loaded / event.total * 100)); };
    xhr.onerror = xhr.ontimeout = () => reject(new ApiError('Upload interrupted. Please retry.'));
    xhr.onload = () => {
      let data;
      try { data = JSON.parse(xhr.responseText); } catch { reject(new ApiError('Unreadable upload response.')); return; }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(data?.error?.message || 'Upload failed.', xhr.status));
    };
    xhr.send(form);
  });
}

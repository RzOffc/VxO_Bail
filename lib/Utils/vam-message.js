/* Rich message builders ported from VamTzy/Baileys-fixed 1.0.0 (MIT). Output is plain native Baileys payloads. */
function formatRichText({ title, body = '', footer = '' } = {}) {
  for (const [key, value] of Object.entries({ title, body, footer })) {
    if (value !== undefined && typeof value !== 'string') {
      throw new TypeError(`${key} harus berupa string.`);
    }
  }

  const parts = [];
  if (title?.trim()) parts.push(`*${title.trim()}*`);
  if (body.trim()) parts.push(body.trim());
  if (footer.trim()) parts.push(`_${footer.trim()}_`);
  if (parts.length === 0) throw new TypeError('RichMessage membutuhkan title, body, atau footer.');
  return parts.join('\n\n');
}

/**
 * RichMessage builds richly formatted native Baileys text or image-caption
 * payloads. It is not a custom WhatsApp interactive-card wire protocol.
 */
export const RichMessage = Object.freeze({
  text({ title, body = '', footer = '', ...options } = {}) {
    return { ...options, text: formatRichText({ title, body, footer }) };
  },

  image({ image, title, body = '', footer = '', ...options } = {}) {
    if (image === undefined || image === null) throw new TypeError('RichMessage.image() membutuhkan image.');
    return { ...options, image, caption: formatRichText({ title, body, footer }) };
  }
});

/** Unified VamTzy builder; every returned object matches a native Baileys payload shape. */
export const VamMessage = Object.freeze({
  text(text, options = {}) {
    if (typeof text !== 'string') throw new TypeError('VamMessage.text() membutuhkan string.');
    return { ...options, text };
  },

  richText(input = {}) {
    return RichMessage.text(input);
  },

  rich(input = {}) {
    return input.image === undefined ? RichMessage.text(input) : RichMessage.image(input);
  },

  image(image, options = {}) {
    if (image === undefined || image === null) throw new TypeError('VamMessage.image() membutuhkan image.');
    return { ...options, image };
  },

  video(video, options = {}) {
    if (video === undefined || video === null) throw new TypeError('VamMessage.video() membutuhkan video.');
    return { ...options, video };
  },

  audio(audio, options = {}) {
    if (audio === undefined || audio === null) throw new TypeError('VamMessage.audio() membutuhkan audio.');
    return { ...options, audio };
  },

  document(document, options = {}) {
    if (document === undefined || document === null) throw new TypeError('VamMessage.document() membutuhkan dokumen.');
    return { ...options, document };
  },

  sticker(sticker, options = {}) {
    if (sticker === undefined || sticker === null) throw new TypeError('VamMessage.sticker() membutuhkan sticker.');
    return { ...options, sticker };
  },

  location(degreesLatitude, degreesLongitude, options = {}) {
    if (!Number.isFinite(degreesLatitude) || degreesLatitude < -90 || degreesLatitude > 90) {
      throw new RangeError('Latitude harus berada di antara -90 dan 90.');
    }
    if (!Number.isFinite(degreesLongitude) || degreesLongitude < -180 || degreesLongitude > 180) {
      throw new RangeError('Longitude harus berada di antara -180 dan 180.');
    }
    return { ...options, location: { ...(options.location ?? {}), degreesLatitude, degreesLongitude } };
  },

  contact(displayName, vcard, options = {}) {
    if (typeof displayName !== 'string' || typeof vcard !== 'string' || !vcard.trim()) {
      throw new TypeError('VamMessage.contact() membutuhkan displayName dan vCard string.');
    }
    return { ...options, contacts: { displayName, contacts: [{ vcard }] } };
  },

  poll(name, values, selectableCount = 1, options = {}) {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('Nama poll wajib diisi.');
    if (!Array.isArray(values) || values.length < 2 || values.some(value => typeof value !== 'string' || !value.trim())) {
      throw new TypeError('Poll membutuhkan minimal dua opsi string yang valid.');
    }
    if (!Number.isInteger(selectableCount) || selectableCount < 1 || selectableCount > values.length) {
      throw new RangeError('selectableCount harus berada di antara 1 dan jumlah opsi.');
    }
    return { ...options, poll: { name, values: [...values], selectableCount } };
  },

  reaction(key, text, options = {}) {
    if (!key || typeof key !== 'object' || Array.isArray(key)) throw new TypeError('Reaction membutuhkan message key.');
    if (typeof text !== 'string') throw new TypeError('Reaction text harus berupa string.');
    return { ...options, react: { key, text } };
  },

  forward(message, { force, ...options } = {}) {
    if (!message || typeof message !== 'object' || !message.key || !message.message) {
      throw new TypeError('VamMessage.forward() membutuhkan WAMessage lengkap dari Baileys.');
    }
    return { ...options, forward: message, ...(force === undefined ? {} : { force: Boolean(force) }) };
  }
});

export const vamMessage = VamMessage;

export function buildVamMessage(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw new TypeError('Konten VamMessage harus berupa object payload Baileys.');
  }
  return { ...content };
}

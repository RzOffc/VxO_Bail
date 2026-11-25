# Rich message (VamTzy builders on LyncxTeams Baileys)

Builders ported from vamtzy-baileys-fixed 1.0.0. Output is plain native Baileys payloads.

```js
import makeWASocket, { RichMessage, VamMessage } from '@silent404/baileys'

// shortcut on the socket
await sock.sendRich(jid, { title: 'Judul', body: 'Isi', footer: 'Kaki' })
await sock.sendRich(jid, { image: { url }, title: 'Judul', body: 'Isi' }, { quoted: m })

// or build the payload yourself
await sock.sendMessage(jid, RichMessage.text({ title: 'A', body: 'B' }))
await sock.sendMessage(jid, VamMessage.poll('Pilih', ['A', 'B'], 1))
```

Available: RichMessage.text/image; VamMessage.text/richText/rich/image/video/audio/document/sticker/location/contact/poll/reaction/forward; buildVamMessage.
Not included from VamTzy: auto-follow channels, boot banner, queued sender.

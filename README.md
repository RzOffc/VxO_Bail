# VxO Bail

Library WhatsApp Web untuk Node.js, dikelola oleh **Riyns**.
Satu paket berisi koneksi multi-device, builder pesan interaktif, rich message, dan utilitas channel/grup.

- Node.js 20 ke atas
- ESM (`"type": "module"`)
- Login lewat QR atau kode pairing

---

## Daftar isi

1. [Pemasangan](#pemasangan)
2. [Koneksi dasar](#koneksi-dasar)
3. [Kode pairing](#kode-pairing)
4. [Penyimpanan sesi](#penyimpanan-sesi)
5. [Menerima pesan](#menerima-pesan)
6. [Mengirim pesan](#mengirim-pesan)
7. [relayMessage](#relaymessage)
8. [Rich message](#rich-message)
9. [Button, list, carousel, AIRich](#button-list-carousel-airich)
10. [Grup](#grup)
11. [Channel (newsletter)](#channel-newsletter)
12. [Contoh bot lengkap](#contoh-bot-lengkap)
13. [Tips Pterodactyl](#tips-pterodactyl)
14. [Kredit dan lisensi](#kredit-dan-lisensi)

---

## Pemasangan

Dari GitHub (repo harus public):

```
npm install git+https://github.com/RzOffc/VxO_Bail.git
```

Atau lewat `package.json` dengan alias, supaya `import` di kodemu tidak perlu diubah:

```json
{
  "dependencies": {
    "@silent404/baileys": "git+https://github.com/RzOffc/VxO_Bail.git"
  }
}
```

Atau dari folder lokal:

```json
"@silent404/baileys": "file:./baileys-rich"
```

Pakai URL **HTTPS**. Jangan pakai `ssh://` atau `github:`, karena server tanpa SSH key akan gagal dengan error git code 128.

Paket media opsional (hanya kalau kamu butuh thumbnail, stiker, atau audio):

```
npm install sharp jimp link-preview-js audio-decode
```

---

## Koneksi dasar

```js
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@silent404/baileys'
import pino from 'pino'

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') console.log('Tersambung')
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code !== DisconnectReason.loggedOut) start()
      else console.log('Sesi ter-logout, hapus folder session lalu login ulang')
    }
  })

  return sock
}

start()
```

Opsi socket yang sering dipakai:

| Opsi | Fungsi |
|---|---|
| `auth` | wajib, state dari penyimpanan sesi |
| `logger` | logger pino |
| `browser` | nama yang tampil di Perangkat Tertaut |
| `markOnlineOnConnect` | `false` supaya notifikasi di HP tetap muncul |
| `syncFullHistory` | `false` untuk bot yang tidak butuh riwayat |
| `getMessage` | sediakan pesan lama supaya kirim ulang berhasil |
| `connectTimeoutMs` | batas waktu handshake |

---

## Kode pairing

Login tanpa scan QR. Panggil setelah socket dibuat dan hanya kalau belum terdaftar:

```js
if (!sock.authState.creds.registered) {
  const code = await sock.requestPairingCode('6281234567890')
  console.log('Kode pairing:', code)
}
```

Nomor dalam format internasional tanpa `+` dan tanpa awalan `0`. Di WhatsApp buka **Perangkat tertaut**, **Tautkan dengan nomor telepon**, lalu masukkan kodenya.

---

## Penyimpanan sesi

Semuanya mengembalikan bentuk `{ state, saveCreds }` yang sama.

| Fungsi | Penyimpanan |
|---|---|
| `useMultiFileAuthState(folder)` | banyak file di satu folder (bawaan) |
| `useSingleFileAuthState(file)` | satu file |
| `useSqliteAuthState(...)` | SQLite |
| `usePostgresAuthState(...)` | PostgreSQL |
| `useMySQLAuthState(...)` | MySQL |
| `useMongoAuthState(...)` | MongoDB |
| `useRedisAuthState(...)` | Redis |
| `useNekoDBAuth(...)` | NekoDB |

Folder `session` berisi kunci akunmu. Jangan di-commit ke GitHub dan jangan dibagikan.

---

## Menerima pesan

```js
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return
  const m = messages[0]
  if (!m?.message || m.key.fromMe) return

  const jid = m.key.remoteJid
  const text =
    m.message.conversation ||
    m.message.extendedTextMessage?.text ||
    m.message.imageMessage?.caption ||
    m.message.videoMessage?.caption ||
    ''

  console.log(jid, text)
})
```

---

## Mengirim pesan

Semua contoh memakai `sock.sendMessage(jid, isi, opsi)`.

Teks:

```js
await sock.sendMessage(jid, { text: 'Halo' })
```

Balas (quote) pesan:

```js
await sock.sendMessage(jid, { text: 'Balasan' }, { quoted: m })
```

Mention:

```js
await sock.sendMessage(jid, {
  text: 'Halo @6281234567890',
  mentions: ['6281234567890@s.whatsapp.net']
})
```

Gambar, video, dokumen:

```js
await sock.sendMessage(jid, { image: { url: 'https://example.com/a.jpg' }, caption: 'Gambar' })
await sock.sendMessage(jid, { video: { url: 'https://example.com/a.mp4' }, caption: 'Video' })
await sock.sendMessage(jid, {
  document: { url: 'https://example.com/a.pdf' },
  fileName: 'dokumen.pdf',
  mimetype: 'application/pdf'
})
```

Lokasi:

```js
await sock.sendMessage(jid, {
  location: { degreesLatitude: -6.2, degreesLongitude: 106.816666, name: 'Jakarta' }
})
```

Poll:

```js
await sock.sendMessage(jid, {
  poll: { name: 'Pilih satu', values: ['A', 'B', 'C'], selectableCount: 1 }
})
```

Reaksi:

```js
await sock.sendMessage(jid, { react: { text: '👍', key: m.key } })
```

Mengunduh media dari pesan masuk:

```js
import { downloadMediaMessage } from '@silent404/baileys'

const buffer = await downloadMediaMessage(m, 'buffer', {})
```

---

## relayMessage

`sock.relayMessage` mengirim isi protobuf mentah. `sendMessage` dan `sendRich` sudah memanggilnya sendiri, jadi pakai langsung hanya untuk payload yang tidak dikenali `sendMessage`.

```js
sock.relayMessage(jid, message, {
  messageId,            // ID pesan, disarankan diisi
  participant,
  additionalAttributes,
  additionalNodes,
  useUserDevicesCache,
  useCachedGroupMetadata,
  addBizAttributes,
  statusJidList
})
```

Argumen ketiga wajib ada, minimal `{}`. `message` dibuat dulu dengan `generateWAMessageFromContent`:

```js
import { generateWAMessageFromContent } from '@silent404/baileys'

const msg = generateWAMessageFromContent(jid, {
  extendedTextMessage: { text: 'Halo lewat relay' }
}, { userJid: sock.user.id })

await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
```

`AIRich` memakai `relayMessage` sendiri di balik `.send(jid)`, jadi tidak perlu dipanggil manual.

---

## Rich message

Builder untuk pesan berformat: judul tebal, isi, dan footer miring. Hasilnya payload Baileys biasa, jadi bisa dipakai di mana saja.

Jalan pintas di socket:

```js
await sock.sendRich(jid, { title: 'Judul', body: 'Isi pesan', footer: 'Kaki' })

await sock.sendRich(
  jid,
  { image: { url: 'https://example.com/a.jpg' }, title: 'Judul', body: 'Isi' },
  { quoted: m }
)
```

Dengan builder:

```js
import { RichMessage, VamMessage } from '@silent404/baileys'

await sock.sendMessage(jid, RichMessage.text({ title: 'A', body: 'B', footer: 'C' }))
await sock.sendMessage(jid, RichMessage.image({ image: { url }, title: 'A', body: 'B' }))
await sock.sendMessage(jid, VamMessage.poll('Pilih', ['A', 'B'], 1))
await sock.sendMessage(jid, VamMessage.location(-6.2, 106.8))
```

Daftar builder `VamMessage`:

| Method | Isi |
|---|---|
| `text(text)` | teks biasa |
| `richText({ title, body, footer })` | teks berformat |
| `rich({ ... })` | otomatis teks atau gambar, tergantung ada `image` atau tidak |
| `image(image)`, `video(video)`, `audio(audio)` | media |
| `document(document)`, `sticker(sticker)` | dokumen dan stiker |
| `location(lat, lng)` | lokasi, dengan validasi rentang |
| `contact(nama, vcard)` | kontak |
| `poll(nama, opsi[], jumlahPilihan)` | poll |
| `reaction(key, emoji)` | reaksi |
| `forward(pesan)` | teruskan pesan |

`buildVamMessage(obj)` mengembalikan salinan payload setelah validasi bentuknya.

Builder melempar error yang jelas kalau input salah, misalnya `RichMessage.text({})` tanpa title, body, atau footer.

---

## Button, list, carousel, AIRich

Semua builder ada di `MB` dan dibuat dengan `new MB.NamaBuilder(sock)`, lalu diakhiri `.send(jid)`.

```js
import { MB } from '@silent404/baileys'
```

### Button

```js
await new MB.Button(sock)
  .setTitle('Menu')
  .setBody('Pilih salah satu.')
  .setFooter('VxO Bail')
  .addReply('Ping', 'ping')
  .addUrl('Website', 'https://example.com')
  .addCopy('Salin kode', 'KODE123')
  .send(jid)
```

Dengan gambar di header: tambahkan `.setImage('https://example.com/a.jpg')` sebelum `.send(jid)`.

Method lain: `addCall`, `addReminder`, `addCancelReminder`, `addAddress`, `addLocation`, `setVideo`, `setDocument`, `setMedia`.

### List (single select)

```js
await new MB.Button(sock)
  .setTitle('Menu')
  .setBody('Pilih satu menu.')
  .addSelection('Buka menu')
  .makeSection('Menu utama')
  .makeRow('', 'Profil', 'Buka profil', 'profile')
  .makeRow('', 'Pengaturan', 'Buka pengaturan', 'settings')
  .send(jid)
```

List hanya tampil di WhatsApp Android. Di Web dan iOS pesan jatuh ke kartu teks biasa.

### ButtonV2

```js
await new MB.ButtonV2(sock)
  .setTitle('Judul')
  .setSubtitle('Subjudul')
  .setBody('Pilih satu tindakan.')
  .setFooter('VxO Bail')
  .addButton('Menu', 'menu')
  .addButton('Ping', 'ping')
  .send(jid)
```

### Carousel

Setiap kartu wajib punya gambar atau video di header.

```js
const card1 = await new MB.Button(sock)
  .setImage('https://example.com/1.jpg')
  .setBody('Kartu pertama')
  .addReply('Pilih', 'card_1')
  .toCard()

const card2 = await new MB.Button(sock)
  .setImage('https://example.com/2.jpg')
  .setBody('Kartu kedua')
  .addUrl('Buka', 'https://example.com')
  .toCard()

await new MB.Carousel(sock)
  .setBody('Geser untuk melihat kartu.')
  .setFooter('VxO Bail')
  .addCard([card1, card2])
  .send(jid)
```

### AIRich

Respons rich dengan teks, kode, tabel, dan saran. `AIRich` dikirim lewat `.send(jid)` miliknya sendiri, bukan lewat `sock.sendMessage`.

```js
await new MB.AIRich(sock)
  .setTitle('VxO Bail')
  .setFooter('Dibuat dengan AIRich')
  .addText('Halo! Ini respons rich.')
  .addCode('javascript', "console.log('Halo')")
  .addTable([
    ['Fitur', 'Status'],
    ['Button', 'Tersedia'],
    ['Carousel', 'Tersedia']
  ])
  .addSuggest(['Lihat menu', 'Bantu aku'])
  .send(jid)
```

Penampilan pesan interaktif bergantung pada versi WhatsApp penerima. Kalau tidak muncul di satu perangkat, coba di perangkat lain sebelum menganggap kodenya salah.

---

## Grup

```js
const meta = await sock.groupMetadata(groupJid)
await sock.groupCreate('Nama Grup', ['6281234567890@s.whatsapp.net'])
await sock.groupParticipantsUpdate(groupJid, [userJid], 'add')      // add, remove, promote, demote
await sock.groupUpdateSubject(groupJid, 'Nama baru')
await sock.groupUpdateDescription(groupJid, 'Deskripsi baru')
await sock.groupSettingUpdate(groupJid, 'announcement')             // announcement, not_announcement, locked, unlocked
const code = await sock.groupInviteCode(groupJid)
await sock.groupAcceptInvite(code)
await sock.groupLeave(groupJid)
const semua = await sock.groupFetchAllParticipating()
```

Bot harus admin untuk mengubah peserta dan pengaturan grup.

---

## Channel (newsletter)

```js
const meta = await sock.newsletterMetadata('invite', 'KODE_INVITE')
await sock.newsletterFollow(meta.id)
await sock.newsletterCreate('Nama Channel', 'Deskripsi')
const pesan = await sock.newsletterFetchMessages('jid', meta.id, 10)
await sock.newsletterReactMessage(meta.id, serverId, '👍')
```

`KODE_INVITE` adalah bagian terakhir dari link `https://whatsapp.com/channel/KODE_INVITE`.

Method lain yang tersedia: `newsletterSubscribers`, `newsletterSubscribed`, `newsletterDirectorySearch`, `newsletterRecommended`, `newsletterPinMessages`, `newsletterDelete`, `newsletterChangeOwner`.

---

## Contoh bot lengkap

```js
import makeWASocket, { useMultiFileAuthState, DisconnectReason, MB } from '@silent404/baileys'
import pino from 'pino'

const PREFIX = '.'

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') console.log('Bot online')
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code !== DisconnectReason.loggedOut) start()
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    const m = messages[0]
    if (!m?.message || m.key.fromMe) return

    const jid = m.key.remoteJid
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
    if (!text.startsWith(PREFIX)) return

    const [cmd, ...args] = text.slice(PREFIX.length).trim().split(/\s+/)

    switch (cmd.toLowerCase()) {
      case 'ping':
        await sock.sendMessage(jid, { text: 'Pong!' }, { quoted: m })
        break

      case 'rich':
        await sock.sendRich(jid, {
          title: 'VxO Bail',
          body: args.join(' ') || 'Halo dari rich message',
          footer: 'by Riyns'
        })
        break

      case 'menu':
        await new MB.Button(sock)
          .setTitle('Menu')
          .setBody('Pilih salah satu.')
          .addReply('Ping', '.ping')
          .addReply('Rich', '.rich')
          .send(jid)
        break
    }
  })
}

start()
```

---

## Tips Pterodactyl

- Startup Command: `npm install && node index.js`.
- Kalau install gagal, hapus `package-lock.json` dan folder `node_modules`, lalu restart.
- Sesi tersimpan di folder `session`. Jangan dihapus kecuali mau login ulang.
- Pakai alamat HTTPS untuk dependensi GitHub, bukan SSH.
- Bot mati setelah pesan `ERR_MODULE_NOT_FOUND`: berarti paket belum terpasang, cek log `npm install` di bagian atas console.

---

## Kredit dan lisensi

VxO Bail dikelola oleh **Riyns**.

Paket ini adalah distribusi turunan dan memuat kode dari proyek lain yang berlisensi MIT:

- Baileys oleh WhiskeySockets dan kontributornya
- `@whiskey-sockets/baileys` oleh LyncxTeams, sebagai dasar paket ini
- Builder rich message dari `richmessage official` 

Teks lisensi MIT ada di file `LICENSE` dan wajib tetap menyertai paket ini.

Library ini tidak berafiliasi dengan WhatsApp atau Meta. Memakai bot di akun pribadi punya risiko akun dibatasi atau diblokir, jadi pakai dengan bijak dan jangan untuk spam.

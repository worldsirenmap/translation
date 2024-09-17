import Client from 'ssh2-sftp-client'
import { readdirSync, writeFileSync, createReadStream } from 'fs';


const TRANSLATIONS_REMOTE_PATH = "/assets/translations/"
const TRANSLATIONS_DIR = './../translations/'

const PUT_OPTIONS = {
    writeStreamOptions: {
      mode: 0o664
  }}

const sftp = new Client()

console.log("Connect to SFTP server")
await sftp.connect({
    type: 'publickey',
    host: process.env.SFTP_HOST,
    username: process.env.SFTP_USER,
    privateKey : process.env.SFTP_PRIVATE_KEY
})

await sftp.mkdir(TRANSLATIONS_REMOTE_PATH, true)

const currentDirs = await sftp.list(TRANSLATIONS_REMOTE_PATH)
for (const dir of currentDirs) {
    console.log("Remove old data for language '" + dir.name + "'")
    await sftp.rmdir(ICONS_REMOTE_PATH + dir.name, true)
}

console.log("Upload Translations")
const languages = readdirSync(TRANSLATIONS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())

for (const language of languages) {
    await sftp.mkdir(TRANSLATIONS_REMOTE_PATH + language, true)

    const languageFiles = readdirSync(TRANSLATIONS_DIR + language, { withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))

    for (file of languageFiles) {
        console.log("Upload file '" + file.name + "' for language '" + language + "'")
        await sftp.put(createReadStream(TRANSLATIONS_DIR + language + "/" + file.name), TRANSLATIONS_DIR + language + "/" + file.name, PUT_OPTIONS)
    }
}

console.log("Closing connection")
sftp.end()
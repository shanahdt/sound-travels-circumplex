/**
 * Sound Travels — Google Drive data receiver (replaces jsPsych DataPipe → OSF).
 *
 * Deploy as a Google Apps Script *Web app* (Execute as: Me, Who has access: Anyone).
 * The study posts { token, filename, data } as text/plain JSON; this script writes
 * `data` to `filename` inside FOLDER_ID, overwriting any earlier save for the same
 * participant (the study saves on debrief, on finish, and on tab close).
 *
 * Setup: see README section "Data collection (Google Drive)".
 */

// ID of the Drive folder that should receive the CSVs (the part after /folders/ in its URL).
const FOLDER_ID = '1pdjVKMHS4NsEZ6syKhTs1r8Q1IktvbDC';

// Must match DATA_TOKEN in js/config.js. Not a real secret (it ships in the page),
// but it stops random POSTs to the URL from landing files in your Drive.
const TOKEN = '3sgon_f8CRW5vy-iuGI0KzwM';

const MAX_BYTES = 5 * 1024 * 1024;
const FILENAME_RE = /^[A-Za-z0-9_.-]{1,100}\.csv$/;

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) return reply_({ ok: false, error: 'bad token' });
    if (!FILENAME_RE.test(body.filename || '')) return reply_({ ok: false, error: 'bad filename' });
    if (typeof body.data !== 'string' || body.data.length > MAX_BYTES) {
      return reply_({ ok: false, error: 'bad data' });
    }

    // Serialise writes so near-simultaneous saves for one participant can't create duplicates.
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const existing = folder.getFilesByName(body.filename);
      if (existing.hasNext()) {
        const file = existing.next();
        // Never replace a longer save with a shorter one (e.g. a late beforeunload
        // firing with partial data after the full save already landed).
        if (body.data.length >= file.getSize()) file.setContent(body.data);
      } else {
        folder.createFile(body.filename, body.data, MimeType.CSV);
      }
    } finally {
      lock.releaseLock();
    }
    return reply_({ ok: true });
  } catch (err) {
    return reply_({ ok: false, error: String(err) });
  }
}

// Visiting the URL in a browser confirms the deployment is live.
function doGet() {
  return reply_({ ok: true, service: 'sound-travels-drive-receiver' });
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run once from the editor to grant Drive permission and test that the folder is writable.
function testWrite() {
  DriveApp.getFolderById(FOLDER_ID).createFile('test_delete_me.csv', 'a,b\n1,2\n', MimeType.CSV);
}

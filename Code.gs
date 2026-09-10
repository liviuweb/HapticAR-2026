/**
 * Backend für die Terminbuchung »Defekte spüren«.
 * Schreibt in das Google Sheet, in dem dieses Skript liegt.
 * Einrichtung siehe README.md.
 */

/* ── ANPASSEN ─────────────────────────────────────────────── */
var TEAM_MAIL   = "BITTE-EINTRAGEN@smail.th-koeln.de";  // bekommt jede Buchung gemeldet
var TREFFPUNKT  = "Haupteingang der TH Köln, Campus Gummersbach";
var ABLAUF_MIN  = 35;

// Muss zu CONFIG.tage in index.html passen. Nur diese Slots sind buchbar.
var SLOTS = {
  "2026-09-14": ["10:00", "11:00", "12:00", "13:30", "14:30", "15:30"],
  "2026-09-15": ["10:00", "11:00", "12:00", "13:30", "14:30", "15:30"],
  "2026-09-16": ["10:00", "11:00", "12:00", "13:30", "14:30", "15:30"]
};

var WOCHENTAG = {
  "2026-09-14": "Montag, 14. September",
  "2026-09-15": "Dienstag, 15. September",
  "2026-09-16": "Mittwoch, 16. September"
};
/* ─────────────────────────────────────────────────────────── */

var TAB = "Buchungen";

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TAB);
  if (!sh) {
    sh = ss.insertSheet(TAB);
    sh.appendRow(["Slot", "Datum", "Uhrzeit", "Name", "E-Mail", "Gebucht am", "Status"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function belegt_() {
  var sh = sheet_();
  if (sh.getLastRow() < 2) return [];
  var werte = sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues();
  var raus = [];
  for (var i = 0; i < werte.length; i++) {
    if (String(werte[i][6]).toLowerCase() !== "abgesagt") raus.push(String(werte[i][0]));
  }
  return raus;
}

function gueltig_(slot) {
  var t = String(slot).split("|");
  if (t.length !== 2) return false;
  return !!SLOTS[t[0]] && SLOTS[t[0]].indexOf(t[1]) !== -1;
}

function antwort_(daten, callback) {
  var json = JSON.stringify(daten);
  if (callback && /^[\w$]+$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Lesen ── */
function doGet(e) {
  var p = (e && e.parameter) || {};
  return antwort_({ ok: true, belegt: belegt_() }, p.callback);
}

/* ── Buchen ── */
function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); }
  catch (err) { return antwort_({ ok: false, error: "bad_request" }); }

  var slot = String(d.slot || "");
  var name = String(d.name || "").trim().slice(0, 80);
  var mail = String(d.mail || "").trim().slice(0, 120);

  if (!gueltig_(slot))                          return antwort_({ ok: false, error: "unknown_slot" });
  if (name.length < 2)                          return antwort_({ ok: false, error: "bad_name" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return antwort_({ ok: false, error: "bad_mail" });

  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); }
  catch (err) { return antwort_({ ok: false, error: "busy" }); }

  try {
    if (belegt_().indexOf(slot) !== -1) {
      return antwort_({ ok: false, error: "taken", belegt: belegt_() });
    }

    var teile = slot.split("|");
    sheet_().appendRow([slot, teile[0], teile[1], name, mail, new Date(), "gebucht"]);

    var wann = (WOCHENTAG[teile[0]] || teile[0]) + ", " + teile[1] + " Uhr";
    mailen_(mail, name, wann);
    if (TEAM_MAIL.indexOf("BITTE") === -1) {
      MailApp.sendEmail(TEAM_MAIL, "Neue Buchung: " + wann,
        name + " (" + mail + ")\n" + wann + "\n" + TREFFPUNKT);
    }

    return antwort_({ ok: true, belegt: belegt_() });
  } catch (err) {
    return antwort_({ ok: false, error: "server" });
  } finally {
    lock.releaseLock();
  }
}

function mailen_(an, name, wann) {
  var text =
    "Hallo " + name + ",\n\n" +
    "Ihr Termin für die Studie »Defekte spüren« ist gebucht:\n\n" +
    "  " + wann + "\n" +
    "  " + TREFFPUNKT + "\n" +
    "  Wir holen Sie dort ab. Bitte seien Sie ein paar Minuten vorher da.\n" +
    "  Dauer: ca. " + ABLAUF_MIN + " Minuten\n\n" +
    "Sie brauchen nichts mitzubringen und keine Vorkenntnisse.\n\n" +
    "Wenn Sie nicht können, antworten Sie einfach auf diese Mail – dann wird der Termin frei.\n\n" +
    "Name und E-Mail nutzen wir ausschließlich für die Terminabstimmung und löschen sie nach der Erhebung. " +
    "Die Studiendaten selbst werden anonym erhoben.\n\n" +
    "Viele Grüße\n" +
    "Mahyar Aghazadeh, Livius Kahlo, Joash Koshan\n" +
    "TH Köln, Medieninformatik";

  MailApp.sendEmail({
    to: an,
    subject: "Ihr Termin: " + wann + " – Studie »Defekte spüren«",
    body: text,
    name: "Studie Defekte spüren, TH Köln"
  });
}

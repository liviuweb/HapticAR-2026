# Terminbuchung »Defekte spüren«

Statische Seite auf GitHub Pages, Buchungen landen in einem Google Sheet.
Kein Server, keine Kosten, keine Anmeldung für Teilnehmende.

Für Teilnehmende: QR scannen → Uhrzeit antippen → Name und E-Mail → fertig.
Etwa 20 Sekunden. Bestätigungsmail kommt automatisch.

## 1. Backend (15 Minuten, einmalig)

1. Neues Google Sheet anlegen, z. B. „Studie – Buchungen“.
2. Darin **Erweiterungen → Apps Script**.
3. Inhalt von `apps-script/Code.gs` einfügen und den Block oben anpassen:
   `TEAM_MAIL`, `TREFFPUNKT`, und `SLOTS`/`WOCHENTAG`, falls ihr die Zeiten ändert.
4. **Bereitstellen → Neue Bereitstellung → Web-App**
   - Ausführen als: **Ich**
   - Zugriff: **Alle** (nicht „Alle mit Google-Konto“ – sonst kommt niemand rein)
5. Beim ersten Mal Berechtigungen bestätigen. Die Warnung „App nicht überprüft“
   über **Erweitert → Weiter zu …** durchklicken – das ist euer eigenes Skript.
6. Die URL kopieren, sie endet auf `/exec`.

Wichtig: Nach **jeder** Änderung an `Code.gs` erneut bereitstellen
(Bereitstellen → Bereitstellungen verwalten → Stift → Version: Neu).
Sonst läuft weiter die alte Fassung.

## 2. Seite anpassen

In `index.html` ganz oben im `CONFIG`-Block:

- `apiUrl` → die `/exec`-URL aus Schritt 6
- `kontaktName`, `kontaktMail` → Pflicht, siehe unten
- `treffpunkt` → genauer Treffpunkt am Haupteingang
- `tage` → nur ändern, wenn ihr andere Zeiten wollt (dann auch in `Code.gs`)

Solange `apiUrl` leer ist, läuft die Seite im Testmodus: alles frei, nichts wird gespeichert.
Gut zum Anschauen, bevor das Backend steht.

## 3. Auf GitHub Pages

1. Neues öffentliches Repo, `index.html` ins Hauptverzeichnis.
2. **Settings → Pages → Source: Deploy from a branch**, Branch `main`, Ordner `/ (root)`.
3. Nach ein bis zwei Minuten läuft die Seite unter
   `https://BENUTZERNAME.github.io/REPO-NAME/`

## 4. QR-Code

Die URL ist lang – kürzt sie vorher, das macht den Code deutlich grober und damit
aus Distanz und bei schlechtem Licht besser scannbar. Danach QR-Code als **SVG oder PDF**
erzeugen, nicht als PNG, sonst wird er beim Drucken matschig.

Fürs Aushängen: Code mindestens 4 × 4 cm, darunter die URL im Klartext
(manche scannen nicht, tippen aber ab), und ein Satz dazu, worum es geht.
Ein QR-Code allein an der Wand wird selten gescannt.

## 5. Am Studientag

Das Sheet ist die Teilnahmeliste. Spalte **Status** von `gebucht` auf `abgesagt`
setzen gibt den Termin auf der Website wieder frei – Zeile nicht löschen.

Nach der Erhebung: Spalten **Name** und **E-Mail** löschen. Damit ist die
Löschzusage aus der Datenschutzerklärung eingehalten.

## Noch offen

Aus `Hauptstudie_Protokoll_und_Fragebogen.pdf`, Abschnitt 7: für Art. 13 DSGVO fehlen
noch **verantwortliche Stelle** (Hochschule, Institut, Anschrift) und **Kontakt für
Rückfragen und Widerruf**. Der Kontakt steht jetzt im Footer der Seite und muss
eingetragen werden – ohne ihn sollte die Seite nicht online gehen.

## Grenzen

- Das Sheet ist nicht öffentlich lesbar, aber jede Person mit der `/exec`-URL kann
  buchen. Für einen Studienaushang ist das in Ordnung. Ein Honeypot-Feld fängt
  einfache Bots ab.
- Apps Script darf pro Tag rund 100 Mails über ein Privatkonto senden,
  über ein Hochschulkonto mehr. Bei 18 Terminen kein Thema.
- Doppelbuchungen sind über `LockService` ausgeschlossen: Wer eine Sekunde zu spät
  tippt, bekommt „Dieser Termin war gerade schneller weg“ und wählt neu.

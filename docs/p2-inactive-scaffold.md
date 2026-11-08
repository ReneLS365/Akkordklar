# P2: inaktiv stilladsafstand · 8. november 2026

Udgangspunkt: nyeste origin/main, `f1f8ac55c79d586881409a74f125fdc4a2eb3be0`.
Review: https://github.com/ReneLS365/Akkordklar/pull/4#pullrequestreview-5816945283

## Fejl og løsning

I Hurtig kunne stilladsfeltet tømmes og derefter skjules ved valg af jordtransport.
UI'et krævede korrekt kun aktive felter, men `calculateTransport()` validerede
fortsat den gemte tomme stilladsafstand. Resultatet blev »Afstand på stilladset
mangler«, og både beregning og gemning blev blokeret.

Normaliseringen ligger nu i den fælles motor frem for kun ved UI-kaldet:

- `calculateTransport()` anvender 0 meter uden at læse/validere stilladsfeltet,
  medmindre `stage === 'scaffold'`. Det gælder også standarden uden angivet stage.
- Et aktivt felt går gennem den eksisterende afstandsvalidator. Tomme/blanke,
  negative, ugyldige, ikke-endelige, booleske og for præcise værdier afvises.
  Relateret fund: aktiv `null`/udeladt afstand blev tidligere til 0 via `?? 0`;
  disse kræver nu også en faktisk afstand. Eksplicit indtastet 0 er stadig gyldigt.
- Samme princip anvendes for manuelle zoneoverrides i `houseZones()`. En inaktiv
  stilladsrettelse kunne tidligere blokere en gyldig jordzone. Aktive manuelle
  rettelser valideres fortsat; en udeladt override bruger fortsat zonens geometri.

Motorens rå inputobjekt ændres ikke. Hurtig beholder derfor både tomme, negative
og gyldige tidligere indtastninger ved skift. Genaktivering viser den samme
indtastning og validerer den på ny. Resultat/diagram bruger motorens 0-meter-stræk,
mens et gemt snapshot beholder brugerens faktiske input og den korrekte sum.

`transport-v2.mjs`, øvrigt UI og gemmefunktion behøver ingen særskilt rettelse.
Den fælles motor dækker også de eksisterende manuelle transportlinjer og
akkordsedlens transportkald. Ingen HP3-satser, grænser, afklaringsregler,
prisfordeling eller afrundinger er ændret. Ingen ændring i historiske akkorder,
backupformat eller lagringsskema. Et manglende aktivt felt skal udfyldes ved
ny genberegning; historiske beløb omskrives ikke.

Teknisk motorversion er 2.0.4. PWA-cache er forberedt som `20261108-02`, så en
senere godkendt udgivelse kan hente den nye motor. Motor/cache er synkroniseret
til Android og iOS. Dette arbejde foretager ingen produktionsdeploy.

## Regressioner og validering

Seks nye motortests dækker inaktive input, aktiv validering, til/fra med bevaret
værdi, HP3-stilladsgrænser, manuelle zoneoverrides og uændrede resultater i
Fordelt/Præcis. Før rettelsen fejlede tre af de seks tests.

Browserregressionen fejlede før rettelsen præcis ved fravalg efter tomt felt:
forventet 70,00 kr., faktisk intet resultat. Efter rettelsen består samme forløb
med bekræftelse, gemning og genindlæsning. Den dækker også genaktivering af tom
eller negativ afstand, gyldig 20 m, skift til truck, korrekte tillæg og bevarelse
af tidligere gemte snapshots.

Lokalt: Node 24.19.0, npm 11.9.0. Følgende er kørt og består:

| Kommando | Resultat |
| --- | --- |
| `npm ci` | 105 låste pakker installeret. |
| `npm run check` | Syntaks, manifest og ikoner OK. |
| `node --test` | 12 testfiler består i dette runtimes procesisolerede rapportering. |
| `npm test` | 136 individuelle tests, 136 beståede, 0 fejl, 0 oversprungne. |
| `npm run test:browser` | Tre browserforløb består, inklusive den nye P2-regression. |
| `npm run build:bridge` | Exit 0; SHA-256 før/efter viser ingen ændrede sporede filer. |
| `node scripts/check-native-assets.mjs` | Alle 21 dist-filer matcher begge native-kopier. |
| `git diff --check` | Ingen whitespace-/patchfejl. |

Chromium var allerede installeret og valgt med `AKKORDKLAR_CHROMIUM=/usr/bin/chromium`.
Browserkontrollen omfatter også de eksisterende mobil-, PDF-, backup- og
offlineforløb. GitHub CI kører samme suite; faktisk CI-status dokumenteres i PR'en.
Der er ikke udført fysisk Android/iOS-test eller APK-/Xcode-build. Ingen øvrig
fejl er fundet i det undersøgte stillads-til/fra-flow. PR'en efterlades åben;
merge og udgivelse er ikke en del af denne opgave.

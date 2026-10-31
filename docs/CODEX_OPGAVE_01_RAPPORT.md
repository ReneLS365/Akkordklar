# Ændringsrapport — opgave 01

## Udgangspunkt og afgrænsning

Arbejdet er udført i eksisterende Akkordklar på feature-branchen `codex/opgave-01`, fra `afa50c05179059a1a7ea9bcec98cc1579b061ba4` (main). Det oprindelige cloud-checkout var et ældre tomt commit; main blev hentet, og feature-branchen blev oprettet uden at ændre main. Arbejdsområdet havde ingen lokale ændringer.

Den forventede arkitektur findes: produktionskilde i dist/, 8 oprindelige testfiler, scripts, package-lock.json, Capacitor, Android/iOS og begge PDF-kilder. Ingen eksisterende CI-workflow. Ingen separat frontend-build eller lint er defineret; `check` udfører syntaks-/manifestkontrol. Android/iOS havde ikke PDF-filerne fra dist/sources, selv om deres service workers krævede dem.

## Faktiske fejl og rettelser

1. **A6 ved 0 m:** Manuel transport/transport med hjul gav ubetinget 7 %, selv når ingen relevant håndtering var dokumenteret. En ny test reproducerede fejlen (1 fejlet og 1 bestået test før rettelsen). Motoren returnerer nu `valid:false`, `percent:null`, `requiresClarification:true` og kode `A6_HANDLING_UNCONFIRMED`. Bekræftelse kræver boolean `handlingConfirmed:true`; en tekstværdi eller vejledende visning omgår ikke kontrollen. Faktisk positiv transport på stilladset er et transportforløb. A12-undtagelse og ren A18-kranmontage giver fortsat 0 %. UI tilbyder en dansk bekræftelse; manglende grundlag giver ikke et gemmebart pengebeløb. Eksisterende snapshots omskrives ikke.
2. **Forkert primært kildelink:** Transport-UI linkede til 2025-priskuranten. Det peger nu på den medfølgende 2026-PDF, også tilgængelig offline. UI angiver eksplicit `HP3 Provinsen · 2026-priser`.
3. **Native offline-kilder:** `npx cap copy` kopierer nu begge eksisterende PDF-kilder med til Android/iOS, så kildehenvisningen og service workerens filinventar kan opfyldes. Platformprojekter, app-id og native kode er bevaret.

Afstandsformlerne var allerede korrekte. Ingen udokumenterede ændringer af satser, G/T/H-klassifikation eller beregningsformler blev foretaget. >55 m uden hjul gav allerede et eksplicit afklaringsresultat som standard. Den eksisterende, udtrykkeligt valgte vejledende visning er bevaret, mærkes som foreløbig og kan ikke gemmes som afklaret krav. En dokumenteret særskilt aftale kan fortsat erstatte rutens samlede sats.

## Filer og sammenhæng

- `dist/engine.mjs`: 0 m-kontrol, ingen ugyldig preview-procent ved manglende sats, lokalt 2026-kildelink og regelversion 2.0.1.
- `dist/transport-v2.mjs`: eksplicit 2026-mærkning og håndteringsbekræftelse; eksisterende gemme-/eksportbeskyttelse bevares.
- `dist/sw.js`: ny cacheversion, så opdaterede moduler indlæses samlet.
- Tilsvarende filer i begge native public-mapper plus deres `sources/`: synkroniseret via Capacitor.
- `tests/task-01.test.mjs`: regression ved 0 m og samlet grænsematrix for manuel/hjul, stillads og truck. Eksisterende testfixtures for ubetinget 0 m i `engine.test.mjs` og `engine-v2.test.mjs` er erstattet af den nye betingede test.
- `.github/workflows/ci.yml`: push/PR, Node 24 (Capacitor 8 kræver >=22; lokalt verificeret med Node 24.19.0), `npm ci`, syntakskontrol, alle tests, native bridge-build, kontrol af reproducerbart bridge-output og diff-format. Kun læseadgang til repository; intet deploy.

## Verifikation

| Kontrol | Før | Efter |
| --- | --- | --- |
| `node --test` | 8 testfiler bestået, 0 fejl | 9 testfiler bestået, 0 fejl |
| Hver testfil kørt direkte, så individuelle tests tælles | 107 bestået, 0 fejl | 109 bestået, 0 fejl |
| Native bridge-generator | Først fejlet: esbuild manglede; bestået efter `npm ci` | Bestået; intet ændret bridge-output |
| `npm run check` | Ikke kørt før rettelsen | Bestået |
| `npx cap copy` | Ikke kørt før rettelsen | Bestået for Android/iOS/web |
| `git diff --check` | Rent udgangspunkt | Bestået |

Baseline på 107 individuelle tests er også genkørt fra et separat midlertidigt arkiv af det uændrede main-commit. Testene omfatter fuldt T ved demontage, blandede T/ikke-T-poster, ingen procent-på-procent, eksakte zonegrænser, øreafstemning og 6000 × 7 % + 4000 × 14 % = 980 kr. / 9,8 %. Nye tests dækker hele den efterspurgte grænsematrix.

Ingen materialebeløb er ændret eller omregnet til 2025. Den aktive 2026-PDF og dist/sources-kopien har identisk SHA-256: `7da410b98cd31455d2fe7ec746ebd7dc00ec07ae742e615499309afa638cbe60`. Det eksisterende materialekatalog og øvrige beregneres regressionstests er bevaret. Dette er ikke en ny fuld revision af alle materialeposter eller alle øvrige HP3-bestemmelser.

## Kildekontrol

HP3 Provinsen, intern vejledende 2026-prisudgave, gyldighed 1. januar 2026–28. februar 2027: forord s. 3, A6–A8 s. 17–18, A13 s. 20, pkt. 27 s. 40–41. Hvidbog A6–A8 s. 15–17 er læst, herunder forhåndsafklaring af flere transportveje og APV/særskilt akkordering. HP3 C1–C6 s. 52–57 er desuden gennemgået visuelt: egen krans målepunkt og rækkevidde samt eksterne afsætningssteder holdes adskilt.

2026-udgaven betegner sig selv intern/uofficiel/vejledende, med 2025 +2,7 %. Den aftalte 2025-udgave har fortsat fagretlig rolle; dette ændrer ikke aktuelle 2026-tal. A6 nævner hjul over 55 m, mens tabel 27.1.c ikke nævner metoden; konflikten forbliver eksplicit afklaringskrævende uden hjul.

## Begrænsninger og næste afgrænsede arbejde

Der er ikke udført native kompilering, signering, fysisk Android/iPhone-test, browserinteraktion eller produktionsdeploy. CI-kørsler på GitHub må først betegnes beståede efter observation af en faktisk kørsel. Næste afgrænsede QA-opgave er browser-/enhedstest af gemte kladder, nulmetersbekræftelsen og offline-opdatering fra tidligere PWA-version.

Pull request og GitHub CI-status afhænger af tilgængelig GitHub-adgang; de faktiske resultater rapporteres i afleveringen. Ingen automatisk merge.

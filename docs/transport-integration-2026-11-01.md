# HP3 transportintegration og CI-validering · 1. november 2026

## Git og integration

Origin er hentet før integration. Udgangspunkt:

- `main`: `452bd6c5dd44bf68d05ac7977bc85347443da8ff`.
- `transport-audit-2026-11-01`: `034b01ce09a83552324286e279a7a12d7849b373`.
- Merge-base: `7658cad66971845dfdd77e512b176a55a59e0c68`; udviklingsbranchen var 3 commits foran og 1 bagud.

De tre commits blev undersøgt: `60ff124` retter aftalt transport/omlæsning og blanke beløb samt tilføjer tests og CI; `062a88e` retter sidereferencen til transporttabellen; `034b01c` dokumenterer den daværende levering og liveudgivelse. Main-committet `452bd6c` er squash-PR #2 og indeholder allerede disse ændringer samt digital akkordseddel, materialedata, backup-/revisionsspor og yderligere tests.

Et almindeligt merge (`06d11cb`) bevarer begge historikker. Konflikterne var begrænset til `sw.js` og `transport-v2.mjs`, hver i dist/Android/iOS. De nyere main-versioner bevarer den eksisterende introduktion, tilbageknappen til akkordsedlen, tally-modulerne i offline-cachen og cacheversion 03. Det afsluttede merge har samme filindhold som main. Ingen force push, ændring i main eller deployment er udført som del af denne revision.

## Kilder og HP3-kontrol

Direkte gennemgået i `Hp3Priskurant-Provinsen (2).pdf`: trykte sider 17–19 (A6–A8/A13), 21–22 (A18), 24 (A31), 40–41 (pkt. 27 og forklaring). Figurer C1–C6 på sider 52–57 er også gennemset som billeder. Hvidbog: A6–A8 på sider 15–17, A13 på side 22, A18 på side 27 med PU 06-06-2016 på side 28 samt A31 på side 41. De distribuerede PDF-kopier er identiske med de oprindelige kilder (SHA-256 verificeret).

Prisudgaven er intern, uofficiel og vejledende (2025 +2,7 %); den gælder appens aktuelle 2026-beløb. Revisionen indfører ingen satser eller aftalemæssige afrundingsregler.

Gennemgået: `dist/engine.mjs`, `transport-price.mjs`, `transport-v2.mjs`, `transport-visual.mjs` og `calculators.mjs`; desuden fælles materialegrundlag i `rule-data.mjs` og eksisterende regressionstests.

| Regel | Kontrol og resultat |
| --- | --- |
| A6 / 27.1 | 7 % til og med 25 m ved berettiget håndtering; derefter +7 procentpoint ved overskridelse af 25/35/45 m gennem 55 m. Over 55 m kræves hjul for den udtrykkelige +7 pr. påbegyndt 20 m-regel. 0 m alene dokumenterer ikke A6-ret. |
| A6 / 27.2–3 | Bil–hejs <=25 m: 15 m fri stilladstransport; ellers 10 m. Derefter +7 pr. påbegyndt 10 m. Grænser kontrolleret på begge sider, også decimalafstande. |
| A7 / 27.4 | 7 % til og med 150 m; derefter +7 pr. påbegyndt 50 m. 150/150,01 og 200/200,01 m kontrolleret. Truck og egen aflæsningskran afregnes ikke på samme stræk. |
| A8 / A13 | Arbejds-G halveres normalt ved demontage; T bruger fortsat fuldt T-berettiget montage-G. G uden T og øvrige kronebeløb holdes ude. Særlige materialeregler bevares i præcis opgørelse. |
| A6 / C1–C6 | Egen aflæsningskran indgår én gang i bil–hejsmålet. Fremmed vognmand måles fra afsætningssted; indhejsning og ekstern kranførers timer holdes særskilt. |
| A18 | Direkte kranmontage/-demontage af telt: ingen T for kranstrækket, halvt H for relevante kranmonterede dele. Resttransport kræver særskilt afklaring. Reglen overføres ikke automatisk til andet kranarbejde. |
| A31 | +7 % på de faktisk omlæssede T-poster. En aftalt samlet sats indeholder eventuel omlæsning; +7 vises og beregnes ikke en ekstra gang. |
| Grundlag og fordeling | Tillæg er additive af relevant G. Σ(T-grundlag i kr. × sats) beregnes før samlet øreafrunding. Effektiv procent er et resultat og genbruges ikke som sats på hele akkorden. |
| Zoner | Der splittes før eksempelpunkt vælges: satsgrænser, ruteskift, hjørner og spærringer. Ingen fast grænse på 16 zoner. Øreafstemning bevarer hele fordelingsbeløbet. |

En supplerende uafhængig kontrol af 43.104 indre zonepunkter i 216 konfigurationer (håndkraft/hjul/truck, jord/stillads, begge/enkelte retninger og relevante grænseafstande) stemte med motorens satser eller afklaringsresultater. Den eksisterende testpakke dækker også flere hejs, spærringer, materialemarkeringer, demontage, vægtning og øreafstemning.

## Konkrete fejl og rettelser

Tre nye regressionstests fejlede før rettelserne og består efter dem:

1. `calculators.mjs`: A31-grundlag med kun mellemrum blev til 0 og et gyldigt resultat. Manglende beløbs-/måleinput afvises nu i den fælles læser.
2. `rule-data.mjs` / `transport-price.mjs`: en blank katalogmængde eller tom/blank manuel materialemængde kunne blive 0, mens resten af den præcise beregning blev godkendt. Hele resultatet blokeres nu ved manglende mængde. Eksplicit indtastet 0 er fortsat gyldigt.
3. `transport-price.mjs`: tom/blank manuel demontagefaktor blev 0; arbejds-G forsvandt, mens fuldt T-grundlag bestod. Tomme felter og booleske faktorer afvises nu. Udeladt faktor bevarer den eksisterende A13-standard; gyldig faktor og fuldt T-grundlag bevares.

Ingen gemte data omskrives. Ufuldstændige ældre input kan nu kræve rettelse ved genberegning. Eksisterende snapshots og backupformat er uændrede.

CI kontrollerede kun ændringer i `dist/native-bridge.mjs` efter build. Nu kontrolleres alle sporede ændringer med `git diff --exit-code`, og `scripts/check-native-assets.mjs` sammenligner alle dist-filer rekursivt med begge native-kopier. Kontrollen er også afprøvet med en bevidst ændret og en manglende Android-fil; begge gav exit 1, hvorefter originalfilen blev gendannet.

Motorversionen er 2.0.3 og PWA-cachen 20261101-04. De fem ændrede produktionsmoduler/cachefiler er synkroniseret til Android og iOS. App-ID, manifest, native projektidentitet, `.openai/hosting.json` og live-hostingkonfiguration er bevaret.

## Lokale testresultater

Node 24.19.0, npm 11.9.0. Alle følgende afsluttede med exit 0:

| Kommando | Resultat |
| --- | --- |
| `npm ci` | 103 pakker installeret. Miljøets npm-cache blev placeret under work/, fordi standardcachen er skrivebeskyttet. |
| `npm run check` | JavaScript-syntaks, manifest og ikoner verificeret. |
| `node --test` | 11 testfiler bestået, 0 fejl i dette runtimes procesisolerede rapportering. |
| `npm test` | 128 individuelle tests bestået, 0 fejlede, 0 oversprungne. |
| `npm run build:bridge` | Bestået; SHA-256 før/efter bekræfter, at ingen sporede arbejdsfiler ændres. |
| `git diff --check` | Ingen whitespace-/patchfejl. |
| `node scripts/check-native-assets.mjs` | Alle 21 dist-filer byte-identiske i både Android og iOS (42 kopier). |

De 11 filresultater fra `node --test` lægges ikke til de 128 individuelle tests; det er samme testpakke. GitHub Actions-resultater for det leverede commit dokumenteres i PR og leveringsrapport, når de er afsluttet.

## Faglige afklaringer og resterende manuel QA

- Håndkraft over 55 m: A6 nævner hjul, mens tabel 27.1.c ikke udtrykkeligt gør; ingen automatisk håndkraftsats som endeligt krav.
- A8-kældre/ekstraordinære forhold: konkret akkordering og eventuel APV. A18-resttransport og andet kranarbejde kræver afklaret anvendelsesområde, målepunkt og betaling.
- Faktisk transportvej skal aftales; korteste geometriske vej er alene en model. Meterfordeling kræver dokumenteret ens opbygning og er et overslag.
- Regnskabsteknisk øreafrunding og største-rest-fordeling er softwarevalg, ikke nye overenskomstregler. Afklar tvist om afgørende afrunding særskilt.
- Ingen manuel browser-, fysisk Android-/iOS-, native delings- eller installations-/opdateringstest er udført i denne revision. Et native bridge-build er ikke et fuldt APK-/Xcode-build.
- Ingen fuld fagretlig godkendelse eller ny liveudgivelse hævdes. Historiske leveringsnoter beskriver tidligere udgivelser og er bevaret som historik.

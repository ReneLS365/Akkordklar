# Akkordklar 2.0

Eksisterende Akkordklar videreudviklet til kontrol af stilladstillæg efter HP3 Provinsen med vejledende 2026-priser og Hvidbog 2025. Den fælles kildekode ligger i `dist/`; det er ikke en mappe med genereret buildoutput, der skal slettes.

## Kør og kontrollér

```sh
npm ci
npm run check
npm test
npm run native:sync
```

Vis webappen med en almindelig statisk webserver med rod i `dist/`. Brug HTTPS eller localhost til PWA-installation og service worker. Beregninger og projekter bruger browserens lokale datalager. `dist/` kan pakkes direkte til statisk hosting uden en separat frontend-build.

## Projektets filer

| Fil / mappe | Ansvar |
| --- | --- |
| `dist/engine.mjs` | Transportregler, eksakt zoneopdeling, hejs, spærringer og afstandsrettelser |
| `dist/transport-price.mjs` | G/T-grundlag, prisfordeling, demontage og øreberegning |
| `dist/transport-v2.mjs` | Transportens fire trin og Hurtig/Fordelt/Præcis |
| `dist/transport-visual.mjs` | SVG-model og transportforløb |
| `dist/calculators.mjs` | Øvrige HP3- og Hvidbogsberegnere |
| `dist/rule-data.mjs` | 88 verificerede materialeposter; decimalberegning |
| `dist/app.mjs` | Navigation, øvrige formularer, projekter, beregningsark og deling |
| `dist/project-store.mjs` | Komplette JSON-sikkerhedskopier og importvalidering |
| `dist/sources/` | Begge originale projektkilder, også i offline-cache |
| `tests/` | Regne-, geometri-, finans-, import- og cachetests |
| `scripts/` | Syntaxkontrol og native bridge-build |
| `android/`, `ios/` | Capacitor-projekter med synkroniserede webfiler |
| `docs/`, `store/` | Regelgrundlag, afklaringer, testrapport og udgivelsesmateriale |

`npm run native:sync` genbygger `dist/native-bridge.mjs` og kopierer den aktuelle webapp til begge platforme. App-id er bevaret som `dk.akkordklar.transport`. Native version er 2.0, build 4.

## Beregningsprincipper

- G er grundpris; T/H angiver hvilke grundpriser, der kan udløse transport/højde. Ingen procent på procent.
- Ved almindelig nedtagning bruges 50 % G til arbejdsprisen, mens T beregnes af 100 % af fuldt T-berettiget G.
- En samlet montagepris fordeles kun efter meter under en udtrykkelig antagelse om ens materialeværdi pr. meter. Præcis opgørelse bruger faktiske materialer eller T-beløb pr. område.
- Diagramzoner opdeles præcist ved hver satsgrænse. Priser vægtes efter kroner, ikke efter højeste sats eller gennemsnittet af zoneprocenterne.
- Hele øre bevares ved fordeling. Slutafrunding er en angivet regnskabsteknisk forudsætning; appen opfinder ikke en overenskomstmæssig afrundingsregel.
- Uafklarede forhold vises som sådanne. Vejledende transportresultater kan ikke gemmes som afklarede krav.

2026-udgaven er vejledende; den aftalte 2025-priskurant er det formelle grundlag ved fagretlig behandling. Se `docs/REGELGRUNDLAG.md` og `docs/AFKLARINGER.md`.

## Data og videreudvikling

Eksisterende enhedsdata under `akkordklar-v1` bevares. Gamle beregningslinjer er historiske snapshots og ændres ikke automatisk til ny regelversion. JSON-sikkerhedskopi schema2 indeholder alle projekter og deres beregnerkladder; schema1 kan fortsat importeres som gemte linjer. Import opretter kopier og overskriver ikke igangværende projekter.

ZIP-eksporten indeholder hele projektets kilde- og platformfiler. Geninstallerbare `node_modules/`, Git-historik, signeringsnøgler og buildcaches er udeladt. Installer afhængighederne med `npm ci` før native arbejde. `.openai/hosting.json` bevarer den eksisterende Site-identitet; ret ikke id'et for at udgive på det nuværende site.

Der er ikke bygget, signeret eller indsendt APK/AAB/IPA. Fysisk Android-/iPhone-test og butikkernes udgivelsestrin er fortsat nødvendige; se `store/README.md`.

## Browserkontrol før udgivelse

`npm ci` installerer også den låste Playwright-version. Installér testbrowseren med
`npx playwright install --with-deps chromium`, og kør `npm run test:browser`.
Testkørslen starter og lukker selv en lokal server og kontrollerer transportens
fire trin, mobilbredder, HP3-afklaringer, historiske snapshots, backup/import,
akkordseddel, PDF og offline-genindlæsning. GitHub Actions kører samme forløb.
En eksisterende Chromium kan vælges med `AKKORDKLAR_CHROMIUM=/sti/til/chromium`.
PDF og skærmbillede gemmes i en midlertidig mappe eller i `AKKORDKLAR_QA_OUTPUT`.

Live-hosting er fortsat særskilt fra GitHub: udgiv kun en testet, merget version
via det eksisterende projekt-ID i `.openai/hosting.json`, og bevar siteadgangen.

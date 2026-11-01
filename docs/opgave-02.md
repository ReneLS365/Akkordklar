# Opgave 02 · digital akkordseddel

## Før og efter
Før: kend en samlet montagepris → vælg transportmodel → indtast ruter → tillæg.
Nu: Optæl verificerede materialer med +/− eller antal → angiv faktisk transport pr. område → gennemgå arbejdspris, T og samlet sum. Der spørges ikke om en separat montagepris. Montage/demontage har egne antal og resultater. Antal vises pr. enhed og operation; forskellige enheder lægges ikke sammen.

Den eksisterende Hurtig/Fordelt/Præcis-visning og husdiagram findes under Avanceret transport med returknap. Gamle beregninger, projects, legacy-materialer og eksport bevares. Eksisterende områder/priser konverteres ikke tavst til nye materialemængder.

## Data og sikkerhed
`transport.sheet.version=1` gemmer rækker pr. materiale/operation, faktiske antal pr. område, ruter, favoritter og senest anvendte. Ny optælling med ét område tildeles den viste rute. Ved flere områder kræves præcis fordeling; der bruges aldrig ligelig værdifordeling. Ufuldstændig eller for stor fordeling og områdemængder, hvis afrunding skaber afregningsenheder, afvises. Ingen satser kopieres ind i UI; beregning genbruger materialPriceLine, calculateTransport og housePriceResult. A14 genbruger den eksisterende minimumsberegner; den optalte delsum er ikke en fuldstændig akkord, hvis andre relevante pkt. 1–25 mangler.

Inputændringer ophæver godkendelse. Ugyldige kladder spærrer resultater, så et gammelt gyldigt input ikke kan gemmes fra et fejlagtigt synligt felt. Samme snapshot kan ikke tilføjes Mit ark to gange. Allerede gemte historiske linjer ændres ikke ved nye input; en revideret version gemmes som ny linje, og den gamle skal fjernes fra Mit ark, hvis den erstattes. Snapshot og hele revisionssporet følger den eksisterende JSON-/teksteksport. Projektbackup indeholder sheet-data og valideres ved import. Ingen ændring af det overordnede backupformat.

## Eksempel og afrunding
20 søjler, pkt. 3e × 17,16 kr./stk. = 343,20 kr. fuld G og T-grundlag.
Montage: arbejds-G 343,20 kr. + A6 ved 25 m: 343,20 × 7/100 = 24,024 kr. → 24,02 kr. = 367,22 kr.
Almindelig demontage: A13 arbejds-G 343,20 × 0,50 = 171,60 kr.; A8 T-grundlag stadig 343,20 kr.; transport stadig 24,024 → 24,02 kr.; sum 195,62 kr.
Mængdeafrunding følger enheden i den eksisterende motor. Grundpris afrundes pr. komplet materialelinje i hvert område. Transportprodukter summeres før slutafrunding til øre pr. arbejdsoperation. Viste delbeløb kan derfor afvige et øre fra summen af de viste afrundede tal. Forudsætningen vises på arket.

## Kilder og dækning
AGENTS.md, CODEX_OPGAVE_01.md og docs/AFKLARINGER.md er læst. Lokale PDF'er: Hp3Priskurant-Provinsen (2).pdf og Hvidbog-Serviceprgetstillads.pdf; A6–A8, A13/A14, A18 og pkt. 27 samt C1–C6 (visuelt gennemgået under den foregående revision). 23 nye GTH-poster verificeret mod HP3 trykt s. 26 og 34. Se [alle 111 priser og dækningsbegrænsninger](materialedaekning-02.md).
A8, uden hjul >55 m, A18-resttransport og uklar A35-basis forbliver AFKLARING_KRÆVES. Ingen ny sats er opfundet. 2026-prisudgavens vejledende status fremgår af resultat og udskrift.

## Ændrede filer
- dist/tally.mjs: versionsmærket dataflow, søgning, validering, områdeallokering og beregning via eksisterende motorer.
- dist/tally-view.mjs: optælling, favoritter/seneste, transport, revisionsspor, udskrift og gemning.
- dist/app.mjs og transport-v2.mjs: standardindgang og adgang til eksisterende avancerede flow.
- dist/rule-data.mjs: 23 dokumenterede katalogposter.
- dist/project-store.mjs: validering af ny sheet-del ved import, gamle projekter understøttes.
- dist/styles.css og sw.js: mobil layout, print og offline-cache af nye moduler.
- De tilsvarende webfiler i Android/iOS er synkroniseret.
- tests/tally.test.mjs, scripts/qa-tally-mobile.cjs, scripts/qa-tally-offline.cjs og denne dokumentation.

## Verifikation
Baseline: 112 individuelle tests. Efter: 123 individuelle tests, 0 fejl (11 nye tests med flere scenarier i løkker). `npm run check`, `node --test` (11 filer), `npm test`, `npm run build:bridge` og `git diff --check` består.

Chromium/Playwright: optælling og resultat ved 360/390/430 px havde scrollWidth præcis lig viewportbredde. 20 søjler gav 367,22 kr. Gemning i Mit ark og genindlæsning bevarede beløb. Udskrifts-PDF genereret; betjeningsfelter skjult i printmedie. Ingen JavaScript-fejl. Eksplicit 12/8-fordeling til 25/35 m gav 376,83 kr.; delvis fordeling viste afklaring. Avanceret/retur samt offline-genindlæsning med serviceworker bestod. Browser-QA scripts kræver installeret Playwright og Chromium, en lokal server for dist og evt. AKKORDKLAR_CHROMIUM/QA_URL/QA_OUTPUT (fulde navne fremgår af scripts). De kræver ikke en ny produktionsafhængighed. Tests på fysiske Android-/iOS-enheder er ikke udført.

## Levering
Branch: akkordseddel-02. Live-status dokumenteres særskilt efter faktisk udgivelse; GitHub-push er ikke deployment. ZIP af det præcise commit kan hentes via GitHub Download ZIP; chatens filoutputmappe er ikke skrivbar i dette cloudmiljø.

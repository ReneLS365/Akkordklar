# Transportrevision · 1. november 2026

Udgangspunkt: ReneLS365/Akkordklar, branch work, commit 7658cad. Arbejdstræet var rent; origin HEAD var samme commit.

## Testmiljø
Node 24.19.0, npm 11.9.0. Før ændringen rapporterede `node --test` 9 beståede testfiler. `node --test --test-isolation=none` udførte og rapporterede 109 individuelle tests. engine.test.mjs og calculators.test.mjs rapporterede tilsammen 20 individuelle tests. Efter ændringen: 10 filer / 112 individuelle tests, alle bestået. En midlertidig bevidst fejl blev opfanget i begge isolationstilstande og slettet igen. Forskellen ligger i rapportering under procesisolering i dette runtime; den dybere runtimeårsag er ikke fastslået. Det var forkert tidligere at betegne 9 filer som 9 individuelle tests.

`npm test` bruger nu eksplicit ingen procesisolering, så antal og testnavne er efterprøvelige. CI kører både den krævede `node --test` og `npm test`.

## Kilder og gennemgang
Direkte læst: Hp3Priskurant-Provinsen (2).pdf, trykte sider 17–19 (A6–A8/A13), 21–22 (A18), 40 (pkt. 27); Hvidbog-Serviceprgetstillads.pdf, trykte sider 15–17 (A6–A8), 27–28 (A18 og PU 06-06-2016). Figurer C1–C6 i priskuranten, sider 52–57, er gennemset som billeder, ikke kun OCR. Prisudgaven for 2026 er intern/uofficiel/vejledende; dens beløb er fortsat appens aktuelle prisgrundlag. Der er ikke indført nye satser.

Gennemgået: dist/engine.mjs, transport-price.mjs, transport-v2.mjs, transport-visual.mjs samt tilhørende tests.

- A6: til og med 25 m = 7 %; yderligere 7 procentpoint pr. påbegyndt 10 m gennem 55 m. Hjul derefter +7 pr. påbegyndt 20 m. Håndkraft over 55 m kræver afklaring; evt. tabelpreview er vejledende og kan ikke gemmes som ubetinget krav.
- A7: 7 % gennem 150 m; derefter +7 pr. påbegyndt 50 m. Egen kran og truck på samme transportstræk afvises.
- Stillads: frigrænse 15 m ved bil–hejs <=25 m, ellers 10 m. Derefter +7 pr. påbegyndt 10 m.
- Egen aflæsningskran indgår i den samlede bil–hejsafstand, jf. C1–C4. Ekstern vognmand måles fra afsætning, jf. A6/C5–C6; indhejsning medgået tid holdes adskilt. A18 direkte teltmontage giver ingen T for kranstrækket og halvt H for de relevante dele. Andre kranmontageforløb kræver afklaring; ingen universel overførsel af teltreglen.
- A13 arbejds-G halveres normalt ved demontage; A8 bevarer fuldt T-berettiget G. Ikke-T og øvrige tillæg holdes ude af T.
- Zonemodellen splitter ved satsgrænser, hjørner, spærringer og ruteskift før repræsentationspunkt vælges. Beløb beregnes som sum af fuldt T-grundlag gange sats; effektiv procent genbruges ikke som beregningssats. Øre fordeles uden tab, samlet tillæg afrundes til sidst. Dette er eksplicit en softwarefordelingsmodel, ikke en opfundet aftaleregel.
- Geometrisk korteste åbne vej er kun en model. Faktisk rute og fordeling skal afklares før gemning. Ens pris pr. meter er et overslag.

## Rettelser og nye tests
1. Samlet aftalt transportsats (A8/håndtransport over 55 m) med omlæsning viste fejlagtigt yderligere +7 % A31 i mellemregningen. Beløbet var allerede korrekt. Nu markeres omlæsning som indeholdt i aftalen, og et ekstra tillæg vises ikke. Regressionstesten fejlede før rettelsen.
2. Priser med kun mellemrum blev omdannet til 0, fx feltet uden T. Nu afvises de som manglende input. Regressionstesten fejlede før rettelsen.
3. Tilføjet kombineret grænse-/demontagetest for manuel transport, hjul og truck med ikke-T og øvrige beløb. Tre nye tests i transport-audit.test.mjs; løkker dækker flere scenarier.
4. Kort introduktion til førstegangsbrugere; eksisterende forklaring og mellemregning bevaret. PWA-cacheversion opdateret. Ingen ændring i lagringsskema eller projekt-ID'er.

## Validering og begrænsninger
`npm run check`, `node --test`, `npm test`, `npm run build:bridge` og `git diff --check` består. Eksisterende tests for gemte projekter, backup/import og offline-shell består. Der er ikke gennemført manuel browser-, Android- eller iOS-test. Ingen fuld fagretlig godkendelse hævdes: A8, håndkraft over 55 m og A18-resttransport kræver fortsat konkrete aftaler. Hvidbogens øvrige udkast/revisionsafsnit bruges ikke til at indføre nye regler.

Udgivelsesstatus og leverede commit-id'er findes i den ledsagende leveringsrapport.

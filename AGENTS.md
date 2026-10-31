# AGENTS.md — Akkordklar

## 1. Mission og rolle

Du er lead-udvikler, QA-ansvarlig og faglig HP3-revisor for **Akkordklar**: en dansk mobil-først akkordberegningsapp, som hjælper stilladsmontører med at beregne og dokumentere korrekt betaling. **Materialetransport og slæbprocenter er førsteprioritet.**

Arbejd i den **eksisterende kodebase**. Projektet er ikke en anledning til at lave en ny prototype, en single-file-demo eller et nyt framework uden en særskilt, dokumenteret begrundelse og godkendelse.

Svar og tekster til brugeren skal være på dansk, korte og præcise. Teknisk kode og interne identifikatorer må være på engelsk. Prioritér korrekthed og efterprøvbarhed frem for smarte effekter.

**Dette dokument er permanente projektregler, ikke en ordre om at omskrive hele projektet ved hver opgave.** Læs den aktuelle opgave og undersøg kun relevante filer og kilder.

## 2. Kilder, hierarki og ærlighed

Primære projektdokumenter (find dem dér, hvor de faktisk ligger i repoet):

1. `Hp3Priskurant-Provinsen (2).pdf`: **Akkordklars aktive og obligatoriske PRISDATAKILDE for 2026-beregninger**, med satsperiode **1. januar 2026 til 28. februar 2027**. Alle aktuelle beløb skal hentes direkte herfra (eller fra anden særskilt dokumenteret og gyldig regulering for samme periode). **Brug aldrig 2025-beløb som aktuelle satser, fallback eller skjult standard.**
2. `Hvidbog-Serviceprgetstillads.pdf`: fortolkninger, eksempler, figurer og PU/FV-henvisninger. Kontrollér dokumentets konkrete status; sider markeret revision/udkast skal ikke behandles som endeligt vedtagne aftaler uden verificering.
3. Den oprindelige, aftalte 2025-priskurant, overenskomst, protokollater og officielle reguleringer, hvis de findes eller kan verificeres, er relevante for **aftalens retlige fortolkning og historik, ikke for appens aktuelle beløb**.

**Ufravigelig prispolitik:** UI, eksporter og regressionstests skal anvende **2026-satser** i den angivne periode. Skriv eksplicit `HP3 Provinsen · 2026-priser` samt versions-/kildereference. Ved manglende 2026-pris: vis `AFKLARING_KRÆVES` og undlad at beregne et tilsyneladende korrekt beløb; indsæt ALDRIG en 2025-pris i stedet.

**Juridisk skelnen:** Den leverede 2026-PDF beskriver sig selv som en **intern, uofficiel og vejledende** prisudgave, beregnet som 2025-satser + 2,7 %. Forordet henviser til den aftalte 2025-priskurant som fagretligt grundlag. Dette ændrer **ikke**, at appens aktuelle *tal* skal være 2026-priser. Vis en diskret note om prisudgavens status i regel-/kildedokumentationen, men omregn ikke tilbage til 2025. Kontrollér særskilt beløb, hvis en officiel modstridende 2026-sats dokumenteres.

**Kildeprioritet ved regelkonflikt:** bindende aftaletekst og relevante afgørelser > autoriserede fortolkninger > interne/vejledende beregningstabeller > eksisterende kode > antagelser. Ved modstrid: dokumentér konflikten og markér funktionen `AFKLARING_KRÆVES`; vælg ikke stiltiende en bekvem fortolkning.

- Opfind aldrig satser, %-tillæg, afrunding eller lønrettigheder.
- Knyt beregningsregler til bestemmelse, kildeudgave og eventuelle forbehold.
- Skeln tydeligt mellem **faktisk akkord**, **vejledende overslag** og **særskilt aftale**.
- Hvis en sats eller praktisk forudsætning mangler, vis en forklaring og et afklaringsflag. Regn ikke en tilsyneladende endelig sum på ukendt grundlag.
- Ingen tekst i UI må fremstille appen som en juridisk garanti eller erstatning for aftale mellem parterne.

## 3. Eksisterende arkitektur: bevar og verificér

Forventet struktur fra seneste projektbeskrivelse. Undersøg filernes faktiske indhold, før du ændrer noget:

| Sti | Rolle |
| --- | --- |
| `dist/engine.mjs` | Transportberegning, ruter, zoner og fordeling |
| `dist/calculators.mjs` | Øvrige HP3-beregnere og priskurantdata |
| `dist/app.mjs` | UI-state, formularer, husdiagram, lokal lagring og eksport |
| `dist/index.html`, `dist/styles.css` | Mobil-først brugerflade |
| `dist/manifest.webmanifest`, `dist/sw.js` | Offline PWA og cache |
| `scripts/build-native-bridge.mjs` | Generering af native bro |
| `scripts/native-entry.mjs`, `dist/native-bridge.mjs` | Capacitor-kobling |
| `android/`, `ios/`, `capacitor.config.json` | Native projekter/konfiguration |
| `tests/engine.test.mjs`, `tests/calculators.test.mjs` | Eksisterende regressionstests |
| `package.json` | Node-projektets reelle scripts og afhængigheder |

Disse stier er **forventninger**, ikke bevis for, at alle filerne findes i en given ZIP. Hvis noget mangler, skal du oplyse det og arbejde videre med de filer, der faktisk er tilgængelige. Brug ikke den hostede hjemmeside som erstatning for lokal kildekode.

Eksisterende liveadresse (reference, ikke automatisk Git-deployment):
`https://akkordklar-transport-ven.renels.chatgpt.site`

En GitHub-push **opdaterer ikke automatisk** denne `chatgpt.site`-adresse. Deployment kræver en dokumenteret integration eller særskilt autoriseret handling. Påstå aldrig, at liveversionen er opdateret uden verificering.

## 4. Ubrydelige beregningsinvarianter

### 4.1 G/T/H og grundlag

- Beregn %-tillæg **kun af det relevante grundbeløb G**, aldrig af et beløb med andre tillæg ovenpå.
- Respektér priskurantens markeringer: `G`, `T`, `H`, `GH` uden `T`, rene `G`-poster og selvstændige krone-/tidsydelser. En post uden `T` må ikke få transporttillæg.
- Kontrolpunkter: 5l stemmegaffel og 5m klips samt 16a/b net er kun `G`; 15a-e armeret plast er `GH` uden `T`; 12i, 13i-n, 15f, 16d og 20a-c har særskilte afregningsregler. Verificér mod tabellen, før du ændrer klassifikationer.
- Hold **T-grundlag**, montage-/demontage-G, H-grundlag og selvstændige kroneydelser adskilt i data og UI.
- Montage og demontage skal have eksplicitte tilstande. A13: G halveres som udgangspunkt ved demontage, hvor andet ikke er angivet. **A8: transport beregnes fortsat af det fulde, uhalverede G-grundlag.**
- A14: kontrol af minimumspriskurantsum (den aktive 2026-pristabel angiver 492,56 kr.) bruger de relevante grundpriser i pkt. 1–25; ved demontage halveres disse som angivet i Hvidbogen. Transporttillæg må ikke forveksles med minimumsgrundlaget.

### 4.2 A6: manuel transport til hejsested

Med `d` i meter og dokumenteret transportberettigelse:

- `0 <= d <= 25`: 7 %, når A6's relevante håndterings-/transportforudsætninger er opfyldt. Et indtastet `0 m` alene dokumenterer ikke, at et tillæg er optjent; afklar scenariet.
- `25 < d <= 55`: `7 + 7 * ceil((d - 25) / 10)` procentpoint.
- `d > 55` **med hjul** for den fortsatte transport: `28 + 7 * ceil((d - 55) / 20)` procentpoint.
- `d > 55` **uden hjul**: A6 beskriver specifikt hjul over 55 m. **Anvend ikke hjul-satsen automatisk.** Markér `AFKLARING_KRÆVES` / særskilt vurdering efter A8 og relevant APV; ingen opdigtet procentsats.
- Negative, NaN, uendelige og ikke-entydige afstande er ugyldige input.
- Flere mulige transportveje, eksempelvis baggård/port, skal kunne registreres og afklares forud for opgaven, jf. Hvidbog A6 / PU 22-08-2013.

### 4.3 A6: manuel transport på stillads

Mål videre fra hejsested til monterings-/demonteringsstedet:

- Bil/afsætningssted til hejsested `<= 25 m`: `0 %` til og med `15 m`; derefter `7 * ceil((s - 15) / 10)` procentpoint.
- Bil/afsætningssted til hejsested `> 25 m`: `0 %` til og med `10 m`; derefter `7 * ceil((s - 10) / 10)` procentpoint.
- Kombinér kun berettigede tillæg på samme relevante T-grundlag. Ingen procent-på-procent eller dobbeltregistrering af samme stræk.

### 4.4 A7: truck/teleskoplæsser

- Til og med 150 m: 7 % på relevante T-poster.
- Over 150 m: `7 + 7 * ceil((d - 150) / 50)` procentpoint.
- Hvidbog A7 præciserer opstillings-, ændrings- og nedtagningssted.
- Bland ikke A7 og A6 på samme stræk uden dokumenteret grundlag.

### 4.5 Kran og særlige transportforhold

Understøt **tre forskellige situationer**; følg A6, A8, A18 og fig. C1–C6:

1. **Stilladsbilens egen kran ved aflæsning:** vurder afstand og kranens rækkevidde fra relevant målepunkt som vist i C-figurerne; kræv korrekte input og undgå dobbeltoptælling.
2. **Fremmed vognmand/ekstern kranfører:** vandret T-transport opgøres fra afsætningsstedet, og indhejsning afregnes særskilt med forbrugt tid efter A6, med relevante A18-undtagelser.
3. **Kran direkte ved montage/demontage (A18):** ingen transportprocent for det stræk, kranen flytter materiellet under selve montagen; højdetillæg halveres på de kranmonterede dele.

A8: kældre, vanskelige passager og ekstraordinære forhold kræver særskilt akkordering/afklaring og eventuelt APV. A31: omlæsning fra stor til lille bil på arbejdsstedet er +7 % på T-poster.

### 4.6 Præcis prisfordeling og husdiagram

Tre eksisterende/brugerrettede metoder skal understøttes:

- **Hurtig:** én T-berettiget pris og én klart defineret rute.
- **Fordelt:** samlet T-grundlag fordeles til sider/zoner; ligelig fordeling efter længde er **kun et overslag** ved dokumenteret ens opbygning.
- **Præcis:** materialer/mængder og T-grundlag pr. faktisk transportvej.

`transportKr = sum(Tgrundlag_i * tillæg_i / 100)` på korrekt dokumenteret afrundingsniveau. `effektivTransportPct = 100 * transportKr / sum(Tgrundlag_i)` når nævner > 0. Effektiv procent er et **resultat**, ikke en sats, der uden videre kan bruges på ikke-T-berettigede poster.

- Der må aldrig være zoner, som krydser en satsgrænse, og derefter afregnes på zonens midtpunkt. Split **eksakt** ved 25/35/45/55 m, relevante efterfølgende 20 m-trin og 10/15 m-grænser på stilladset.
- Ingen vilkårlig grænse på fx 16 zoner. Split ved matematisk relevante steder i den eksisterende geometri.
- Gem den faktisk brugte vej, barrierer, afsætningssteder, hejsesteder og materialeallokering. Korteste geometriske vej er ikke automatisk den afregnede vej.
- Summen af zoneværdier skal stemme med inputbeløbet, inklusive håndtering af eventuelle øre-afvigelser uden at skabe eller miste værdi.

### 4.7 Øvrige væsentlige regler: regression må ikke opstå

- A10/pkt. 26: højdetillæg kun for H-poster, målt fra fodplade ved hejsested. 18–26 m: 30 %, over 26–32: 70 %, over 32–42: 100 %, over 42–52: 160 %, herefter +20 procentpoint pr. 3 m efter priskurantens dokumenterede interval-/afrundingsfortolkning; verificér fig. E1–E2 og Hvidbog, og gæt ikke ved en uafklaret grænse. Lodret drager kun over 18 m. Ved hejs og opbygning på stedet skal dokumenteret særregel respekteres.
- A16: +200 % tagtillæg ved taghældning **over** 15° til første (mulige) gennemgående dæk, ekskl. fodliste, jf. D1–D2.
- A18/A35/pkt. 19 og 22: telt/klimaskærm 47 % eller 70 % efter dokumenterede betingelser, A35's landsdækkende zoneprisregel, særskilt åbne-/lukkefelt og korrekt kipdrager-enhed (19h).
- A11–A12: montagedæk og flytning af arbejdsdæk op til 2 m. Ved A12-flytning: konsol/dæk/bjælker 100 % G og fodliste/hegn/diagonaler 150 % G efter de konkrete betingelser; **ingen opstarts-/transporttillæg**. Kontrollér Hvidbog fig. G1–G3 og kravet om fuldt udfyldt montagedæk.
- A26/pkt. 20: afspærring har særskilte kroneposter (2026-udgaven: 21,22 / 10,61 / 6,45 kr.) og tælleregler. Opstart = 1, afslutning = 1, almindelig åbne/lukke og fortov = 0, flytning ad vej = 1, fjernelse til gård = 1, cykelsluse = 1, under de dokumenterede betingelser. Halver ikke rutinemæssigt ved demontage.
- A9: kørsel ud over 20 km pr. arbejdsdag: 2,18 kr./overskydende km/mand efter den aktive 2026-pristabel.
- 2026-timesatserne (Sats 1: 44,14 kr./t; Sats 2: 50,71 kr./t; mentor: 22,86 kr./t, med relevante undtagelser) og indslusningsregler skal verificeres mod den aktive 2026-kilde og Hvidbog, før de markeres sikre. Ingen 2025-fallback.
- A20/A33/A36: respekter enheder og deres forskellige afrundinger (stk., modul, m, lbm., m²) pr. konkret bestemmelse.

## 5. Præcision, data og forklaring

- Adskil input, normaliseret målegrundlag, sats, beregningstrin, pengebeløb, kilde og status i datamodellen.
- Regn i hele øre eller en anden eksplicit verificerbar decimalmodel. Udskyd afrunding, når muligt, og dokumentér den valgte regneregel; præsenter ikke en softwarebeslutning som en overenskomstregel.
- Bevar decimalafstande, så en satsgrænse ikke overskrides på grund af utilsigtet afrunding.
- Returnér strukturerede resultater med regel-ID, anvendte input, mellemregninger og `status: 'beregnet' | 'overslag' | 'afklaring_kræves'` eller eksisterende kompatibel statusmodel.
- Sikr bagudkompatibilitet for gemte projekter (versionér skema/migrering); ændr ikke eksisterende lokale beregninger lydløst.
- Kontroller at PWA-cacheversioner ikke leverer en gammel regelmotor sammen med nyt UI.

## 6. UX-principper

- Dansk, mobil-først, store trykflader og godt kontrastniveau. Ro, tydelige tal, mørk marineblå/neutrale flader og afdæmpet grøn accent.
- Standardflow: **Beløb → transportmetode → rute/afstand → resultat og forklaring**.
- Vis avancerede funktioner kun ved behov. Behold husdiagrammet, men tilbyd simpel afstandsindtastning.
- Vis **resultat i kroner og procent**, hvilke materialer det gælder, kildebestemmelse og alle afklaringsflag.
- Adskil bekræftede beregninger fra anslået zonefordeling tydeligt. Brug ikke formuleringer som “garanteret krav”, når forudsætninger er uafklarede.
- Appen skal fortsat fungere offline, kunne gemme/redigere beregninger og eksportere dokumentation uden eksterne login-tvang.

## 7. Arbejdsform, tests og ændringskontrol

Ved en konkret kodeopgave:

1. Kontrollér repo/branch, eksisterende ændringer og relevante filer. Overskriv ikke andres ufærdige arbejde.
2. Find den præcise kildebestemmelse og reproducer fejlen i en test, før beregningslogikken rettes.
3. Lav den mindste komplette, produktionsklare ændring, der løser opgaven. **Ingen placeholders** som `// ...rest of code`.
4. Kør relevante tests; ved ændring i beregningsmotor eller fælles moduler kør som minimum `node --test` og, hvis scriptet findes, `node scripts/build-native-bridge.mjs`.
5. Kør også projektets eksisterende lint/build checks, hvis defineret og relevante. Verificér `git diff --check`.
6. Rapportér faktiske resultater: testantal, fejl, ændrede filer, berørte regler og eventuelle åbne afklaringer. **Påstå aldrig, at en test eller deployment er gennemført, hvis den ikke er kørt.**

Testgrænser, der skal være dækket ved relevant ændring:

- A6: 0, 25, 25+epsilon, 35, 35+epsilon, 45, 55, 55+epsilon, 75, 75+epsilon; med og uden hjul.
- A6 på stillads: 10/10+epsilon, 15/15+epsilon, 20/20+epsilon og 25/25+epsilon i det indledende stræk.
- A7: 150/150+epsilon, 200/200+epsilon.
- A8/A18: fremmed kran, afsætningssted, faktisk rute og særskilt aftale.
- G/T/H, demontage-T, ikke-T-poster, grænsetilfælde, forskellige zoner, totalfordeling og øre-afstemning.

**Kildekontrol for visuelle figurer:** Læs billederne C1–C6, E1–E2, D1–D2 og de relevante Hvidbogsfigurer, når en regel afhænger af placering eller illustration. Konkludér ikke alene ud fra OCR/tekstudtræk.

## 8. Git, GitHub, Codex og sikkerhed

- **GitHub-repoet er kildekodens autoritative versionshistorik.** ZIP'er bruges til overdragelse/snapshot, ikke som erstatning for Git.
- Brug korte, afgrænsede ændringer på en feature-branch, og foretræk pull requests med review og bestået CI før merge til `main`.
- Commit kode, tests og nødvendig konfiguration; commit ikke `node_modules`, cache, logfiler, build-støj, nøgler eller hemmeligheder.
- `dist/` er en del af den eksisterende apps produktionskilde og skal ikke generelt ignoreres i `.gitignore`.
- Bevar `android/`, `ios/`, `scripts/`, `tests/`, `package.json` og Capacitor-konfiguration i versionsstyring, hvis de er en del af den faktiske kodebase.
- Projektets priskurant-PDF'er og Hvidbog kan være ophavsretligt beskyttede; hold repoet privat, indtil rettigheder til offentlig distribution er afklaret.
- Ingen deployment, ændring af GitHub-adgange, deling af hemmeligheder, destruktiv Git-handling eller publicering uden brugerens eksplicitte accept.
- Behandl ikke Github/Codex-forbindelse som automatisk synkronisering af den særskilt hostede `chatgpt.site`-app.

## 9. Færdig betyder dokumenteret korrekt

En kodeopgave er først afsluttet, når dens **konkrete** acceptkriterier er opfyldt, regressionstests er kørt, og relevante kilder fremgår af løsningen. Hvis noget ikke kan verificeres, aflever status som delvist færdig med præcis blocker; skjul det ikke.

Prioriteringsrækkefølge: **fejl i løn/transportgrundlag → fejlagtige transportgrænser → uklar afregningsstatus → datatab → mobil UX → øvrig polish**.

# CODEX-OPGAVE 01 — Stabiliser repoet og korrigér de mest risikable transportfejl

Du arbejder i det **eksisterende Akkordklar-repository**. Følg `AGENTS.md` i repository-roden. Dette er en **afgrænset første leverance**, ikke en total omskrivning.

## Mål

Gør transportberegningen sporbar og korrekt ved de vigtigste HP3-grænser. Etabler en reproducerbar baseline og automatisk GitHub-kontrol, så efterfølgende ændringer ikke ødelægger lønberegningen.

## Arbejde — udfør i denne rækkefølge

1. **Inspektér først:** Vis repoets faktiske struktur, branch og `git status`. Find motor, UI, tests, `package.json`, PDF-kilder og eventuelle bygge-/deployscripts. Registrér afvigelser fra `AGENTS.md`. Opret ikke en ny app, hvis kildekoden mangler.
2. **Baseline:** Kør de eksisterende tests (`node --test`) og den eksisterende native bridge-generator (`node scripts/build-native-bridge.mjs`, hvis den findes). Registrér præcis output og eventuelle fejl **før** ændringer.
3. **Kildetjek og 2026-prispolitik:** Læs den vedlagte HP3-udgave med **2026-priser** (1. januar 2026–28. februar 2027), især A6, A7, A8, A13 og pkt. 27, samt Hvidbog A6–A8 og C-figurerne. Alle aktuelle kronebeløb beregnes med 2026-satserne, aldrig 2025-priser. Bevar særskilt dokumentation for 2026-udgavens vejledende status og den aftalte 2025-udgaves fagretlige rolle; det er ikke en instruks om at bruge 2025-satser i regnestykket.
4. **Skriv regressionstests først** for:
   - Manuel jordtransport ved 25, 25.01, 35, 35.01, 45, 55, 55.01 og 75.01 m.
   - Manuel transport over 55 m **uden hjul**: må ikke stille og roligt give hjulprocent; skal give et eksplicit afklaringsresultat.
   - Transport på stillads med og uden mere end 25 m fra bil til hejsested, især 10, 10.01, 15, 15.01, 20 og 25 m.
   - Truck ved 150, 150.01 og 200.01 m.
   - Demontage: halveret G til montage-/demontagepris, men fuldt uhalveret T-grundlag.
   - Blandede T- og ikke-T-poster: transport beregnes alene af T-poster.
   - To zoner med forskellig T-værdi: vægtet betaling i kroner og effektiv procent (fx 6000 kr. × 7 % + 4000 kr. × 14 % = 980 kr.; 9,8 % effektivt).
5. **Ret motoren:** Implementér udelukkende de fejl, som inspektion, kildegrundlag og tests underbygger. Bevar eksisterende eksportfunktioner og offentlige funktioners kompatibilitet, medmindre ændring er uundgåelig og dækkes af tests.
6. **UI-sikkerhed:** Hvis et scenarie er uafklaret (fx >55 m uden hjul), må UI ikke vise et definitivt fejlagtigt procent- eller kronebeløb. Vis en tydelig dansk afklaringsbesked og relevant HP3-reference. Sørg for, at uafklaret scenarie ikke bliver gemt/eksporteret som en valideret sats.
7. **GitHub CI:** Hvis der ikke findes en passende workflow, opret `.github/workflows/ci.yml` med tests ved pull request/push. Vælg passende Node-version og installationskommando **ud fra det eksisterende `package.json` og lockfil**, ikke ved gæt. Inkludér native bridge-build hvis den kan køre reproducerbart i CI. **Deploy ikke automatisk** til `chatgpt.site`.
8. **Verificér:** Kør `node --test`, native bridge-generator hvis tilgængelig, relevante build/lint-kommandoer og `git diff --check`. Kontroller at `dist/`, `android/` og `ios/` ikke ved en fejl er udeladt fra Git.

## Acceptkriterier

- De nævnte transportgrænser er dækket af faktiske automatiske tests, som består. Alle aktuelle krone-/materialesatser er 2026-priser, ikke 2025-fallback.
- Ingen ubekræftet hjulprocent anvendes ved >55 m uden hjul.
- Ingen procent-på-procent; ingen transportbetaling for ikke-T-poster.
- Demontage-T beregnes på fuldt G-grundlag.
- Forskellige zoner afregnes vægtet efter faktisk T-grundlag.
- En eksisterende funktionsdygtig app er bevaret; ingen ny prototype, ingen generisk reimplementering.
- GitHub CI er konfigureret i kode. Om den har kørt på GitHub, må kun erklæres efter en faktisk workflow-kørsel.
- Ingen produktionsdeploy eller ændringer i GitHub-indstillinger uden godkendelse.

## Aflevering

Beskriv kort på dansk:

1. Fundne faktiske fejl vs. forhold, der endnu ikke er undersøgt.
2. Ændrede filer og hvorfor.
3. Resultat af testkommandoerne før/efter, med fejlantal.
4. HP3-/Hvidbogsbestemmelser anvendt.
5. Åbne fortolkningsspørgsmål og næste afgrænsede opgave.
6. Git-branch og evt. pull-request-link, hvis en PR faktisk er oprettet.

**Start nu med repoinspektion og baseline. Gennemfør resten uden at genopbygge projektet fra bunden.**

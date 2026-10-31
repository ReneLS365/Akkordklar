# Akkordklar: GitHub + Codex — opsætning

## A. Før GitHub: kontrollér projektmappen

Pak **den nyeste, komplette Akkordklar-ZIP** ud. Projektets rodmappe skal indeholde `package.json`, `dist/`, `tests/`, `scripts/` og eventuelt `android/` og `ios/` direkte, ikke under en ekstra ZIP-indpakning.

Placér `AGENTS.md` direkte i **repoets rodmappe** (ved siden af `package.json`) og placér `CODEX_OPGAVE_01.md` samme sted. Brug `.gitignore` fra denne pakke, hvis den eksisterende ikke allerede indeholder tilsvarende regler. Merge frem for blind overskrivning.

Advarsel: **En .zip, der uploades som én fil til GitHub, bliver ikke automatisk til en kodebase.** Filerne skal pakkes ud og pushes/uploades med deres mappestruktur.

## B. Opret repository på GitHub

GitHub-kontoen, der var forbundet ved gennemgangen: `ReneLS365`. Intet Akkordklar-repository var tilgængeligt ved kontrollen.

1. Åbn <https://github.com/new?owner=ReneLS365&name=Akkordklar&visibility=private>.
2. Owner: `ReneLS365`. Repository name: `Akkordklar`.
3. Beskrivelse: `Dansk akkordberegner til stilladsmontører med HP3 2026-priser, præcis transportberegning, lønkontrol og dokumentation.`
4. Vælg **Private**.
5. Opret repoet **uden** automatisk README, .gitignore eller licens, når eksisterende projekt skal pushes (det undgår en unødvendig første merge).
6. Tryk **Create repository**.

### Anbefalet: push eksisterende mappe via Git på computer

Åbn terminalen i den **udpakkede Akkordklar-rodmappe**. Tjek først `git status`. Hvis mappen allerede er et Git-repo, så genbrug den og tjek eksisterende remotes med `git remote -v`.

For en almindelig mappe **uden** eksisterende `.git`:

```bash
git init -b main
git add .
git status
git commit -m "chore: import existing Akkordklar application"
git remote add origin https://github.com/ReneLS365/Akkordklar.git
git push -u origin main
```

GitHub kan kræve login via browser, Git Credential Manager eller en autoriseret credential-løsning. Brug **ikke** adgangskode/tokens som tekst i repoet.

Hvis `git remote add origin` fejler, fordi remote findes: kontrollér `git remote -v`; ret kun hvis den peger forkert. Udfør ikke `git push --force`.

Alternativt: brug GitHub Desktop til at tilføje den eksisterende lokale mappe og publicere det private repository. Ved browserupload skal du uploade de **udpakkede filer og mapper**, ikke selve ZIP-filen; vær opmærksom på browserens uploadgrænser og skjulte filer.

## C. Kontrollér GitHub efter første push

På <https://github.com/ReneLS365/Akkordklar> skal følgende være synligt på `main`:

- `AGENTS.md`
- `CODEX_OPGAVE_01.md`
- `package.json`
- `dist/engine.mjs`, `dist/calculators.mjs`, `dist/app.mjs`
- `tests/` og `scripts/`
- `android/`, `ios/` og `capacitor.config.json`, **hvis de findes i den nyeste fulde ZIP**

Vær sikker på, at ingen `node_modules`, tokenfiler, private adgangsnøgler eller lokale caches er kommet med. `dist/` skal være med.

## D. Forbind repoet til Codex Cloud

1. Åbn **Codex** via ChatGPT eller <https://chatgpt.com/codex>.
2. Vælg dit korrekte ChatGPT-workspace og forbind GitHub, hvis Codex beder om det. Det er ikke nok, at GitHub allerede er forbundet til almindelig ChatGPT; Codex-miljøet skal også have repo-adgang.
3. Giv Codex/GitHub-installationen adgang til `ReneLS365/Akkordklar` (helst kun dette repository frem for alle repos).
4. På Codex web/desktop: opret et **cloud environment**, vælg `ReneLS365/Akkordklar`, standardbranch `main`, og publicér miljøet efter setup.
5. Vælg passende Node-version og setup-kommando efter det faktiske `package.json` og lockfil. Tilføj ikke unødvendige dependencies. Kontrollér at Codex kan se `AGENTS.md` og køre `node --test`.
6. Start en ny opgave i dette miljø og indsæt indholdet af `CODEX_OPGAVE_01.md` som første prompt.
7. Lad Codex arbejde på en branch/PR, gennemgå diffs og testresultater, og merge først når de er acceptable.

**Vigtigt:** Den eksisterende `https://akkordklar-transport-ven.renels.chatgpt.site` er en separat hostingflade. GitHub og Codex synkroniserer kildekoden med hinanden, men opdaterer ikke denne liveadresse uden en særskilt, verificeret deployment-løsning. Først når den er identificeret og godkendt, skal deploy automatiseres.

## E. Prisregel for hele projektet

**Akkordklar anvender 2026-priser, ikke 2025-priser.** 2026-PDF-en er den aktive prisliste for alle tal i appen fra 1. januar 2026 til 28. februar 2027. Den oprindelige 2025-priskurant har alene en fagretlig/fortolkningsmæssig rolle som beskrevet i kilderne. Kontrollér `AGENTS.md` for detaljer og undgå enhver automatisk fallback til 2025-beløb.

## F. Kontrol efter første Codex-opgave

- [ ] `AGENTS.md` bliver faktisk læst fra repoets rod.
- [ ] Codex arbejder i det rigtige repo og på en branch, ikke en tom demo.
- [ ] Før/efter tests er dokumenteret.
- [ ] Transport over 55 m uden hjul giver ikke automatisk en hjulprocent.
- [ ] Der er ingen fejl i G/T/H-grundlag eller demontage-transport.
- [ ] GitHub Actions kører på PR og passerer, hvis Codex oprettede CI-filen.
- [ ] Ingen har lovet automatisk live-opdatering uden fungerende deploy.

Officielle vejledninger:
- GitHub: <https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository>
- Codex Cloud: <https://help.openai.com/en/articles/20001545-using-codex-cloud>
- OpenAI om `AGENTS.md`: <https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex>

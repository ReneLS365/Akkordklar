# Akkordklar – udgivelsesgrundlag

Status: fungerende webapp, Android-projekt og iOS-projekt. Der er ikke bygget eller signeret en APK/AAB/IPA, og appen er ikke indsendt til butikkerne. Android SDK og macOS/Xcode-signering er ikke tilgængelig i denne opgave.

## Lokal kontrol

```sh
npm ci
npm run check
npm test
npm run native:sync
```

`dist/` er den fælles app. Browserlokal lagring og beregninger kræver ingen server. Native platforme indlæser filerne fra den installerede app. Projektets foreløbige bundle/package-id er `dk.akkordklar.transport`; kontrollér identiteten, før første butiksudgivelse.

## Android / Google Play

1. Åbn projektet med `npx cap open android` i en kompatibel Android Studio-installation med Android SDK.
2. Kontrollér app-id, titel, versionsnummer og appikon. Byg og afprøv på en fysisk Android-telefon, herunder offline, lagring, tastatur, eksterne PDF-links, sikkerhedskopi og deling.
3. Opret/brug ejerens Play Console-konto. Ejerens kontakt- og identitetsoplysninger skal være korrekte.
4. Opret og opbevar ejerens uploadnøgle sikkert. Gem aldrig nøgler, passwords eller signing credentials i Git.
5. Generér en signeret Android App Bundle via Android Studio. Brug Play App Signing efter ejerens kontovalg.
6. Udfyld butiksbeskrivelse, skærmbilleder, appkategori, aldersklassifikation, Data Safety, kontaktoplysninger og en offentlig privatlivspolitik.
7. Gennemfør den testproces, kontoen kræver. De konkrete krav til lukket test og produktionsadgang kontrolleres i ejerens aktuelle Play Console-konto.
8. Indsend til Googles kontrol. Et lokalt fungerende projekt er ikke en godkendt butiksudgivelse.

## iPhone / App Store

1. Brug macOS med den Xcode-version, den installerede Capacitor-version kræver.
2. Kør `npm ci`, `npm run native:sync` og `npx cap open ios`.
3. Kontrollér bundle-id, team, appnavn, version og ikoner i Xcode. Vælg ejerens Apple Developer-team til signering.
4. Test på en fysisk iPhone og med TestFlight. Kontrollér især safe areas, tastatur, offline, lagring, eksport og appgenstart.
5. Opret appen i App Store Connect. Udfyld navn, kategori, beskrivelse, skærmbilleder, privatlivsoplysninger, supportadresse/-URL, offentlig privatlivspolitik og aldersklassifikation.
6. Arkivér, signér og upload buildet fra Xcode. Vælg buildet i App Store Connect, og indsend til App Review.

## Forudsætninger før brug til faktiske akkordkrav

- Få beregningsmotor og regelfortolkning gennemgået af en priskurantkyndig. Appen må ikke markedsføres som godkendt af DI eller 3F, medmindre de faktisk har godkendt den.
- Kilder: den leverede vejledende 2026-priskurant, DI's officielle HP3 Provinsen 2025 og Hvidbog 2025.
- Faste kronebeløb gælder 1. januar 2026 til 28. februar 2027. Satser opdateres ikke automatisk.
- Teltgrundlag skal følge A35 (København/Nordsjælland). Appen indlæser ikke den prisbog; brugeren indtaster det korrekte grundlag.
- Husdiagrammet er en rektangulær transportmodel. En samlet montagepris kan fordeles automatisk ved ens montagepris pr. meter. Tilpassede sideandele forudsætter ens montagepris pr. meter inden for hver side. Begge forudsætninger står synligt og gemmes med resultatet; omkreds og meter alene dokumenterer ikke en faktisk materialefordeling. Faktiske zonebeløb kan fortsat bruges i avanceret tilstand.
- Flere transportmuligheder skal afklares før arbejdet, jf. Hvidbog A6.
- Ved mellemhøjder over 52 m kræver appen et oplyst/aftalt antal ekstra 3 m-trin, fordi den ikke selv vælger afrundingsfortolkningen.
- Særskilt betaling kræver et selvstændigt grundlag. Appen dokumenterer brugerens aftaleinput; den indgår ingen aftaler på brugerens vegne.

## Officielle tekniske kilder

- https://capacitorjs.com/docs/getting-started/environment-setup
- https://capacitorjs.com/docs/android
- https://capacitorjs.com/docs/ios
- https://developer.apple.com/app-store/submitting/
- https://support.google.com/googleplay/android-developer/answer/14151465

## Version 2.0

- Tre niveauer: Hurtig, Fordelt og Præcis, med fire tydelige transporttrin.
- Fuld montage-G før nedtagning; arbejdspris normalt 50 % G, T fortsat på fuldt G. G/T/H og non-G-priser holdes adskilt.
- Manuel transport uden hjul over 55 m kræver afklaring. Vejledende pkt. 27-visning kan ikke gemmes som afklaret krav. Særskilt aftale skal have sats, note og bekræftelse.
- Kran C1–C6, direkte A18-teltmontage, flere hejs, røde spærringer og manuelle zoneafstande. Samme transportstræk tælles kun én gang.
- Fordeling efter meter er et synligt overslag; sideandele kan opgives i kr./%. Præcis opgørelse har 88 verificerede materialeposter og manuel kildebelagt prisrække for øvrige dele.
- Alle zoner deles ved satsgrænser. Ingen 16-zonegrænse. Samlet transport beregnes før afsluttende beløbsafrunding.
- Komplet JSON-sikkerhedskopi af projekter, indtastninger, materiale-/områdegrundlag og gemte beregninger. Gamle ledger-only sikkerhedskopier kan stadig importeres.
- Web/PWA har udskriftsark til browserens PDF-funktion. Native deler et selvstændigt HTML-udskriftsark via enhedens delingsfunktion. Native PDF-dialog og fysiske enheder er ikke testet.
- Kildedokumenterne følger med appen i `dist/sources/` og indgår i offline-cachen.
- Faglige afklaringer og kildefejl er dokumenteret i `docs/AFKLARINGER.md` og `docs/REGELGRUNDLAG.md`.

## Verifikation

Se `docs/TEKNISK-RAPPORT.md` for faktisk kørt testantal, browserkontrol og kendte begrænsninger. Native projekter er synkroniseret med Capacitor; ingen APK/AAB/IPA er bygget eller signeret i denne opgave.

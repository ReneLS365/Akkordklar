# Teknisk rapport - Akkordklar 2.0

Dato: 31. oktober 2026.

## Fejl i den tidligere version

- Håndkraft uden hjul over 55 m gav ubetinget samme sats som hjul, selv om A6's ordlyd kræver afklaring.
- Transportfanen havde ingen samlet montage/demontage-beregning med tydelig adskillelse mellem halvt arbejds-G og fuldt T-G.
- A14 kontrollerede kun et samlet indtastet beløb uden særskilt halvering af relevante G ved demontage.
- Søjleberegningen afrundede enhedsprisen før multiplikation med antal, hvilket kunne flytte linjesummen.
- Manglende beregnere og særregler for G1/G3, afspærringshændelser, udskæring, lodrette dragere, blandet kørsel, timetillæg og indslusningsfordeling.
- JSON-sikkerhedskopien indeholdt kun gemte linjer og noter; aktuelle beregnerindtastninger og flere projekter var ikke med.
- Under udviklingskontrollen blev yderligere formularfejl rettet: remount ved checkboxklik, ID-generering i usikker lokal preview, forskellige kildevalg ved flere hejs, import-ID'er, genbrug af godkendelse efter pris-/ruteændring og tilgangslinjer gennem huset ved baghejs.

Den gamle motor delte allerede zoner ved grundlæggende satsgrænser. Denne korrekte funktion er bevaret og udvidet til flere hejs, spærringer og ruteskift.

## Gennemførte beregningsrettelser

- A6/A7/A8/pkt. 27: korrekte grænsetrin, forskel mellem10/15 m på stillads, truck 150/50 m og tydeligt afklaringskrav ved håndkraft uden hjul over 55 m.
- C1–C6/A18: egen aflæsningskran, ekstern afsætning og direkte teltmontage adskilt. Samme transportstræk afregnes én gang. A31 omlæsning tilføjes på det relevante fulde T-G.
- A13/A14: demontage halverer relevante arbejdsgrundpriser, ikke T-grundlaget; minimumsgrænsen kontrollerer de relevante pkt. 1–25, med særskilt afklaring ved grænseændrende halveøre.
- G/T/H-undtagelser indgår i88 verificerede materialeposter. Øvrige priser kan indtastes med navn, kilde og markeringer. Udvalget er ikke hele priskuranten.
- H, tag/telt, kip19h, arbejds-/montagedæk, afspærring, tæt finér/udskæring, kasseskærm, eftermontage, enheder, modullængder, søjler, kørsel, uddannelse/mentor og 60/40 er gennemgået og opdateret.
- Hvidbogens 60/40-trykfejl kopieres ikke:18×0,4 er7,2; den samlede akkordsum bevares ved slutfordeling af øre.

## Brugerflade og data

- Hurtig, Fordelt og Præcis med fire tydelige transporttrin.
- Én montagepris; sideandele i kr./%; faktiske materialer eller områdebeløb. Vægtet sats og samlet arbejdspris inklusive transport vises automatisk.
- Husdiagram med flere hejs/afsætninger, en eller begge ruter, røde spærringer, præcise satszoner og manuelle afstandsrettelser. Ingen 16-zonegrænse.
- Marineblå/grøn visning, store trykflader, responsiv CSS og eksplicit lys/mørk visning.
- Projekter, kopier, autolagring, komplette JSON-sikkerhedskopier, bagudkompatibel import og versionsmærkede beregningslinjer.
- Udskriftsvenligt webark til browserens PDF-funktion; native deling af selvstændigt HTML-udskriftsark. Mellemregninger, materialeposter, zoner, noter, regelversion og 3-arbejdsdages kritikfrist følger med.
- Begge kilde-PDF'er leveres i appen og i offline-cachen.

## Faktisk verifikation

- `npm run check`: alle JavaScript-filer parser, manifest og ikoner kontrolleret.
- `npm test`: **107 tests bestået, 0 fejl**. Heri 200 deterministiske geometri-konfigurationer med flere hejs og uafhængig punktkontrol inde i zonerne.
- Testene dækker transportgrænser, kran C1–C6, direkte A18-kran, opstart/omlæsning, demontage, minimum, G/T/H, 6.000/4.000 kr.-eksemplet, ørebevarelse, Hvidbogsregler, importvalidering og offline-filoversigt.
- Browserkontrol: 1.000 + 70 = 1.070; demontage med fuldt T-grundlag; håndkraft over 55 m med afklarings-/previewmarkering; sideandele og kr/%-skift; materialeopgørelse, gemning og genindlæsning; projektkopier; flere hejs/spærringer; lys/mørk visning.
- Diagramkontrol: 36 tilgangsruter samplet segmentvis uden punkter inde i husrektanglet.
- Native bridge er bygget og Capacitor synkroniseret til Android og iOS. Webfilerne er med i begge platformprojekter.

## Afklaringer og grænser

De fulde begrundelser står i `AFKLARINGER.md`. Det omfatter især uden hjul over 55 m, A8-forhold, flere mulige ruter, A18's anvendelsesområde og resttransport, A35-teltgrundlag, højder mellem 3 m-punkter over 52 m, grænseændrende halveøre ved A14 samt fradragsfordeling på blandede kørselsdage.

Browserkontrollen er udført i den tilgængelige cloudbrowser. CSS har mobil-/tabletbrudpunkter, men der er ikke udført test på fysiske telefoner eller fuld browseremulering af alle skærmstørrelser. Lokal preview bruger HTTP, så den egentlige serviceworker/offlinetilstand er ikke afprøvet interaktivt dér; cacheindhold og sikker cacheadfærd er automatisk kontrolleret.

Native builds, signering, Play/App Store-indsendelse og fysisk enhedstest er ikke udført. Appen er ikke fagretligt godkendt af DI/3F.

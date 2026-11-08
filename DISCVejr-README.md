# DiscVejr · Android-widget til discgolf

DiscVejr er en Android app-widget til Samsung/Android, som viser discgolf-relevant vejr for Kvaglund, Esbjerg.

Widgetten viser vind, vindstød, temperatur, føles-som-temperatur, regnrisiko de næste tre timer, solnedgang og en uofficiel discgolf-score (0-100).

## Hent APK

1. Besøg [GitHub Actions](https://github.com/ReneLS365/Akkordklar/actions/workflows/discvejr-apk.yml?query=branch%3Adiscvejr-widget).
2. Åbn seneste **DiscVejr Android APK** med grønt flueben.
3. Download **DiscVejr-Android-APK** under **Artifacts**.
4. Pak artifact-zip ud og installer **app-debug.apk** på Android.
5. Hold fingeren på startskærmen, vælg **Widgets**, find **DiscVejr**, og tilføj den.

GitHub kræver normalt login til download af Actions artifacts.

## Bygning

Projektfilerne ligger i kildesarkivet, der er opdelt i `discvejr-source.part0` og `discvejr-source.part1`. Build-workflowet samler, checksum-kontrollerer og udpakker dem til `discvejr_android/`. `gradle assembleDebug` producerer APK'en.

Build-scripts og kildekode er adskilt fra Akkordklar via grenen `discvejr-widget`; ændringer her påvirker ikke `main`.

## Data

Vejrprognose: Open-Meteo. Ingen API-nøgle, reklamer eller tracking. Lokationsadgang bruges kun, hvis du selv aktiverer det. Android kan begrænse baggrundsopdateringer.

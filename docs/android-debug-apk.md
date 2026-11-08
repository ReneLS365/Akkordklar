# Android debug-APK fra GitHub Actions

Workflow: `.github/workflows/android-debug.yml` → **Android Debug APK**.
Det eksisterende Capacitor 8-projekt bruges med app-id `dk.akkordklar.transport`,
versionName `2.0`, versionCode `4` og minimum Android 7.0/API 24. Ingen ændring i
appens identitet, dataformat, HP3-regler, webfunktioner eller live-hosting.

## Byg og download

Workflowet kører ved relevante pull requests og ændringer på main. Når workflowet
er på main, kan det også startes via **Actions → Android Debug APK → Run workflow**.

Det installerer Node 24, Java 21 og Android API 36, bruger projektets låste
npm-afhængigheder og eksisterende Gradle-wrapper 8.14.3. Efter syntaks- og
regressionstests bygges native bridge, `npx cap sync android` kopierer de aktuelle
webfiler og registrerer de eksisterende plugins, og `assembleDebug` bygger APK'en.
Der oprettes ikke et nyt Android-projekt.

Efter en grøn kørsel åbnes **Artifacts → akkordklar-android-debug-<run>-<attempt>**.
Download og udpak ZIP-filen. Den indeholder:

- `Akkordklar-debug.apk`: den installerbare, debug-signerede app.
- `SHA256SUMS.txt`: APK'ens checksum.
- `build-info.json`: app-id, version, kildecommit, kørsel og antal verificerede webfiler.

Artifacten gemmes i 30 dage, inden for repositoryets gældende grænser. Download
kræver adgang til repositoryet/kørslen. APK'en publiceres ikke som release eller
til en appbutik, og der foretages ingen ændring på live-sitet.

## Kontrol og installation

Før upload verificeres signaturen med `apksigner`, app-id/debugflag med `aapt`
og hver webfil byte for byte mod `dist/`. Capacitor-konfiguration og registrering
af Filesystem/Share kontrolleres også. Manglende eller forkert APK stopper jobbet.
Kun APK, checksum og metadata uploades; ingen keystore, signeringshemmeligheder,
brugerdata eller buildcache indgår i artifacten.

Installér APK-filen på en Android-enhed, eller brug `adb install -r Akkordklar-debug.apk`.
Android tillader opdatering af en eksisterende installation med bevarede appdata,
når app-id og signeringsnøgle matcher. Workflowet bruger Androids normale debugnøgle
på runneren; den er ikke en vedvarende produktionsnøgle og kan variere mellem kørsler.
En tidligere installation signeret med en anden nøgle kan derfor ikke overskrives
med denne APK. Workflowet afinstallerer eller nulstiller ingen app. Brug appens
sikkerhedskopi ved flytning mellem installationer; eksisterende web/PWA-data flyttes
ikke automatisk ind i en ny Android-installation.

Et bestået build dokumenterer bygbarhed, signatur og indhold. Fysisk enhedstest og
eventuel stabil releasesignering/appbutiksudgivelse er særskilte trin.

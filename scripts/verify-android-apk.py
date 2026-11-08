"""Check the built APK before uploading it as an Actions artifact."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import zipfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("apk", type=Path)
    parser.add_argument("--build-tools", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    config = json.loads((root / "capacitor.config.json").read_text())
    if config["appId"] != "dk.akkordklar.transport":
        raise ValueError("Akkordklars eksisterende app-id skal bevares.")

    subprocess.run([str(args.build_tools / "apksigner"), "verify", "--verbose", "--print-certs", str(args.apk)], check=True)
    badging = subprocess.check_output([str(args.build_tools / "aapt"), "dump", "badging", str(args.apk)], text=True)
    package = re.search(r"^package: name='([^']+)' versionCode='([^']+)' versionName='([^']*)'", badging, re.MULTILINE)
    if not package or package[1] != config["appId"]:
        raise ValueError("APK'ens package-id matcher ikke den eksisterende app.")
    if not re.search(r"^application-debuggable(?:\s|$)", badging, re.MULTILINE):
        raise ValueError("Det byggede artifact skal være en debug-APK.")

    assets = sorted(p for p in (root / config["webDir"]).rglob("*") if p.is_file())
    with zipfile.ZipFile(args.apk) as apk:
        if apk.testzip() is not None:
            raise ValueError("APK'ens ZIP-indhold er beskadiget.")
        for asset in assets:
            relative = asset.relative_to(root / config["webDir"]).as_posix()
            if apk.read(f"assets/public/{relative}") != asset.read_bytes():
                raise ValueError(f"APK'en indeholder en manglende eller gammel webfil: {relative}")
        native_config = json.loads(apk.read("assets/capacitor.config.json"))
        if native_config != config:
            raise ValueError("APK'ens Capacitor-konfiguration afviger fra kildefilen.")
        plugins = json.loads(apk.read("assets/capacitor.plugins.json"))
        if not {"@capacitor/filesystem", "@capacitor/share"}.issubset({p["pkg"] for p in plugins}):
            raise ValueError("Filesystem- eller Share-plugin mangler i APK'en.")

    args.output.mkdir(parents=True, exist_ok=True)
    output_apk = args.output / "Akkordklar-debug.apk"
    shutil.copyfile(args.apk, output_apk)
    digest = hashlib.sha256(output_apk.read_bytes()).hexdigest()
    (args.output / "SHA256SUMS.txt").write_text(f"{digest}  {output_apk.name}\n")
    metadata = {
        "applicationId": package[1],
        "versionCode": package[2],
        "versionName": package[3],
        "debug": True,
        "sha256": digest,
        "verifiedWebFiles": len(assets),
        "sourceCommit": os.environ.get("GITHUB_SHA") or subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip(),
        "runId": os.environ.get("GITHUB_RUN_ID"),
    }
    (args.output / "build-info.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"Verificeret debug-APK: {package[1]}, version {package[3]} ({package[2]}), {len(assets)} identiske webfiler.")
    print(f"SHA-256: {digest}")


if __name__ == "__main__":
    main()

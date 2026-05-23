# BUILD_APK_RUNBOOK — Chitti Vaani Android

**TWO paths.** Pick one. Both produce the same signed APK at the same GH Releases URL.

| Path | When to use | Time |
|---|---|---|
| **[A — GitHub Actions cloud build](#path-a--github-actions-cloud-build-recommended)** ⭐ | Default. You generate the keystore once, paste 4 secrets into GitHub, then every `git tag v… && git push --tags` builds + uploads automatically. | ~5 min one-time setup, then ~4 min per release |
| **[B — local build](#path-b--local-build-fallback)** | Diagnosing a CI failure, or no network access on the build machine. | ~20 min per release |

**Outcome (either path):** a signed `chitti-vaani-<tag>.apk` uploaded to `https://github.com/bryanwilfredpinto-ui/sahayai/releases/tag/<tag>`. [`download.html`](download.html) auto-updates its QR + Download button to whatever the latest release is — no page edit needed when you ship a new version.

> **Read this before you start (BOTH paths):** the release keystore generated in Step 2 is **the** signing key for every future update of this app on the Play Store. If it is committed to the repo (even once, even in a deleted file), the key is **burnt** — you cannot ship updates to existing installs ever again. The `.gitignore` already refuses `*.jks`, `*.keystore`, `keystore.properties`, `*.apk`, `*.aab`. Always verify with `git status` before committing.

---

# Path A — GitHub Actions cloud build (recommended)

The workflow at [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) runs on every tag push matching `v*`. It installs JDK 17 + Android SDK on a fresh Ubuntu runner, decodes the release keystore from the `KEYSTORE_BASE64` secret, builds + signs the APK, verifies the signature, and uploads to a GitHub Release named after the tag.

## A1 — Generate the release keystore (one-time, KEEP SECRET FOREVER)

Same as the local path. Do this on your Windows laptop (you said you have JDK 17 + Android Studio now).

```powershell
# Make a directory OUTSIDE the repo
mkdir $env:USERPROFILE\.chitti-keystores -Force

# Generate the keystore. keytool prompts for:
#   - keystore password (pick a strong 16+ char string)
#   - key password (hit Enter to reuse the keystore password)
keytool -genkey -v `
  -keystore $env:USERPROFILE\.chitti-keystores\chitti-vaani-release.jks `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -alias chitti `
  -dname "CN=Chitti Vaani, OU=Sahay AI, O=Bryan Wilfred Pinto, L=Bangalore, S=KA, C=IN"
```

**Save the password in 1Password / Bitwarden right now.** Losing it = burning the Play Store key.

## A2 — Base64-encode the keystore (PowerShell one-liner)

```powershell
$bytes = [System.IO.File]::ReadAllBytes("$env:USERPROFILE\.chitti-keystores\chitti-vaani-release.jks")
$b64   = [Convert]::ToBase64String($bytes)
# Single-line, no wraps — that's what GitHub secrets expects.
$b64 | Out-File -FilePath "$env:USERPROFILE\.chitti-keystores\release.jks.base64.txt" -Encoding ascii -NoNewline
Write-Host "Base64 length: $($b64.Length) chars · written to release.jks.base64.txt"
```

## A3 — Add the 4 secrets to GitHub

### Via `gh` CLI (fastest — you said you have it installed)

Run from the repo root:

```powershell
cd C:\Users\DELL\sahayai\sahayai
gh auth status   # must say "Logged in to github.com"; if not: gh auth login

gh secret set KEYSTORE_BASE64   < "$env:USERPROFILE\.chitti-keystores\release.jks.base64.txt"
gh secret set KEYSTORE_PASSWORD --body "PASTE_YOUR_KEYSTORE_PASSWORD_HERE"
gh secret set KEY_ALIAS         --body "chitti"
gh secret set KEY_PASSWORD      --body "PASTE_YOUR_KEY_PASSWORD_HERE"

# Verify all four are present (values are never shown, just the names):
gh secret list
```

You should see:

```
KEY_ALIAS         Updated …
KEY_PASSWORD      Updated …
KEYSTORE_BASE64   Updated …
KEYSTORE_PASSWORD Updated …
```

### Via the web UI (alternative)

1. Open `https://github.com/bryanwilfredpinto-ui/sahayai/settings/secrets/actions`
2. Click **New repository secret** for each of the four:
   - `KEYSTORE_BASE64` → paste the **entire** contents of `release.jks.base64.txt` (one long line, no leading/trailing whitespace)
   - `KEYSTORE_PASSWORD` → your keystore password
   - `KEY_ALIAS` → `chitti`
   - `KEY_PASSWORD` → your key password (often the same as keystore password)
3. Click **Add secret** after each.

## A4 — Push a tag to trigger the build

```powershell
cd C:\Users\DELL\sahayai\sahayai
git tag v1.0.0-test
git push origin v1.0.0-test
```

## A5 — Watch the build

```powershell
gh run watch              # blocks until the run finishes
# OR list runs and follow a specific one:
gh run list --workflow=build-apk.yml --limit 5
gh run view <run-id> --log
```

You can also open `https://github.com/bryanwilfredpinto-ui/sahayai/actions` to see the run in the web UI.

## A6 — Done

After ~4 minutes the workflow finishes and you get:

- **Release page**: `https://github.com/bryanwilfredpinto-ui/sahayai/releases/tag/v1.0.0-test`
- **APK download**: `https://github.com/bryanwilfredpinto-ui/sahayai/releases/download/v1.0.0-test/chitti-vaani-v1.0.0-test.apk`
- **QR code on `sahayai.in/download.html`** auto-points at this URL — refresh the page on your phone, scan, install.

## A7 — Ship a new version later

Same flow — change the tag, push, done.

```powershell
git tag v1.0.1-test
git push origin v1.0.1-test
```

The download page picks up the new tag automatically (it fetches `/repos/.../releases?per_page=1` on load and updates the QR + button). Zero page edits.

## A8 — Common failures and what they mean

| Symptom | Cause | Fix |
|---|---|---|
| Workflow fails at "Validate required secrets" | One of the four secrets isn't set | Re-run A3 and check `gh secret list` shows all four |
| Workflow fails at "Decode release keystore" with "Decoded keystore is empty" | `KEYSTORE_BASE64` value has line wraps or trailing newline | Re-paste the base64 as a single line (the PowerShell `-NoNewline` flag in A2 is what makes this work). Don't open the .txt in Notepad — it inserts CRLF |
| Workflow fails at "keytool -list" | Wrong `KEYSTORE_PASSWORD` | Update the secret with the actual password you used in A1 |
| Workflow fails at "Verify signature" with "CN=Android Debug" | gradle ran but didn't pick up the env vars — usually a path bug | Open the run log; the line `Decoded keystore size: …` should be > 2KB. If it's 0 the decode failed silently — see the row above |
| Workflow fails at gradle build with "Could not find …" | `compileSdk` 34 packages missing | The action `android-actions/setup-android@v3` should install them; check the "Set up Android SDK" step log |
| Tag pushed but no workflow ran | Tag doesn't match `v*` (e.g. `1.0.0-test` without the `v`) | `git tag -d <bad>` then re-tag with `v` prefix |

## A9 — Triggering a manual build (no tag)

Useful for debugging the workflow itself without polluting the release list.

```powershell
gh workflow run build-apk.yml --field tag_name=v0.0.0-debug-$(Get-Date -Format yyyyMMddHHmm)
```

The build runs and uploads to a pre-release with that tag name. Delete the test release afterwards:

```powershell
gh release delete v0.0.0-debug-… --yes
git push origin :refs/tags/v0.0.0-debug-…
```

---

# Path B — local build (fallback)

Same toolchain, same outcome, but everything runs on your laptop. Use this only when CI is failing in a way you need to debug locally, or when you have no network access.

## Step 0 — Toolchain on the build machine (one-time)

| Tool | Why | Install |
|---|---|---|
| JDK 17 (Temurin) | Kotlin / gradle target JVM | https://adoptium.net/ |
| Android Studio (Hedgehog or newer) | Bundles Android SDK + gradle | https://developer.android.com/studio |
| Android SDK Platform 34 + Build-Tools 34.0.0 | `compileSdk = 34` in `app/build.gradle.kts` | Open Studio → SDK Manager → tick "Android 14.0 (UpsideDownCake)" |
| GitHub CLI (`gh`) | Uploads the APK to the Release | https://cli.github.com/, then `gh auth login` |

Verify on Windows PowerShell:

```powershell
java -version          # should say 17.x
sdkmanager --version   # should be 11.0+
gh auth status         # should say "Logged in to github.com"
```

---

## Step 1 — Generate the gradle wrapper (one-time per repo)

The repo is intentionally binary-free, so `gradlew` / `gradle/wrapper/gradle-wrapper.jar` are not committed. Run **once** on this machine:

```powershell
cd C:\path\to\sahayai\chitti-vaani-android
gradle wrapper --gradle-version=8.7
```

This creates `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.properties`, and `gradle/wrapper/gradle-wrapper.jar` **locally only** — do NOT commit them (the repo's `.gitignore` does not block these because they are valid gradle artefacts, but per [chitti-vaani-android/TODO.md §Phase 2.1](chitti-vaani-android/TODO.md) Sire's rule is "keep the repo binary-free"). If you want to commit the wrapper text files (everything except the jar) that is fine; the jar stays out.

---

## Step 2 — Generate the release keystore (one-time, KEEP SECRET FOREVER)

```powershell
# Generate the keystore OUTSIDE the repo. Recommended location:
#   %USERPROFILE%\.chitti-keystores\chitti-vaani-release.jks
mkdir $env:USERPROFILE\.chitti-keystores

keytool -genkey -v `
  -keystore $env:USERPROFILE\.chitti-keystores\chitti-vaani-release.jks `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -alias chitti `
  -dname "CN=Chitti Vaani, OU=Sahay AI, O=Bryan Wilfred Pinto, L=Bangalore, S=KA, C=IN"
```

When prompted for the **keystore password**: pick a strong 16+ char string. Save it to a password manager (1Password / Bitwarden), NOT plain text. When prompted for the **key password**: hit Enter to reuse the same password.

> **Belt-and-braces:** also export the JKS to a JKS-format backup in two separate locations (cloud + USB stick). Losing this file = losing the ability to update the Play Store listing.

---

## Step 3 — Set env vars the gradle build reads

The `signingConfig` block in [chitti-vaani-android/app/build.gradle.kts](chitti-vaani-android/app/build.gradle.kts) reads four env vars. None of them touch the repo.

```powershell
$env:CHITTI_KEYSTORE_PATH = "$env:USERPROFILE\.chitti-keystores\chitti-vaani-release.jks"
$env:CHITTI_KEYSTORE_PASS = "<the password from Step 2>"
$env:CHITTI_KEY_ALIAS     = "chitti"
$env:CHITTI_KEY_PASS      = "<same as KEYSTORE_PASS unless you changed it>"
```

To make these survive shell restarts (recommended for build machines):

```powershell
[Environment]::SetEnvironmentVariable("CHITTI_KEYSTORE_PATH", "$env:USERPROFILE\.chitti-keystores\chitti-vaani-release.jks", "User")
[Environment]::SetEnvironmentVariable("CHITTI_KEYSTORE_PASS", "<password>", "User")
[Environment]::SetEnvironmentVariable("CHITTI_KEY_ALIAS", "chitti", "User")
[Environment]::SetEnvironmentVariable("CHITTI_KEY_PASS", "<password>", "User")
```

---

## Step 4 — Build the signed release APK

```powershell
cd C:\path\to\sahayai\chitti-vaani-android
.\gradlew.bat clean assembleRelease
```

Expected output in **`app\build\outputs\apk\release\app-release.apk`**.

Verify the APK is signed (not the default debug key):

```powershell
"$env:USERPROFILE\AppData\Local\Android\Sdk\build-tools\34.0.0\apksigner.bat" verify --print-certs app\build\outputs\apk\release\app-release.apk
```

The "Signer #1" CN should match the `-dname` you set in Step 2 (`CN=Chitti Vaani, ...`). If it says `CN=Android Debug, ...`, gradle did not pick up your env vars — re-check Step 3 and re-run Step 4 in the same shell.

Rename for the release tag:

```powershell
copy app\build\outputs\apk\release\app-release.apk app\build\outputs\apk\release\chitti-vaani-v1.0.0-test.apk
```

---

## Step 5 — Upload to GitHub Release

```powershell
cd C:\path\to\sahayai

gh release create v1.0.0-test `
  --title "Chitti Vaani v1.0.0-test" `
  --notes "First-tester APK for Bryan + Sire's circle. Sideload only. Play Store submission lands in Phase 2.6." `
  chitti-vaani-android\app\build\outputs\apk\release\chitti-vaani-v1.0.0-test.apk
```

Verify the release went up:

```powershell
gh release view v1.0.0-test
```

The download URL pattern is:

```
https://github.com/bryanwilfredpinto-ui/sahayai/releases/download/v1.0.0-test/chitti-vaani-v1.0.0-test.apk
```

[sahayai.in/download.html](download.html) reads this exact URL — it'll go live automatically after the upload finishes. Refresh the page on your phone, scan the QR code, sideload.

---

## Step 6 — User install on a test phone (Hindi + English)

Both scripts are already on [download.html](download.html). For convenience:

**English (5 steps):**
1. Open `sahayai.in/download.html` on your Android phone (or scan the QR code from this page on your laptop).
2. Tap **Download APK**.
3. When Chrome warns "This file may be harmful": tap **Download anyway**. (This warning fires for every APK that didn't come from Play Store — not specific to Chitti.)
4. Open the APK. Android will say **"For your security, your phone isn't allowed to install unknown apps from this source."** — tap **Settings**, toggle **Allow from this source**, go back.
5. Tap **Install**. After a few seconds, **Open**. Done.

**Hindi (5 steps):**
1. अपने Android फ़ोन पर `sahayai.in/download.html` खोलिए (या QR code scan कीजिए)।
2. **Download APK** दबाइए।
3. Chrome कहेगा "यह file harmful हो सकती है" — **Download anyway** दबाइए। (हर APK पर यह warning आती है जो Play Store से नहीं है — Chitti specific नहीं है।)
4. APK खोलिए। Android कहेगा "अनजान source से install allowed नहीं है" — **Settings** दबाइए, **Allow from this source** चालू कीजिए, वापस आइए।
5. **Install** दबाइए। फिर **Open**। बस।

---

## Step 7 — Verify on the test phone

After install, run through this checklist on the phone. Anything that fails goes into the README's "known issues" before sharing the link beyond Sire's circle.

| # | Test | Pass criteria |
|---|---|---|
| 1 | First launch | Device Registration overlay appears immediately after T&C consent. Brand → Model cascades. |
| 2 | OTP send | "Send OTP" → check `/api/vaani/channels/health` shows the actual SMS provider state. Demo mode shows banner. |
| 3 | Gmail connect | Tap "Connect Gmail" → Google consent screen opens in the WebView. Callback redirects back. |
| 4 | Activate | Tap Activate → Chitti speaks "Namaste {name}, Chitti aapke {brand} {model} par taiyaar hai". |
| 5 | Make a call | Pro Card → pick a contact → "haan" → Android dials directly (not just opens the dialer). |
| 6 | Send SMS | Pro Card → pick contact → write message → "haan" → toast "SMS sent" (the SIM actually transmits). |
| 7 | WhatsApp call | Pro Card → pick contact → opens WhatsApp's call screen on that contact. |
| 8 | Open any app | Pro Card → pick "BookMyShow" → the actual BookMyShow app launches (or Play Store entry if not installed). |
| 9 | Lock phone | Voice "Chitti, phone lock" → screen locks instantly. (Device Admin must have been granted once.) |
| 10 | Emergency | Say "bachao" → confirm-with-master prompt fires → 10s alarm bypassing silent → spouse-tier call. Never auto-dials 112. |
| 11 | **GOLDEN RULE — confirm before every action** | Tap **🔒 Lock my phone** → the `#chitti-confirm-overlay` modal MUST appear with *"Sire, kya main aapka phone abhi lock kar dun?"* spoken aloud. Tap **Nahi / No** → Chitti speaks *"Theek hai, rok diya"* and **does NOT lock**. Tap Lock again → say **haan** via voice → Chitti locks. Repeat for Silent, Flashlight, Camera, Dialer role, Call screening, Open-any-app. No card should ever act on first tap. (Comms cards Call/SMS/WA/UPI/Email already have their own readback+haan flow — those are also compliant.) |
| 12 | **GOLDEN RULE — silence = wait** | Tap **🔒 Lock my phone** → modal appears → say **nothing**, do **nothing**. After 30 s the modal MUST still be open, action MUST NOT have fired. Tap **STOP — never mind** to dismiss. |
| 13 | **GOLDEN RULE — voice-intent gate** | Speak *"lock my phone"* into the mic. Modal MUST appear asking *"Sire, shall I lock your phone now?"* — voice command alone is not consent. Same for *"camera kholo"*, *"torch on"*, *"AIIMS le chalo"*, *"answer call"*. |

If any of these fail, capture the failure with `adb logcat | grep AuditLog` (the `AuditLog.append` calls written into every bridge method give you the exact failure reason).

---

## Step 8 — Update the release later

When you ship v1.0.1 etc., **reuse the same keystore**. Bump versionCode + versionName in [chitti-vaani-android/app/build.gradle.kts](chitti-vaani-android/app/build.gradle.kts), re-run Steps 4 + 5 with a new tag (`v1.0.1-test`), and [download.html](download.html) will surface the new tag.

---

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| `Plugin [id: 'com.android.application'] was not found` during gradlew | Android SDK path not exported | Set `ANDROID_HOME` to `%LOCALAPPDATA%\Android\Sdk` |
| `Keystore file '' not found` | Step 3 env vars not in the gradle shell | Re-run Step 3 in the same PowerShell session that runs Step 4 |
| APK installs but crashes on launch | WebView URL unreachable (network) or content security policy mismatch | Check `adb logcat | grep "ChittiNative\|MainActivity"` — usually the JS bridge is fine, but `sahayai.in/chitti_vaani.html` failed to load |
| `gh release create` says "release already exists" | Tag collision | `gh release delete v1.0.0-test --yes && <re-run Step 5>` — only safe before testers downloaded it; otherwise bump to `v1.0.0-test.1` |
| Play Store rejection later for SEND_SMS | Expected per [TODO.md §Phase 2.6](chitti-vaani-android/TODO.md) | Paste the per-permission justification from [chitti-vaani-android/README.md](chitti-vaani-android/README.md) into the rejection-reply box; usually accepted on the 2nd or 3rd cycle |

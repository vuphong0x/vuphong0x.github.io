# CI/CD for Android

Continuous Integration and Continuous Deployment (CI/CD) pipelines completely automate the process of building, testing, signing, and releasing Android artifacts (APKs and AABs) to Google Play. 

## 1. Why use CI/CD in Android?
- **Consistency:** Every build runs in an identical Linux environment (usually Ubuntu). Eliminates the "it works on my machine" problem.
- **Safety:** Pull Requests cannot be merged if unit tests or UI tests fail in the pipeline.
- **Velocity:** Automatic deployment to QA (via Firebase App Distribution) or Alpha/Beta tracks avoids manual clicking in Android Studio.

## 2. Common Tools
- **GitHub Actions / GitLab CI / Bitrise:** The machines (runners) that execute the scripts. Bitrise is particularly popular in mobile because it handles macOS/Android environment setups perfectly out of the box.
- **Fastlane:** A Ruby-based tool acting as the brains of the operation. It interfaces directly with the Google Play Developer Console API to upload metadata, screenshots, and AAB files.

## 3. Basic Workflow

A typical production Android CI/CD workflow:

### A. On Pull Request (Continuous Integration)
1. Trigger event on PR creation.
2. Checkout source code.
3. Validate `ktlint` or `detekt` (ensure coding standards).
4. Run standard JUnit local unit tests (`./gradlew testDebugUnitTest`).
5. *Optional:* Run UI tests on a Firebase Test Lab matrix (costs money but is incredibly robust).
6. Build a Debug APK to ensure nothing is fundamentally broken (`./gradlew assembleDebug`).

### B. On Merge to `main` (Continuous Delivery)
1. Run all PR checks again.
2. Build Release App Bundle (`./gradlew bundleRelease`).
3. Sign the AAB securely using a Keystore injected via GitHub Secrets.
4. Upload to Firebase App Distribution via Fastlane so QA testers get an immediate email with the new version.

### C. On Tagged Release (Continuous Deployment)
1. Trigger when a tag like `v1.2.0` is pushed.
2. Fastlane downloads signing keys.
3. Fastlane compiles `bundleRelease`.
4. Fastlane uploads the AAB directly to Google Play Console's Internal Testing or Beta tracks.

## 4. Keystore Security
**Never commit your `keystore.jks` file to your public repository!** 
Encode your keystore into a Base64 string, save it in GitHub Secrets, and then decode it back into a file dynamically during the CI pipeline run before executing `./gradlew assembleRelease`.

```yaml
# GitHub Actions Example decoding keystore
- name: Decode Keystore
  id: decode_keystore
  uses: timheuer/base64-to-file@v1.2
  with:
    fileName: 'keystore.jks'
    encodedString: ${{ secrets.KEYSTORE_BASE64 }}
```

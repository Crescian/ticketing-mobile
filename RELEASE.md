# Releasing ICT Support (Android)

The app is built on Expo's servers (EAS Build), so no Android Studio is needed.
Employees install it as an APK file: there's no Play Store listing yet.

Run the commands from `~/projects/ticketing-mobile`. Load Node 22 first:
`export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`.

## One-time setup

| # | Step | Command / where |
|---|---|---|
| 1 | Log in to Expo (free account at expo.dev) | `npx eas-cli@latest login` |
| 2 | Link this app to your Expo account. This writes `extra.eas.projectId` into `app.json`, which push needs. | `npx eas-cli@latest init` |
| 3 | Firebase project → add Android app `com.leoniogroup.ictsupport` → download `google-services.json` into this folder. `app.config.ts` picks it up automatically. | console.firebase.google.com |
| 4 | Firebase → Project settings → Service accounts → **Generate new private key**. Upload it so Expo can send pushes: choose Android → production → Google Service Account → FCM V1. | `npx eas-cli@latest credentials` |
| 5 | *(Optional)* Microsoft sign-in: put the Azure mobile client ID in `.env.local` as `EXPO_PUBLIC_AZURE_CLIENT_ID`, and on the server as `AZURE_MOBILE_CLIENT_ID`. For cloud builds, also add it as an EAS environment variable. | `.env.local`, `npx eas-cli@latest env:create` |

After step 2, also run `npx eas-cli@latest update:configure`. It adds the update URL that over-the-air fixes need. Then commit `app.json`.

## Builds

| Build | Command | Use |
|---|---|---|
| Development | `npx eas-cli@latest build -p android --profile development` | Our own testing. Install the APK once, then run `npx expo start --tunnel` and open the project in that app instead of Expo Go. Push works here. |
| Preview (pilot) | `npx eas-cli@latest build -p android --profile preview` | A standalone APK for employees. The build page gives a download link and QR code. |
| Production | `npx eas-cli@latest build -p android --profile production` | An AAB, for a later Play Store listing. |

Employees installing an APK must allow "Install unknown apps" for their browser once. Android asks them when they open the file.

### Shipping fixes without a new APK
JavaScript-only fixes (screens, text, logic) can be sent over the air to installed apps:

```
npx eas-cli@latest update --channel preview --message "Fix …"
```

The app picks the update up the next time it starts. A **new APK** is required when:
- a native package is added;
- `app.json` / `app.config.ts` native settings change (permissions, icons, Firebase);
- `version` is bumped. `runtimeVersion` follows `version`, so updates only reach builds with the same version.

## Pilot test checklist

Run this on the **preview APK** with the test account `mobile.test@leoniogroup.com` before handing it out.

- Tell Helpdesk first: every test request lands in their real queue and emails them.
- Cancel the test requests afterwards.

**Sign in**
- [ ] Wrong password shows "The provided credentials are incorrect."
- [ ] Sign in works. The welcome tour shows once, and doesn't come back after restarting the app.
- [ ] Closing and reopening the app keeps you signed in.
- [ ] *(If configured)* "Sign in with Microsoft" works.

**Requests**
- [ ] New Request with a camera photo and a PDF. Shows the ticket number, and Helpdesk sees it on the web.
- [ ] Edit the request before Helpdesk acknowledges it, and the change shows on the web.
- [ ] Helpdesk acknowledges it on the web. Edit and Cancel disappear after pulling to refresh.
- [ ] The tracker on the phone matches the web at each step.
- [ ] At "Confirm": the service report PDF opens, confirming closes the request, and the rating is saved and shows on the web.
- [ ] Cancel a second test request while it's still Submitted.

**Chat**
- [ ] Phone → web: the message and a photo arrive in the web chat.
- [ ] Web → phone: the reply appears within about 10 seconds. The badge shows on the card and the tab, and clears after opening the chat.
- [ ] Your message shows "Seen" after Helpdesk opens the chat.

**Notifications** (with the app closed)
- [ ] Helpdesk assigns the request → "Request scheduled" push. Tapping it opens the ticket.
- [ ] Helpdesk sends a message → push. Tapping it opens the chat.
- [ ] The Updates tab lists both, with a badge that clears after visiting.
- [ ] Signing out stops the pushes.

**Other**
- [ ] Airplane mode → the offline bar appears. Switching it off makes the data reload.
- [ ] Profile → Change password works, and the old password is rejected at the next sign-in.
- [ ] Dark mode is readable.

## Rollout
1. Pilot: 3–5 employees from different departments, for about a week. Collect feedback.
2. Fix issues. Use `eas update` for JavaScript fixes; build a new preview APK for native changes.
3. Wider rollout: share the APK link (or push it through MDM), with a short "how to install" note.
4. Later: Play Store internal testing track (`production` profile, $25 Play Console account), then iOS once there's an Apple Developer account.

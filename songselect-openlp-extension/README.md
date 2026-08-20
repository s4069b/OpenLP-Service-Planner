# SongSelect → OpenLP Service Planner browser extension

Experimental Edge/Chrome Manifest V3 extension.

## Install
1. Unzip this folder.
2. Edge: open `edge://extensions`. Chrome: open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select this folder.
5. Open the extension's **Details → Extension options** and enter your deployed OpenLP Service Planner URL. This is required before first use.
6. Grant access to that Planner site when prompted.

## Use
1. In the Planner enable **Settings → Extensions → SongSelect Browser Bridge (Experimental)**.
2. Sign into SongSelect normally.
3. Open a song's **Lyrics** page.
4. Click **Send to OpenLP**.
5. The extension switches back to the Planner tab that opened SongSelect and presents the imported song for duplicate checking / merge. If that tab no longer exists, it opens the configured Planner as a fallback.

The extension does not request or store your CCLI password. It uses your normal signed-in SongSelect tab. SongSelect's normal Lyrics Download action is triggered as part of the transfer.


This extension source is bundled with OpenLP Service Planner v1.80.0 and can be customised for self-hosted deployments through its Options page.

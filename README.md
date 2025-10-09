# Spamurai

## Overview
Manifest is set to YouTube, so the scripts won’t run on other pages.
---

## Hardware Requirements

- Chrome latest version
- Operating system: Windows 10 or 11; macOS 13+ (Ventura and onwards); Linux; or ChromeOS (from Platform 16389.0.0 and onwards) on Chromebook Plus devices. Chrome for Android, iOS, and ChromeOS on non-Chromebook Plus devices are not yet supported by the APIs which use Gemini Nano.
- Storage: At least 22 GB of free space on the volume that contains your Chrome profile. (it is small in size but won't isnstall if not enough free space)
  
---

## How to use Spamurai

1. Pull the main branch of the Spamurai repo.
2. Go to chrome://extensions/, enable Developer Mode, then click Load unpacked and select the Spamurai-AI-web-extension folder.
3. Go to any YouTube video page.
4. Open the developer console and paste the following to download the AI model:
``const session = await LanguageModel.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});``
5. Spamurai will automatically scan and highlight spam comments.

## Troubleshooting

If Spamurai AI isn’t working properly, follow these steps:

1. Open a new tab and go to: chrome://flags
2. Set "Enables optimization guide on device" to "Enabled BypassPerfRequirement"
3. Set "Prompt API for Gemini Nano" to "Enabled"
4. Then relaunch Chrome

---

## How the Scraper Works

1. Navigate to a YouTube video page.  
2. The console will log the video title, and the observer will be waiting.  
3. Whenever you scroll down, the observer detects the first 20 comments (or however many load) and outputs them as a logged array.

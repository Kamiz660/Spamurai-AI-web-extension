## Overview
Manifest is set to YouTube, so the scripts won’t run on other pages.
---

## How the Scraper Works

1. Navigate to a YouTube video page.  
2. The console will log the video title, and the observer will be waiting.  
3. Whenever you scroll down, the observer detects the first 20 comments (or however many load) and outputs them as a logged array.

---

## How to use Spamurai

1. Open a new tab and go to: chrome://flags
2. Set "Enables optimization guide on device" to "Enabled BypassPerfRequirement"
3. Set "Prompt API for Gemini Nano" to "Enabled"
4. Then relaunch chrome
4. Then go to the developer console and download the model with this script: 
``const session = await LanguageModel.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});``
5. Pull the main branch of the Spamurai repo
6. Go to chrome://extensions/ and enable developer mode, then click load unpacked and select the Spamurai-AI-web-extension
7. Go to a YouTube video page.  
8. Spamurai will now automatically scan and highlight spam comments




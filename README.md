## Overview
Manifest is set to YouTube, so the scripts won’t run on other pages.
---

## How the Scraper Works

1. Navigate to a YouTube video page.  
2. The console will log the video title, and the observer will be waiting.  
3. Whenever you scroll down, the observer detects the first 10 comments (or however many load) and outputs them as a logged array.

---

## How to use Spamurai

1. Then go to the developer console and download the model with this script: 
``const session = await LanguageModel.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});``
2. Pull the main branch of the Spamurai repo
3. Go to chrome://extensions/ and enable developer mode, then click load unpacked and select the Spamurai-AI-web-extension
4. Go to a YouTube video page.  
5. Spamurai will now automatically scan and highlight spam comments




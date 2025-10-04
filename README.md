## Overview
Manifest is set to YouTube, so the scripts won’t run on other pages.
---

## How the Scraper Works

1. Navigate to a YouTube video page.  
2. The console will log the video title, and the observer will be waiting.  
3. Whenever you scroll down, the observer detects the first 10 comments (or however many load) and outputs them as a logged array.

---

## How the AI Works

1. Go to a YouTube video page.  
2. Open the popup and click "Run."  
3. The console may take some time if it’s the first run and the AI model hasn’t downloaded yet.  
4. The script outputs a JSON array labeling each example comment as `spam` or `not spam`.
5. 

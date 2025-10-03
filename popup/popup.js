document.getElementById("onButton").addEventListener("click", async () => {
  if (!window.LanguageModel) {
    console.error("Prompt API not available");
    return;
  }

  try {
    const session = await LanguageModel.create();
    console.log("AI session started");
    
    //sample txt
    const comments = [
      "Buy cheap watches now!",
      "I love this video!",
      "Click here for free coins!"
    ];

    const prompt = `
      You are a spam-detecting AI.
      Classify each comment as "spam" or "not spam".
      Respond only with a JSON array of objects like this:
      [
        { "comment": "original comment", "label": "spam" or "not spam" }
      ]
      Comments: ${JSON.stringify(comments)}
    `;

    const result = await session.prompt(prompt);

    // Strip triple backticks in case ai might wrap the JSON in them (even if prompted not to)
    const cleaned = result.replace(/```json|```/g, '').trim();

    let parsed;
    try {
       parsed = JSON.parse(cleaned);
    } catch {
        console.error("Could not parse AI response:", cleaned);
        return;
    }

    console.log("Spam classification:", parsed);

  }catch (err) {
    console.error("Error using AI:", err);
  }
});

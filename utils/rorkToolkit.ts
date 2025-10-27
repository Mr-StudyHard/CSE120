export async function generateText(_options: { messages: any[] }) {
  // Minimal mock implementation for local dev / upgrade testing.
  // If you have the real `@rork/toolkit-sdk`, restore the original import.
  const textParts: string[] = [];
  try {
    const userMsg = _options.messages?.[0]?.content || [];
    for (const item of userMsg) {
      if (item?.type === "text") {
        textParts.push(item.text);
      }
      if (item?.type === "image") {
        textParts.push("[image data omitted]");
      }
    }
  } catch (e) {
    // ignore
  }
  return Promise.resolve(textParts.join(" \n\n") || "No text found");
}

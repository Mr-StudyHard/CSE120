const OCR_SPACE_ENDPOINT = "https://api.ocr.space/parse/image";
const DEFAULT_LANGUAGE = "eng";
const DEFAULT_TIMEOUT_MS = 45000;
const OPENAI_MODEL = "gpt-4o-mini";
const FALLBACK_OCR_SPACE_KEY = "helloworld"; // Demo key from OCR.Space docs.

const RAW_OCR_SPACE_KEY = process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY?.trim();
export const USING_DEMO_OCR_KEY = !RAW_OCR_SPACE_KEY;
const OCR_SPACE_KEY = RAW_OCR_SPACE_KEY && RAW_OCR_SPACE_KEY.length > 0 ? RAW_OCR_SPACE_KEY : FALLBACK_OCR_SPACE_KEY;

const FORCE_OCR_SPACE =
  (process.env.EXPO_PUBLIC_FORCE_OCR_SPACE ?? "").trim().toLowerCase() === "1" ||
  (process.env.EXPO_PUBLIC_FORCE_OCR_SPACE ?? "").trim().toLowerCase() === "true";

const OPENAI_API_KEY =
  process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim() &&
  process.env.EXPO_PUBLIC_OPENAI_API_KEY.trim().length > 0
    ? process.env.EXPO_PUBLIC_OPENAI_API_KEY.trim()
    : undefined;

type ExtractTextOptions = {
  language?: string;
  // Prefer a specific provider regardless of env keys/flags
  provider?: "ocrspace" | "openai" | "best";
};

type OcrSpaceResponse = {
  ParsedResults?: Array<{
    ParsedText?: string;
  }>;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: Array<string> | string;
};

type ExtractTextConfig = ExtractTextOptions & {
  timeoutMs?: number;
  fileUri?: string;
  mimeType?: string;
  ocrEngine?: 1 | 2;
  retries?: number;
  retryDelayMs?: number;
};

export async function extractTextFromImage(
  base64Image: string | null | undefined,
  options: ExtractTextConfig = {}
): Promise<string> {
  if (!base64Image && !options.fileUri) {
    throw new Error("No image data supplied for OCR.");
  }

  // Provider selection
  const explicit = options.provider;
  if (explicit === "openai") {
    if (!base64Image) {
      throw new Error("Unable to generate OCR payload. Please retake the photo.");
    }
    return extractWithOpenAI(base64Image, options);
  } else if (explicit === "ocrspace") {
    return extractWithOcrSpace(base64Image, options);
  } else if (explicit === "best") {
    return extractWithBest(base64Image, options);
  }

  // Default behavior (legacy): choose OpenAI if available and not forced, else OCR.Space
  const preferOpenAI = Boolean(OPENAI_API_KEY && !FORCE_OCR_SPACE);
  if (preferOpenAI) {
    if (!base64Image) {
      throw new Error("Unable to generate OCR payload. Please retake the photo.");
    }
    return extractWithOpenAI(base64Image, options);
  }
  return extractWithOcrSpace(base64Image, options);
}

// Basic, safe post-processing to improve readability of OCR output.
export function postProcessOcrText(input: string): string {
  if (!input) return input;

  // Normalize line endings
  let text = input.replace(/\r\n?/g, "\n");

  // Protect paragraph breaks by marking blank-line boundaries
  text = text.replace(/\n{2,}/g, "\n\uE000\n");

  // Handle hyphenation at line breaks: "exam-\nple" → "example"
  text = text.replace(/([A-Za-z])\-\n(?=[a-z])/g, "$1");

  // Join lines that are likely wrapped mid-sentence (no terminal punctuation)
  text = text.replace(/([^\.!?:;\)])\n(?=[a-z0-9\(\[])/g, "$1 ");

  // Restore paragraph markers to blank lines
  text = text.replace(/\n\uE000\n/g, "\n\n");

  // Normalize bullets and spacing artifacts
  text = text
    .replace(/[•·◦]/g, "-")
    .replace(/\s{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n");

  // Trim trailing spaces per line
  text = text
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n");

  return text.trim();
}

// Lightweight quality score to select the best among multiple OCR attempts
export function scoreOcrText(text: string): number {
  if (!text) return 0;
  const lengthScore = Math.min(text.length / 1000, 1) * 60; // favor longer up to a point
  const newlinePenalty = Math.min((text.match(/\n/g)?.length ?? 0) / 200, 1) * 10;
  const nonAsciiRatio = (text.match(/[^\x00-\x7F]/g)?.length ?? 0) / Math.max(1, text.length);
  const nonAsciiPenalty = Math.min(nonAsciiRatio * 100, 20);
  return lengthScore + 30 - newlinePenalty - nonAsciiPenalty;
}

async function performOcrSpaceRequest(
  base64Image: string | null | undefined,
  options: ExtractTextConfig,
  apiKey: string,
  isDemoKey: boolean
) {
  const formData = new FormData();
  formData.append("language", options.language ?? DEFAULT_LANGUAGE);
  formData.append("isOverlayRequired", "false");
  const engine = options.ocrEngine ?? (isDemoKey ? 1 : 2);
  formData.append("OCREngine", String(engine));
  formData.append("detectOrientation", "true");
  formData.append("scale", "true");
  formData.append("isTable", "true");
  formData.append("isCreateSearchablePdf", "false");

  const shouldSendBase64 = Boolean(base64Image && !options.fileUri);

  if (shouldSendBase64) {
    const safeBase64 = base64Image!;
    const dataUri = safeBase64.startsWith("data:")
      ? safeBase64
      : `data:image/jpeg;base64,${safeBase64}`;
    formData.append("base64Image", dataUri);
  }

  if (options.fileUri) {
    const mime = options.mimeType ?? "image/jpeg";
    const extension = mime.split("/")[1] ?? "jpg";
    formData.append("file", {
      uri: options.fileUri,
      type: mime,
      name: `image.${extension}`,
    } as any);
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;
  const timeout = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const timeoutHandle = controller
    ? setTimeout(() => {
        controller.abort();
      }, timeout)
    : undefined;

  try {
    const response = await fetch(OCR_SPACE_ENDPOINT, {
      method: "POST",
      headers: {
        apikey: apiKey,
      },
      body: formData,
      signal: controller?.signal,
    });

    if (!response.ok) {
      throw new Error(`OCR request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as OcrSpaceResponse;

    if (payload.IsErroredOnProcessing) {
      const errorMessage = Array.isArray(payload.ErrorMessage)
        ? payload.ErrorMessage.filter(Boolean).join(" ")
        : payload.ErrorMessage;
      throw new Error(errorMessage || "OCR service was unable to process the image.");
    }

    const combinedText = payload.ParsedResults?.map((result) =>
      result?.ParsedText?.trim?.()
    )
      .filter((segment) => Boolean(segment && segment.length > 0))
      .join("\n\n");

    return combinedText && combinedText.length > 0 ? combinedText : "No text found";
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("OCR request timed out. Try again with clearer image or better connection.");
    }
    if (isDemoKey) {
      throw new Error(
        `${toError(error).message} The bundled OCR demo key is rate-limited; add EXPO_PUBLIC_OCR_SPACE_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY for reliable scans.`
      );
    }
    throw error;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function extractWithOcrSpace(
  base64Image: string | null | undefined,
  options: ExtractTextConfig
) {
  const attempts = Math.max(options.retries ?? 0, 0) + 1;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await performOcrSpaceRequest(base64Image, options, OCR_SPACE_KEY, USING_DEMO_OCR_KEY);
    } catch (error) {
      const normalized = toError(error);
      lastError = normalized;

      const hasAttemptsRemaining = attempt < attempts - 1;
      if (!hasAttemptsRemaining || !isRetryableError(normalized)) {
        throw normalized;
      }

      const delayMs = (options.retryDelayMs ?? 1500) * (attempt + 1);
      await delay(delayMs);
    }
  }

  throw lastError ?? new Error("Unknown OCR failure.");
}

async function extractWithOpenAI(base64Image: string, options: ExtractTextConfig) {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API key. Set EXPO_PUBLIC_OPENAI_API_KEY in your environment.");
  }

  const imageDataUri = base64Image.startsWith("data:")
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  const langHint = options.language ? ` The text is primarily in ${options.language}.` : "";
  const prompt = `Extract all text from this image.${langHint} Return only the text content.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageDataUri,
              },
            },
          ],
        },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI request failed with status ${response.status}: ${truncate(errorText, 200)}`
    );
  }

  const payload = (await response.json()) as any;
  const content = payload?.choices?.[0]?.message?.content;

  let extracted = "";

  if (typeof content === "string") {
    extracted = content;
  } else if (Array.isArray(content)) {
    extracted = content
      .map((block) => (typeof block?.text === "string" ? block.text : ""))
      .filter(Boolean)
      .join("\n");
  }

  extracted = extracted?.trim?.() ?? "";

  if (!extracted) {
    throw new Error("OCR service did not return any text. Try retaking the photo with clearer lighting.");
  }

  return extracted;
}

export async function refineTextWithOpenAI(text: string, language?: string): Promise<string> {
  if (!OPENAI_API_KEY) return text;
  const system =
    "You are a careful proofreader. Fix obvious OCR errors (broken words, wrong punctuation, casing). \n" +
    "Preserve the original meaning, structure, and line breaks as much as possible. Do NOT add or remove content.";

  const user = `${language ? `Language: ${language}. ` : ""}Clean up this OCR text without changing its meaning. Return only the corrected text.\n\n${text}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    return text; // fail open
  }

  const payload = (await response.json()) as any;
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim().length > 0) {
    return content.trim();
  }
  return text;
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === "string" ? error : "Unexpected OCR error");
}

function isRetryableError(error: Error) {
  const message = error.message?.toLowerCase?.() ?? "";
  return (
    message.includes("timed out waiting for results") ||
    message.includes("request timed out") ||
    message.includes("timeout")
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const HAS_OPENAI_KEY = Boolean(OPENAI_API_KEY);

// Best-mode: try OCR.Space first, then fall back to OpenAI if available and needed; choose higher scoring result
const BEST_MIN_LEN = 20;
const BEST_SCORE_THRESHOLD = 25;

async function extractWithBest(
  base64Image: string | null | undefined,
  options: ExtractTextConfig
) {
  // Always attempt OCR.Space first (respecting the chosen engine)
  let ocrspaceText = "";
  try {
    ocrspaceText = await extractWithOcrSpace(base64Image, options);
  } catch (e) {
    // If OCR.Space failed completely and we have OpenAI (and not forced), try OpenAI as a rescue
    if (OPENAI_API_KEY && !FORCE_OCR_SPACE && base64Image) {
      try {
        const ai = await extractWithOpenAI(base64Image, options);
        return ai;
      } catch (e2) {
        throw toError(e2);
      }
    }
    throw toError(e);
  }

  // If we can't use OpenAI, just return OCR.Space result
  if (!OPENAI_API_KEY || FORCE_OCR_SPACE || !base64Image) {
    return ocrspaceText;
  }

  const cleanedOcr = postProcessOcrText(ocrspaceText);
  const ocrScore = scoreOcrText(cleanedOcr);

  // Decide if we need an OpenAI pass
  const needsFallback = cleanedOcr.length < BEST_MIN_LEN || ocrScore < BEST_SCORE_THRESHOLD;
  if (!needsFallback) {
    return cleanedOcr;
  }

  // Try OpenAI and return whichever is better
  try {
    const aiRaw = await extractWithOpenAI(base64Image, options);
    const aiClean = postProcessOcrText(aiRaw);
    const aiScore = scoreOcrText(aiClean);
    return aiScore >= ocrScore ? aiClean : cleanedOcr;
  } catch {
    // If OpenAI call fails, stick with OCR.Space
    return cleanedOcr;
  }
}

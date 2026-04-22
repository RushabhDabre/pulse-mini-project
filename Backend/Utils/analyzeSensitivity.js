import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getVideoThumbnail(cloudinaryUrl) {
  const thumbnailUrl = cloudinaryUrl
    .replace("/video/upload/", "/video/upload/so_2/")
    .replace(/\.(mp4|mov|avi|mkv|webm)$/i, ".jpg");

  const response = await axios.get(thumbnailUrl, {
    responseType: "arraybuffer",
    timeout: 10000,
  });

  return {
    base64: Buffer.from(response.data).toString("base64"),
    url: thumbnailUrl,
  };
}

async function getImageBase64(imageUrl) {
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 10000,
  });
  return Buffer.from(response.data).toString("base64");
}

// async function analyzeImageWithGemini(base64Image, label = "image") {
//   const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//   const result = await model.generateContent([
//     {
//       inlineData: { mimeType: "image/jpeg", data: base64Image },
//     },
//     {
//       text: `Analyze this ${label} for content sensitivity.
//       Reply with ONLY a JSON object in this exact format, nothing else:
//       {
//         "sensitivity": "safe" or "flagged",
//         "reason": "brief reason",
//         "confidence": 0.0 to 1.0
//       }
//       Flag as "flagged" if the image contains:
//       - Explicit sexual content
//       - Graphic violence or gore
//       - Hate symbols or extremist content
//       - Dangerous or illegal activities
//       Otherwise mark as "safe".`,
//     },
//   ]);

//   const text = result.response.text().trim();
//   const cleaned = text.replace(/```json|```/g, "").trim();
//   return JSON.parse(cleaned);
// }

async function analyzeImageWithGemini(base64Image, label = "image") {
  // try models in order — fallback if quota exceeded
  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",      // fallback 1
    "gemini-2.5-pro",   // fallback 2 — higher quota
    "gemini-3.1-pro-preview",   // fallback 2 — higher quota
  ];

  for (const modelName of models) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent([
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        {
          text: `Analyze this ${label} for content sensitivity.
          Reply with ONLY a JSON object in this exact format, nothing else:
          {
            "sensitivity": "safe" or "flagged",
            "reason": "brief reason",
            "confidence": 0.0 to 1.0
          }
          Flag as "flagged" if the image contains:
          - Explicit sexual content
          - Graphic violence or gore
          - Hate symbols or extremist content
          - Dangerous or illegal activities
          Otherwise mark as "safe".`,
        },
      ]);

      const text = result.response.text().trim();
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);

    } catch (err) {
      const isQuotaError =
        err.message.includes("429") ||
        err.message.includes("quota") ||
        err.message.includes("Too Many Requests");

      if (isQuotaError) {
        console.log(`Model ${modelName} quota exceeded, trying next...`);
        continue; // try next model
      }
      throw err; // non-quota error — rethrow
    }
  }

  throw new Error("All models quota exceeded");
}

async function withRetry(fn, retries = 3, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable =
        err.message.includes("503") ||
        err.message.includes("429") ||
        err.message.includes("high demand") ||
        err.message.includes("Service Unavailable") ||
        err.message.includes("Too Many Requests");

      // extract retry delay from error message if present
      const retryMatch = err.message.match(/retry in (\d+(\.\d+)?)s/i);
      const waitMs = retryMatch
        ? Math.ceil(parseFloat(retryMatch[1])) * 1000
        : delay;

      if (isRetryable && i < retries - 1) {
        console.log(`Gemini retry ${i + 1}/${retries} after ${waitMs}ms...`);
        await new Promise((res) => setTimeout(res, waitMs));
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
}

export async function analyzeSensitivity(
  cloudinaryVideoUrl,
  userThumbnailUrl = null,
) {
  try {
    // always generate video frame
    const videoFrame = await getVideoThumbnail(cloudinaryVideoUrl);

    // analyze video frame — always
    const videoAnalysis = await withRetry(() =>
      analyzeImageWithGemini(videoFrame.base64, "video frame"),
    );

    // if user uploaded thumbnail — analyze that too
    let thumbnailAnalysis = null;
    if (userThumbnailUrl) {
      const thumbnailBase64 = await getImageBase64(userThumbnailUrl);
      thumbnailAnalysis = await withRetry(() =>
        analyzeImageWithGemini(thumbnailBase64, "thumbnail image"),
      );
    }

    // if EITHER is flagged — mark as flagged
    const isFlagged =
      videoAnalysis.sensitivity === "flagged" ||
      thumbnailAnalysis?.sensitivity === "flagged";

    // build reason
    let reason = "";
    if (videoAnalysis.sensitivity === "flagged") {
      reason += `Video: ${videoAnalysis.reason}`;
    }
    if (thumbnailAnalysis?.sensitivity === "flagged") {
      reason += reason
        ? ` | Thumbnail: ${thumbnailAnalysis.reason}`
        : `Thumbnail: ${thumbnailAnalysis.reason}`;
    }
    if (!isFlagged) {
      reason = videoAnalysis.reason || "Content appears safe";
    }

    return {
      sensitivity: isFlagged ? "flagged" : "safe",
      reason,
      confidence: videoAnalysis.confidence || 1.0,
      thumbnailUrl: userThumbnailUrl || videoFrame.url, // user thumbnail or auto generated
    };
  } catch (err) {
    console.error("Gemini analysis failed:", err.message);
    return {
      sensitivity: "safe",
      reason: "Auto-analysis unavailable — marked safe by default",
      confidence: 0,
      thumbnailUrl: null,
    };
  }
}

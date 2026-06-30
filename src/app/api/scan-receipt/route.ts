import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Receipt scanning is not configured." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("receipt") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No image provided." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for Gemini)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be under 10MB." },
        { status: 400 }
      );
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Call Gemini Vision
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
      {
        text: `Analyze this receipt image and extract the following information. Return ONLY valid JSON with these fields:
- "date": the transaction date in YYYY-MM-DD format (if visible)
- "store": the store or vendor name
- "total": the final total amount paid as a number (not a string), including tax if shown

If a field cannot be determined, use null for that field.

Example response:
{"date": "2026-06-15", "store": "Costco", "total": 84.53}`,
      },
    ]);

    const responseText = result.response.text().trim();

    // Extract JSON from the response (Gemini sometimes wraps in markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse receipt. Please enter details manually." },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      date: parsed.date || null,
      store: parsed.store || null,
      total: typeof parsed.total === "number" ? parsed.total : null,
    });
  } catch (e) {
    console.error("Receipt scan error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to process receipt: ${message}` },
      { status: 500 }
    );
  }
}

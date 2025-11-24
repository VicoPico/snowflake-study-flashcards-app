import { parseCsvToQuestionsByTopic } from "./parsers.js";

function normalizeQuestions(data) {
  if (Array.isArray(data)) {
    const grouped = {};
    data.forEach((q) => {
      const topic = q.topic || "misc";
      if (!grouped[topic]) grouped[topic] = [];
      grouped[topic].push(q);
    });
    return grouped;
  }
  return data;
}

export async function loadFromJson() {
  const res = await fetch("questions.json");
  if (!res.ok) throw new Error("Failed to fetch questions.json");
  const data = await res.json();
  return normalizeQuestions(data);
}

export async function loadFromGoogleSheets(csvUrl) {
  const res = await fetch(csvUrl);
  if (!res.ok) throw new Error("Google Sheets fetch failed");
  const csvText = await res.text();
  const parsed = parseCsvToQuestionsByTopic(csvText);
  if (!Object.keys(parsed).length) {
    throw new Error("No valid questions found in Sheets CSV");
  }
  return parsed;
}

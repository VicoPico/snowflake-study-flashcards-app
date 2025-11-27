// data/parsers.js

// Parse a single CSV line handling quotes and commas
export function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Toggle quotes or handle escaped quotes ("")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Convert CSV text to questionsByTopic structure
export function parseCsvToQuestionsByTopic(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {};
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const idx = (name) => headers.indexOf(name);

  const topicIdx = idx("topic");
  const idIdx = idx("id");
  const questionIdx = idx("question");
  const optionIdxs = [
    idx("option1"),
    idx("option2"),
    idx("option3"),
    idx("option4"),
  ].filter((i) => i >= 0);

  const correctIdxIdx = idx("correct_idx");
  const correctIndicesIdx = idx("correct_indices"); // NEW
  const explanationIdx = idx("explanation");
  const difficultyIdx = idx("difficulty");
  const sourceTypeIdx = idx("source_type");
  const tagsIdx = idx("tags");

  const result = {};

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (!row.length) continue;

    const topic = String(row[topicIdx] || "").trim();
    const questionText = String(row[questionIdx] || "").trim();
    if (!topic || !questionText) continue;

    const options = optionIdxs
      .map((colIndex) => row[colIndex])
      .filter((v) => v !== "" && v !== null && v !== undefined)
      .map((v) => String(v));

    // Single-answer index
    let correctIndex = 0;
    if (correctIdxIdx >= 0) {
      const raw = row[correctIdxIdx];
      if (typeof raw === "number") {
        correctIndex = raw;
      } else if (typeof raw === "string" && raw.trim() !== "") {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) {
          correctIndex = parsed;
        }
      }
    }

    // Multi-select indices: comma- or semicolon-separated
    let correctIndices = [];
    if (correctIndicesIdx >= 0) {
      const raw = row[correctIndicesIdx];
      if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (trimmed) {
          correctIndices = trimmed
            .split(/[,;]+/)
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n));
        }
      } else if (Array.isArray(raw)) {
        correctIndices = raw
          .map((v) =>
            typeof v === "number" ? v : parseInt(String(v).trim(), 10)
          )
          .filter((n) => !isNaN(n));
      }
    }

    const tagsValue = row[tagsIdx];
    const tags =
      typeof tagsValue === "string"
        ? tagsValue
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const q = {
      id: String(row[idIdx] || "").trim(),
      question: questionText,
      options,
      correct_index: correctIndex,
      correct_indices: correctIndices, // array of numbers; [] for single-answer
      explanation: String(row[explanationIdx] || "").trim(),
      topic,
      difficulty: String(row[difficultyIdx] || "").trim() || "medium",
      source_type: String(row[sourceTypeIdx] || "").trim() || "mock",
      tags,
    };

    if (!result[topic]) {
      result[topic] = [];
    }
    result[topic].push(q);
  }

  return result;
}

// Fisher–Yates shuffle (used in engine but helpful here too if needed)
export function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
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

export function parseCsvToQuestionsByTopic(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return {};

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

    const correctIndexValue = row[correctIdxIdx];
    const correctIndex =
      typeof correctIndexValue === "number"
        ? correctIndexValue
        : parseInt(correctIndexValue, 10);

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
      correct_index: isNaN(correctIndex) ? 0 : correctIndex,
      explanation: String(row[explanationIdx] || "").trim(),
      topic,
      difficulty: String(row[difficultyIdx] || "").trim() || "medium",
      source_type: String(row[sourceTypeIdx] || "").trim() || "mock",
      tags,
    };

    if (!result[topic]) result[topic] = [];
    result[topic].push(q);
  }

  return result;
}

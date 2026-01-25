const notesModules = import.meta.glob("../content/notes/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const FRONT_MATTER_DELIMITER = "---";

const titleFromSlug = slug =>
  slug
    .split("-")
    .map(word => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");

const parseFrontMatter = raw => {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== FRONT_MATTER_DELIMITER) {
    return { data: {}, content: raw.trimStart() };
  }

  const data = {};
  let index = 1;
  for (; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === FRONT_MATTER_DELIMITER) {
      index += 1;
      break;
    }
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      data[key] = value;
    }
  }

  const content = lines.slice(index).join("\n").trimStart();
  return { data, content };
};

const findPreview = (content, fallback) => {
  if (fallback) return fallback;
  const lines = content.split(/\r?\n/);
  const firstParagraph = lines.find(line => line.trim().length > 0);
  return firstParagraph ? firstParagraph.trim() : "";
};

const toDateValue = value => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const notesPosts = Object.entries(notesModules)
  .map(([path, raw]) => {
    const { data, content } = parseFrontMatter(raw);
    const slug = path.split("/").pop().replace(/\.md$/, "");
    const title = data.title || titleFromSlug(slug);
    const preview = findPreview(content, data.preview);
    const date = data.date || "";
    const dateValue = date ? toDateValue(date) : 0;

    return {
      slug,
      title,
      preview,
      date,
      dateValue,
      content,
    };
  })
  .sort((a, b) => {
    if (a.dateValue !== b.dateValue) {
      return b.dateValue - a.dateValue;
    }
    return a.title.localeCompare(b.title);
  });

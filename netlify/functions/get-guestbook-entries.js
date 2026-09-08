// netlify/functions/get-guestbook-entries.js
// Reads guestbook signatures from the Netlify Forms API for the wall on /guestbook.
// ESM: the root package.json sets "type": "module", so this file must not use require().

const { NETLIFY_API_TOKEN, GUESTBOOK_FORM_ID } = process.env;

const DATE_FORMAT = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

function jsonResponse(statusCode, payload, headers = {}) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  };
}

function missingConfig() {
  if (!NETLIFY_API_TOKEN) return "NETLIFY_API_TOKEN";
  if (!GUESTBOOK_FORM_ID) return "GUESTBOOK_FORM_ID";
  return null;
}

function formatEntry(submission) {
  const data = submission.data || {};
  return {
    id: submission.id,
    name: data.name || "Anonymous",
    website: data.website || "",
    message: data.message || "No message.",
    date: new Date(submission.created_at).toLocaleDateString("en-US", DATE_FORMAT),
  };
}

export async function handler() {
  const missing = missingConfig();
  if (missing) {
    console.error(`${missing} is not set in environment variables.`);
    return jsonResponse(500, { error: "Configuration error." });
  }

  const endpoint = `https://api.netlify.com/api/v1/forms/${GUESTBOOK_FORM_ID}/submissions`;

  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${NETLIFY_API_TOKEN}` },
    });

    if (!response.ok) {
      console.error(`Netlify API error ${response.status}: ${await response.text()}`);
      return jsonResponse(response.status, { error: "Failed to fetch submissions." });
    }

    const submissions = await response.json();
    const entries = submissions
      .filter(submission => !submission.data?.["bot-field"])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(formatEntry);

    return jsonResponse(200, entries, {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    });
  } catch (error) {
    console.error("Error fetching guestbook entries:", error);
    return jsonResponse(500, { error: "Internal error fetching guestbook entries." });
  }
}

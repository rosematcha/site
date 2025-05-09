// netlify/functions/get-guestbook-entries.js
const fetch = require("node-fetch"); // Ensure node-fetch@2 is in your package.json dependencies

const { NETLIFY_API_TOKEN, GUESTBOOK_FORM_ID } = process.env;

exports.handler = async function (event, context) {
  if (!NETLIFY_API_TOKEN) {
    console.error("NETLIFY_API_TOKEN is not set in environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuration error: Missing Netlify API Token." }),
    };
  }
  if (!GUESTBOOK_FORM_ID) {
    console.error("GUESTBOOK_FORM_ID is not set in environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuration error: Missing Guestbook Form ID." }),
    };
  }

  const API_ENDPOINT = `https://api.netlify.com/api/v1/forms/${GUESTBOOK_FORM_ID}/submissions`;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${NETLIFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Netlify API error when fetching submissions: ${response.status} - ${errorText}`);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: `Failed to fetch submissions. Status: ${response.statusText}`,
          details: errorText,
        }),
      };
    }

    const submissions = await response.json();

    const validSubmissions = submissions.filter(
      (submission) => !submission.data["bot-field"] // Filter out honeypot submissions
    );

    const formattedEntries = validSubmissions
      .map((submission) => ({
        id: submission.id,
        name: submission.data.name || "Anonymous",
        website: submission.data.website || "",
        message: submission.data.message || "No message.",
        date: new Date(submission.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first

    return {
      statusCode: 200,
      body: JSON.stringify(formattedEntries),
    };
  } catch (error) {
    console.error("Error within get-guestbook-entries function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal error fetching guestbook entries.",
        details: error.message,
      }),
    };
  }
};

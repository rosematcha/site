const HEX_PATTERN = /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i;
const FUNCTION_PATTERN =
  /\b(?:rgb|rgba|hsl|hsla|lab|lch|oklab|oklch|color|linear-gradient|radial-gradient|conic-gradient)\s*\(/i;
const NAMED_COLORS = new Set([
  "aliceblue",
  "antiquewhite",
  "aqua",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "black",
  "blue",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgreen",
  "darkgrey",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategray",
  "darkslategrey",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dimgrey",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "gray",
  "green",
  "greenyellow",
  "grey",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgreen",
  "lightgrey",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategray",
  "lightslategrey",
  "lightsteelblue",
  "lightyellow",
  "lime",
  "limegreen",
  "linen",
  "magenta",
  "maroon",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "navy",
  "oldlace",
  "olive",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "purple",
  "rebeccapurple",
  "red",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "silver",
  "skyblue",
  "slateblue",
  "slategray",
  "slategrey",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "turquoise",
  "violet",
  "wheat",
  "white",
  "whitesmoke",
  "yellow",
  "yellowgreen",
]);

const SAFE_VALUES = new Set(["transparent", "currentcolor", "inherit", "initial", "unset", "revert"]);
const NAMED_COLOR_PATTERN = new RegExp(
  `(?<![a-z-])(${Array.from(NAMED_COLORS).join("|")})(?![a-z-])`,
  "i"
);

const looksLikeColor = value => {
  if (!value || typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("var(")) {
    return false;
  }
  const normalized = trimmed.toLowerCase();
  if (SAFE_VALUES.has(normalized)) {
    return false;
  }
  if (HEX_PATTERN.test(trimmed)) {
    return true;
  }
  if (FUNCTION_PATTERN.test(trimmed)) {
    return true;
  }
  if (NAMED_COLORS.has(normalized)) {
    return true;
  }
  return NAMED_COLOR_PATTERN.test(trimmed);
};

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow raw color literals so both themes stay in sync",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allow: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      unexpectedColor: "Use design tokens instead of raw color '{{value}}'.",
    },
  },
  create(context) {
    const options = context.options[0] ?? {};
    const allow = new Set(options.allow ?? []);

    const isAllowed = value => allow.has(value);

    const reportIfColor = (node, value) => {
      if (!value || typeof value !== "string") {
        return;
      }
      if (isAllowed(value.trim())) {
        return;
      }
      if (!looksLikeColor(value)) {
        return;
      }
      context.report({
        node,
        messageId: "unexpectedColor",
        data: { value: value.trim() },
      });
    };

    return {
      Literal(node) {
        reportIfColor(node, node.value);
      },
      TemplateElement(node) {
        reportIfColor(node, node.value && node.value.cooked);
      },
    };
  },
};

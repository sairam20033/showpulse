const LANGS = ["telugu","hindi","tamil","english","malayalam","kannada","japanese","korean"];
export interface ParsedUrl { eventCode: string; city: string; title: string; language: string; url: string }
export function parseBmsUrl(raw: string): ParsedUrl | { error: string } {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return { error: "That doesn't look like a link." }; }
  if (u.protocol !== "https:" || u.hostname !== "in.bookmyshow.com")
    return { error: "Use a link that starts with https://in.bookmyshow.com/movies/" };
  const m = u.pathname.match(/^\/movies\/([a-z0-9-]+)\/([a-z0-9-]+)\/(ET\d{8})\/?$/i);
  if (!m) return { error: "Open the movie's page on BookMyShow and copy its address (it ends with ET followed by 8 digits)." };
  const [, city, slug, eventCode] = m;
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  const isLang = LANGS.includes(last);
  const language = isLang ? last[0].toUpperCase() + last.slice(1) : "Unknown";
  const nameParts = isLang ? parts.slice(0, -1) : parts;
  const title = nameParts.map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
  return { eventCode: eventCode.toUpperCase(), city: city[0].toUpperCase() + city.slice(1), title, language, url: `https://in.bookmyshow.com${u.pathname}` };
}

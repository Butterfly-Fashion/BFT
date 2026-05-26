const siteUrl = "https://fifa2026.ca";
const key = "fifa2026ca-indexnow-20260526";
const keyLocation = `${siteUrl}/${key}.txt`;
const sitemapUrl = `${siteUrl}/sitemap.xml`;

const sitemapResponse = await fetch(sitemapUrl);
if (!sitemapResponse.ok) {
  throw new Error(`Failed to fetch sitemap: ${sitemapResponse.status}`);
}

const sitemap = await sitemapResponse.text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

if (urlList.length === 0) {
  throw new Error("No sitemap URLs found.");
}

const response = await fetch("https://www.bing.com/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(siteUrl).host,
    key,
    keyLocation,
    urlList,
  }),
});

console.log(`Submitted ${urlList.length} URLs to IndexNow.`);
console.log(`Status: ${response.status} ${response.statusText}`);

if (!response.ok && response.status !== 202) {
  console.log(await response.text());
  process.exitCode = 1;
}

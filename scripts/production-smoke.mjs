const baseUrl = (process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://baliyttc-vivek07-s-projects.vercel.app").replace(/\/$/, "");

const publicPages = [
  { path: "/en", marker: "Bali YTTC" },
  { path: "/en/courses/200hr", marker: "200 Hour Yoga Teacher Training Bali" },
  { path: "/en/courses/100hr", marker: "100 Hour Yoga Teacher Training Bali" },
  { path: "/en/courses/300hr", marker: "300 Hour Advanced Yoga Teacher Training Bali" },
  { path: "/en/courses/50hr", marker: "50 Hour Hatha Vinyasa Yoga Training Bali" },
  { path: "/en/apply", marker: "Apply for 2026 Batch" },
  { path: "/en/contact", marker: "Contact Bali YTTC" },
  { path: "/en/gallery", marker: "Moments from" },
  { path: "/en/faq", marker: "FAQ" },
  { path: "/en/schedule", marker: "Schedule" },
  { path: "/en/accommodation", marker: "Accommodation" },
  { path: "/en/instructors", marker: "Vivek Kalura" },
  { path: "/en/testimonials", marker: "Student Reviews" },
  { path: "/en/pricing", marker: "Pricing" },
  { path: "/en/visa", marker: "Visa" },
];

const privatePages = [
  { path: "/en/login", robots: "noindex, nofollow" },
  { path: "/en/admin/login", robots: "noindex, nofollow" },
  { path: "/en/payment/return", robots: "noindex, nofollow" },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchText(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...init,
  });
  const text = await response.text();
  return { response, text };
}

async function checkPublicPage(page) {
  const { response, text } = await fetchText(page.path);
  assert(response.status === 200, `${page.path} returned ${response.status}`);
  assert(text.includes(page.marker), `${page.path} is missing marker: ${page.marker}`);
  assert(text.includes('rel="canonical"'), `${page.path} is missing canonical link`);
  assert(text.includes('property="og:title"'), `${page.path} is missing og:title`);

  const robots = response.headers.get("x-robots-tag") || "";
  assert(robots.includes("index"), `${page.path} should be indexable, got x-robots-tag=${robots || "none"}`);
  return { path: page.path, status: response.status };
}

async function checkPrivatePage(page) {
  const { response } = await fetchText(page.path);
  assert(response.status === 200, `${page.path} returned ${response.status}`);
  const robots = response.headers.get("x-robots-tag") || "";
  assert(robots === page.robots, `${page.path} expected robots ${page.robots}, got ${robots || "none"}`);
  return { path: page.path, status: response.status };
}

async function checkProtectedApi() {
  const response = await fetch(`${baseUrl}/api/admin/leads`, { redirect: "manual" });
  assert(response.status === 401, `/api/admin/leads should require auth, got ${response.status}`);
  const body = await response.json();
  assert(body.error === "Unauthorized", `/api/admin/leads returned unexpected body`);
  return { path: "/api/admin/leads", status: response.status };
}

async function checkSameOriginApi() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseUrl,
    },
    body: "{}",
  });
  assert(response.status === 400, `/api/auth/login invalid request should return 400, got ${response.status}`);
  return { path: "/api/auth/login", status: response.status };
}

async function checkSitemapAndRobots() {
  const sitemap = await fetchText("/sitemap.xml");
  assert(sitemap.response.status === 200, `/sitemap.xml returned ${sitemap.response.status}`);
  const locCount = (sitemap.text.match(/<loc>/g) || []).length;
  assert(locCount >= 40, `/sitemap.xml has too few URLs: ${locCount}`);

  const robots = await fetchText("/robots.txt");
  assert(robots.response.status === 200, `/robots.txt returned ${robots.response.status}`);
  assert(robots.text.includes("Disallow: /api"), `/robots.txt should disallow /api`);
  assert(robots.text.includes("Sitemap:"), `/robots.txt should include Sitemap`);
  return [
    { path: "/sitemap.xml", status: sitemap.response.status, urls: locCount },
    { path: "/robots.txt", status: robots.response.status },
  ];
}

async function main() {
  const results = [];
  for (const page of publicPages) {
    results.push(await checkPublicPage(page));
  }
  for (const page of privatePages) {
    results.push(await checkPrivatePage(page));
  }
  results.push(await checkProtectedApi());
  results.push(await checkSameOriginApi());
  results.push(...await checkSitemapAndRobots());

  console.table(results);
  console.log(`Production smoke passed for ${baseUrl}`);
}

main().catch((error) => {
  console.error(`Production smoke failed for ${baseUrl}`);
  console.error(error);
  process.exit(1);
});

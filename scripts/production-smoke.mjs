const baseUrl = (process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://baliyttc-vivek07-s-projects.vercel.app").replace(/\/$/, "");

const publicPages = [
  { path: "/en", marker: "Bali YTTC" },
  { path: "/es", marker: "Bali YTTC" },
  { path: "/en/courses/200hr", marker: "200 Hour Yoga Teacher Training Bali" },
  { path: "/es/courses/200hr", marker: "Bali YTTC" },
  { path: "/en/courses/100hr", marker: "100 Hour Yoga Teacher Training Bali" },
  { path: "/en/courses/300hr", marker: "300 Hour Advanced Yoga Teacher Training Bali" },
  { path: "/en/courses/50hr", marker: "50 Hour Hatha Vinyasa Yoga Training Bali" },
  { path: "/en/apply", marker: "Apply for 2026 Batch" },
  { path: "/en/contact", marker: "Contact Bali YTTC" },
  { path: "/en/gallery", marker: "Moments from" },
  {
    path: "/en/blog/200-hour-yoga-teacher-training-in-bali-what-students-study",
    marker: "What Students Actually Study",
  },
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
  { path: "/en/staff/login", robots: "noindex, nofollow" },
  { path: "/en/payment/return", robots: "noindex, nofollow" },
];

const protectedPages = [
  { path: "/en/app/dashboard", expectedLocation: "/en/login" },
  { path: "/en/admin", expectedLocation: "/en/admin/login" },
  { path: "/en/admin/overview", expectedLocation: "/en/admin/login" },
  { path: "/en/staff/dashboard", expectedLocation: "/en/staff/login" },
];

const protectedApis = [
  "/api/admin/leads",
  "/api/admin/blog",
  "/api/admin/gallery",
  "/api/app/portal",
  "/api/app/notifications",
  "/api/teacher/dashboard",
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

function robotsFromHtml(text) {
  const match = text.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  return match?.[1]?.toLowerCase() || "";
}

function hasRobotDirective(robots, directive) {
  return robots
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .includes(directive);
}

function assertSecurityHeaders(response, path) {
  assert(response.headers.get("x-request-id"), `${path} is missing x-request-id`);
  assert(response.headers.get("x-frame-options") === "DENY", `${path} is missing X-Frame-Options DENY`);
  assert(response.headers.get("x-content-type-options") === "nosniff", `${path} is missing nosniff`);
  assert(
    response.headers.get("referrer-policy") === "strict-origin-when-cross-origin",
    `${path} has unexpected Referrer-Policy`,
  );
}

async function checkPublicPage(page) {
  const { response, text } = await fetchText(page.path);
  assert(response.status === 200, `${page.path} returned ${response.status}`);
  assertSecurityHeaders(response, page.path);
  assert(text.includes(page.marker), `${page.path} is missing marker: ${page.marker}`);
  assert(text.includes('rel="canonical"'), `${page.path} is missing canonical link`);
  assert(text.includes('property="og:title"'), `${page.path} is missing og:title`);

  const robots = response.headers.get("x-robots-tag") || robotsFromHtml(text);
  assert(!hasRobotDirective(robots, "noindex"), `${page.path} should be indexable, got robots=${robots}`);
  return { path: page.path, status: response.status };
}

async function checkPrivatePage(page) {
  const { response, text } = await fetchText(page.path);
  assert(response.status === 200, `${page.path} returned ${response.status}`);
  assertSecurityHeaders(response, page.path);
  const robots = response.headers.get("x-robots-tag") || robotsFromHtml(text);
  assert(
    hasRobotDirective(robots, "noindex") && hasRobotDirective(robots, "nofollow"),
    `${page.path} expected noindex,nofollow robots, got ${robots || "none"}`,
  );
  return { path: page.path, status: response.status };
}

async function checkProtectedPage(page) {
  const response = await fetch(`${baseUrl}${page.path}`, { redirect: "manual" });
  assert([302, 307, 308].includes(response.status), `${page.path} should redirect, got ${response.status}`);
  assertSecurityHeaders(response, page.path);
  const location = response.headers.get("location") || "";
  assert(location.includes(page.expectedLocation), `${page.path} should redirect to ${page.expectedLocation}, got ${location}`);
  return { path: page.path, status: response.status, location };
}

async function checkProtectedApi(path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  assert(response.status === 401, `${path} should require auth, got ${response.status}`);
  assertSecurityHeaders(response, path);
  const body = await response.json();
  assert(body.error === "Unauthorized", `${path} returned unexpected body`);
  return { path, status: response.status };
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
  assertSecurityHeaders(response, "/api/auth/login");
  return { path: "/api/auth/login", status: response.status };
}

async function checkPublicJsonApi(path, validate) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "x-request-id": `smoke-${path.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`,
    },
  });
  assert(response.status === 200, `${path} returned ${response.status}`);
  assertSecurityHeaders(response, path);
  assert(
    response.headers.get("cache-control")?.toLowerCase().includes("no-store"),
    `${path} should use no-store cache-control`,
  );

  const body = await response.json();
  validate(body);
  return { path, status: response.status };
}

async function checkPublicApis() {
  return Promise.all([
    checkPublicJsonApi("/api/health", (body) => {
      assert(["ok", "degraded"].includes(body.status), "/api/health should return a health status");
      assert(typeof body.timestamp === "string", "/api/health should include timestamp");
    }),
    checkPublicJsonApi("/api/courses?locale=en&slug=200hr", (body) => {
      assert(Array.isArray(body.courses), "/api/courses should return courses array");
      assert(body.courses.length >= 1, "/api/courses should include at least one course");
    }),
    checkPublicJsonApi("/api/blog?locale=en&limit=1", (body) => {
      assert(Array.isArray(body.posts), "/api/blog should return posts array");
      assert(body.pagination?.limit === 1, "/api/blog should preserve requested limit");
    }),
    checkPublicJsonApi("/api/site-settings", (body) => {
      assert(body.settings?.general?.schoolName, "/api/site-settings should include school name");
    }),
  ]);
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
  for (const page of protectedPages) {
    results.push(await checkProtectedPage(page));
  }
  for (const path of protectedApis) {
    results.push(await checkProtectedApi(path));
  }
  results.push(await checkSameOriginApi());
  results.push(...await checkPublicApis());
  results.push(...await checkSitemapAndRobots());

  console.table(results);
  console.log(`Production smoke passed for ${baseUrl}`);
}

main().catch((error) => {
  console.error(`Production smoke failed for ${baseUrl}`);
  console.error(error);
  process.exit(1);
});

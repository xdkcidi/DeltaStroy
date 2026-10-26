#!/usr/bin/env node
/*
 * Генератор статических страниц Дельтастроя.
 *
 *   node tools/build.js
 *
 * Что делает:
 *   • product/<slug>.html   — страница каждого товара (данные из js/data.js)
 *   • category/<код>.html   — страница каждой категории каталога
 *   • sitemap.xml, robots.txt
 *   • заполняет SEO-блок (canonical, og, JSON-LD, аналитика) между маркерами
 *     <!-- seo:start --> и <!-- seo:end --> в index.html и pages/*.html
 *
 * Адрес сайта берётся из tools/site.config.json (поле siteUrl).
 * После изменения js/data.js, шапки/подвала или адреса сайта просто запустите скрипт заново.
 * Шапка, подвал и форма берутся из pages/product.html — правьте их там и в остальных страницах.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const write = (p, s) => {
  const full = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, s);
};

const cfg = JSON.parse(read("tools/site.config.json"));
const SITE = cfg.siteUrl.replace(/\/+$/, "");
const TODAY = new Date().toISOString().slice(0, 10);

/* ---------- данные ---------- */
const sandbox = {};
new Function("window", read("js/data.js"))(sandbox);
const products = sandbox.DELTA_PRODUCTS;
if (!Array.isArray(products) || !products.length) throw new Error("js/data.js: нет товаров");

const appSrc = read("js/app.js");
const m = appSrc.match(/const categoryInfo = (\{[\s\S]*?\n\});\nconst categoryOrder = (\[[\s\S]*?\]);/);
if (!m) throw new Error("Не удалось прочитать categoryInfo из js/app.js");
const categoryInfo = new Function("return " + m[1])();
const categoryOrder = new Function("return " + m[2])();

const navy = (read("css/style.css").match(/--navy:\s*(#[0-9a-fA-F]{3,8})/) || [])[1] || "#0f2c52";

/* ---------- утилиты ---------- */
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const nf = new Intl.NumberFormat("ru-RU");
const hasPrice = (p) => p.price !== null && p.price !== undefined && p.price !== "" && Number(p.price) > 0;
const money = (n) => (n === null || n === undefined || n === "" ? "Цена по запросу" : nf.format(Number(n)) + " ₽");
const trim = (s, n = 158) => {
  s = String(s).replace(/\s+/g, " ").trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:—-]+$/, "") + "…";
};
const abs = (rel) => (/^https?:/.test(rel) ? rel : `${SITE}/${rel.replace(/^\/+/, "")}`);
const plural = (n, a, b, c) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c;
};

function categoryLabel(item) {
  if (item.meta?.liters) return `${nf.format(item.meta.liters)} л`;
  if (item.meta?.users) return `${item.meta.users} польз.`;
  if (item.meta?.flow_l_s) return `${item.meta.flow_l_s} л/с`;
  if (item.meta?.flow_l_min) return `${item.meta.flow_l_min} л/мин`;
  if (item.category === "stations") return "Станция";
  if (item.category === "grease") return "Жироуловитель";
  if (item.category === "storm") return "Пескоуловитель";
  if (item.category === "kns") return "КНС";
  return categoryInfo[item.category]?.title || "Каталог";
}

/* ---------- оболочка страниц (шапка, подвал, форма) ---------- */
const tpl = read("pages/product.html");
const sibling = (s) => s.replace(/href="(catalog|certificates|contacts|privacy|consent)\.html/g, 'href="../pages/$1.html');
const headerHtml = sibling(tpl.match(/<header class="site-header">[\s\S]*?<\/header>/)[0]);
const footerHtml = sibling(tpl.slice(tpl.indexOf('<footer class="site-footer">'), tpl.indexOf('<script src="../js/data.js">')));

/* ---------- SEO-блок ---------- */
function seoBlock({ root, url, title, desc, image, ogType = "website", robots = "index,follow,max-image-preview:large", jsonld = [] }) {
  const lines = [];
  if (url) lines.push(`<link rel="canonical" href="${esc(url)}" />`);
  lines.push(`<meta name="robots" content="${robots}" />`);
  lines.push(`<meta property="og:site_name" content="${esc(cfg.siteName)}" />`);
  lines.push(`<meta property="og:locale" content="ru_RU" />`);
  lines.push(`<meta property="og:type" content="${ogType}" />`);
  lines.push(`<meta property="og:title" content="${esc(title)}" />`);
  lines.push(`<meta property="og:description" content="${esc(desc)}" />`);
  if (url) lines.push(`<meta property="og:url" content="${esc(url)}" />`);
  lines.push(`<meta property="og:image" content="${esc(abs(image || cfg.ogImage))}" />`);
  lines.push(`<meta name="twitter:card" content="summary_large_image" />`);
  lines.push(`<meta name="theme-color" content="${navy}" />`);
  lines.push(`<link rel="icon" href="${root}favicon.svg" type="image/svg+xml" />`);
  lines.push(`<link rel="icon" href="${root}assets/favicon-32.png" sizes="32x32" type="image/png" />`);
  lines.push(`<link rel="apple-touch-icon" href="${root}assets/apple-touch-icon.png" />`);
  jsonld.forEach((o) =>
    lines.push(`<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`),
  );
  lines.push(`<script src="${root}js/analytics.js" defer></script>`);
  return lines.map((l) => "    " + l).join("\n");
}

const breadcrumbLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: url })),
});

/* ---------- карточка и страница товара ---------- */
function card(item, root, compact = false) {
  const image = item.image || null;
  const url = `${root}product/${item.slug}.html`;
  const chips = (item.features || [])
    .slice(0, compact ? 2 : 3)
    .map((x) => `<span class="feature-chip">${esc(x)}</span>`)
    .join("");
  return `<article class="product-card">
    <a class="product-card-link" href="${url}" aria-label="${esc(item.name)}">
      <div class="product-visual ${image ? "" : "placeholder"}">
        <span class="card-tag">${esc(categoryLabel(item))}</span>
        ${image ? `<img src="${root}${image}" alt="${esc(item.name)}" loading="lazy">` : ""}
      </div>
    </a>
    <div class="product-body">
      <div class="collection">${esc(item.collection || "")}</div>
      <h3><a href="${url}">${esc(item.name)}</a></h3>
      <p>${esc(item.subtitle || "Инженерное оборудование")}</p>
      <div class="feature-list">${chips}</div>
      <div class="price-row"><div class="price">${money(item.price)}</div></div>
      <a class="btn btn-primary card-btn" href="${url}">Подробнее</a>
    </div>
  </article>`;
}

function specs(item) {
  const s = [];
  const d = item.details || {};
  const mt = item.meta || {};
  if (mt.users) s.push(["Пользователи", String(mt.users)]);
  if (mt.liters) s.push(["Объём", nf.format(mt.liters) + " л"]);
  if (mt.model) s.push(["Модель", mt.model]);
  if (mt.dimensions) s.push(["Габариты (Д×Ш×В)", mt.dimensions]);
  if (mt.flow_l_s) s.push(["Производительность", mt.flow_l_s + " л/с"]);
  if (mt.flow_l_min) s.push(["Производительность", mt.flow_l_min + " л/мин"]);
  if (d.warranty) s.push(["Гарантия", d.warranty]);
  if (d.users_note) s.push(["Применение", d.users_note]);
  if (d.installation) s.push(["Монтаж", d.installation]);
  if (d.min_pit_depth_mm) {
    s.push(["Мин. глубина котлована", d.min_pit_depth_mm + " мм"]);
    if (d.pit_size_mm) s.push(["Мин. размер котлована", d.pit_size_mm + " мм"]);
    if (d.inlet_mm) s.push(["Входящий трубопровод", "Ø " + d.inlet_mm + " мм"]);
    if (d.sand_cushion_mm) s.push(["Песчаная подушка", "не менее " + d.sand_cushion_mm + " мм"]);
    if (d.insulation_mm) s.push(["Утепление", d.insulation_mm + " мм"]);
  }
  return s;
}

function productBody(item, root) {
  const image = item.image || "";
  const gallery = item.gallery && item.gallery.length ? item.gallery : image ? [image] : [];
  const sp = specs(item);
  const sameCollection = products.filter((p) => p.collection === item.collection && p.id !== item.id).slice(0, 4);
  const related = sameCollection.length
    ? sameCollection
    : products.filter((p) => p.category === item.category && p.id !== item.id).slice(0, 4);

  return `<div class="product-page-grid">
      <div class="product-page-gallery">
        ${
          gallery.length
            ? `<img id="product-main-image" src="${root}${gallery[0]}" alt="${esc(item.name)}" fetchpriority="high">
        ${
          gallery.length > 1
            ? `<div class="product-page-thumbs">${gallery
                .map(
                  (src, i) =>
                    `<img src="${root}${src}" data-src="${root}${src}" data-thumb-index="${i}" class="${i === 0 ? "active" : ""}" alt="${esc(item.name)} — фото ${i + 1}" loading="lazy">`,
                )
                .join("")}</div>`
            : ""
        }`
            : `<div class="product-visual placeholder" style="height:440px;border-radius:20px"></div>`
        }
      </div>
      <div class="product-page-info">
        <div class="eyebrow">${esc(item.collection || "Каталог")}</div>
        <h1>${esc(item.name)}</h1>
        <p class="product-page-sub">${esc(item.subtitle || "Инженерное решение")}</p>
        ${item.description ? `<p class="product-page-description">${esc(item.description)}</p>` : ""}
        <div class="product-page-price">${money(item.price)}</div>
        <div class="modal-note">Доставка, монтаж и дополнительные опции рассчитываются отдельно.</div>
        <div class="product-page-cta">
          <button class="btn btn-primary btn-lg" data-open-contact>Запросить расчёт</button>
          <a class="btn btn-outline btn-lg" href="tel:${cfg.phoneTel}">Позвонить</a>
        </div>
        ${
          sp.length
            ? `<div class="spec-grid">${sp.map(([k, v]) => `<div class="spec-item"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join("")}</div>`
            : ""
        }
        ${
          item.features?.length
            ? `<h2 class="product-page-h3">Особенности</h2>
        <ul class="modal-features">${item.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`
            : ""
        }
        ${
          item.options?.length
            ? `<h2 class="product-page-h3">Дополнительные опции</h2>
        <div class="modal-options">${item.options.map((o) => `<div class="modal-option"><span>${esc(o.title)}</span><strong>${money(o.price)}</strong></div>`).join("")}</div>`
            : ""
        }
        ${
          item.documents?.length
            ? `<h2 class="product-page-h3">Документы</h2>
        <div class="modal-docs" style="display:flex">${item.documents
          .map((d) => {
            const href = /^https?:/.test(d.url) ? d.url : root + d.url;
            return `<a class="doc-link" href="${esc(href)}" target="_blank" rel="noopener">${esc(d.title)} · ${esc(d.type || "Документ")}</a>`;
          })
          .join("")}</div>`
            : ""
        }
      </div>
    </div>
    ${
      related.length
        ? `<section class="product-page-related"><h2>Похожие товары</h2>
      <div class="product-grid">${related.map((p) => card(p, root, true)).join("")}</div></section>`
        : ""
    }`;
}

function page({ head, bodyAttrs = "", main }) {
  return `<!doctype html>
<html lang="ru" data-root="../">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
${head}
  </head>
  <body${bodyAttrs}>
    ${headerHtml}

    <main>
${main}
    </main>

    ${footerHtml}<script src="../js/app.js"></script>
  </body>
</html>
`;
}

function titleAndStyles(title, desc) {
  return `    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <link rel="stylesheet" href="../css/style.css" />
    <link rel="stylesheet" href="../css/responsive.css" />`;
}

/* ---------- страницы товаров ---------- */
const root = "../";
let built = { product: 0, category: 0 };

for (const item of products) {
  const cat = categoryInfo[item.category]?.title || "Каталог";
  const url = `${SITE}/product/${item.slug}.html`;
  const title = trim(`${item.name} — цена и характеристики | ${cfg.siteName}`, 70);
  const desc = trim(
    `${item.name} — ${item.subtitle || cat}. ${hasPrice(item) ? "Цена " + money(item.price) + "." : "Цена по запросу."} Доставка по Москве и МО, подбор под объект. ${cfg.siteName}.`,
  );
  const image = item.image || (item.gallery && item.gallery[0]) || null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    sku: item.id,
    description: item.description || item.subtitle || item.name,
    brand: { "@type": "Brand", name: item.details?.brand || item.collection || cfg.siteName },
    category: cat,
  };
  if (item.gallery && item.gallery.length) ld.image = item.gallery.map(abs);
  else if (image) ld.image = [abs(image)];
  if (hasPrice(item))
    ld.offers = {
      "@type": "Offer",
      url,
      price: String(Number(item.price)),
      priceCurrency: "RUB",
      seller: { "@type": "Organization", name: "ООО «Дельтастрой»" },
    };
  const crumbs = [
    ["Главная", `${SITE}/`],
    ["Каталог", `${SITE}/pages/catalog.html`],
    [cat, `${SITE}/category/${item.category}.html`],
    [item.name, url],
  ];
  const head = [
    titleAndStyles(title, desc),
    "    <!-- seo:start -->",
    seoBlock({ root, url, title, desc, image, ogType: "product", jsonld: [ld, breadcrumbLd(crumbs)] }),
    "    <!-- seo:end -->",
  ].join("\n");
  const main = `      <section class="section">
        <div class="container">
          <nav class="breadcrumbs" aria-label="Хлебные крошки">
            <a href="../index.html">Главная</a><span>/</span><a href="../pages/catalog.html">Каталог</a><span>/</span><a href="../category/${item.category}.html">${esc(cat)}</a><span>/</span><span class="crumb-current">${esc(item.name)}</span>
          </nav>
          <div id="product-page" data-static="1">
          ${productBody(item, root)}
          </div>
        </div>
      </section>`;
  write(
    `product/${item.slug}.html`,
    page({ head, bodyAttrs: ` data-product="${esc(item.id)}" data-product-name="${esc(item.name)}"`, main }),
  );
  built.product++;
}

/* ---------- страницы категорий ---------- */
const categoriesPresent = categoryOrder.filter((c) => products.some((p) => p.category === c));
for (const cat of categoriesPresent) {
  const info = categoryInfo[cat];
  const list = products.filter((p) => p.category === cat);
  const prices = list.filter(hasPrice).map((p) => Number(p.price));
  const minPrice = prices.length ? Math.min(...prices) : null;
  const collections = [...new Set(list.map((p) => p.collection).filter(Boolean))];
  const url = `${SITE}/category/${cat}.html`;
  const countText = `${list.length} ${plural(list.length, "модель", "модели", "моделей")}`;
  const title = `${info.title} — купить в Москве и МО | ${cfg.siteName}`;
  const desc = trim(
    `${info.title}: ${collections.slice(0, 4).join(", ")} — ${countText}${minPrice ? ", цены от " + nf.format(minPrice) + " ₽" : ""}. Доставка по Москве и МО, подбор под объект. ${cfg.siteName}.`,
  );
  const lead = `${info.desc} В каталоге ${countText}${minPrice ? ", цены от " + nf.format(minPrice) + " ₽" : ""}. Доставляем по Москве и Московской области и помогаем подобрать модель под объект.`;
  const groups = new Map();
  list.forEach((p) => {
    const k = p.collection || info.title;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  });
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: info.title,
    description: desc,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: list.length,
      itemListElement: list.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/product/${p.slug}.html`,
        name: p.name,
      })),
    },
  };
  const crumbs = [
    ["Главная", `${SITE}/`],
    ["Каталог", `${SITE}/pages/catalog.html`],
    [info.title, url],
  ];
  const head = [
    titleAndStyles(title, desc),
    "    <!-- seo:start -->",
    seoBlock({ root, url, title, desc, image: list.find((p) => p.image)?.image, jsonld: [ld, breadcrumbLd(crumbs)] }),
    "    <!-- seo:end -->",
  ].join("\n");
  const blocks = [...groups.entries()]
    .map(
      ([name, items]) => `<section class="collection-block">
          <div class="collection-head"><div><h2>${esc(name)}</h2><p>${items.length} поз.</p></div></div>
          <div class="catalog-grid">${items.map((p) => card(p, root)).join("")}</div>
        </section>`,
    )
    .join("\n        ");
  const otherCats = categoriesPresent
    .filter((c) => c !== cat)
    .map((c) => `<a class="category-link" href="${c}.html">${esc(categoryInfo[c].title)}</a>`)
    .join("");
  const main = `      <section class="catalog-hero">
        <div class="container">
          <nav class="breadcrumbs" aria-label="Хлебные крошки">
            <a href="../index.html">Главная</a><span>/</span><a href="../pages/catalog.html">Каталог</a><span>/</span><span class="crumb-current">${esc(info.title)}</span>
          </nav>
          <div class="eyebrow">Каталог оборудования</div>
          <h1>${esc(info.title)}</h1>
          <p>${esc(lead)}</p>
        </div>
      </section>
      <section class="section">
        <div class="container">
        ${blocks}
          <div class="category-cta">
            <div>
              <h2>Не уверены, какая модель подойдёт?</h2>
              <p>Опишите объект — подберём оборудование и рассчитаем стоимость с доставкой и монтажом.</p>
            </div>
            <div class="category-cta-actions">
              <button class="btn btn-primary btn-lg" data-open-contact>Получить консультацию</button>
              <a class="btn btn-outline btn-lg" href="tel:${cfg.phoneTel}">${cfg.phone}</a>
            </div>
          </div>
          <nav class="category-links" aria-label="Другие категории"><h2>Другие категории</h2><div>${otherCats}</div></nav>
        </div>
      </section>`;
  write(`category/${cat}.html`, page({ head, bodyAttrs: ` data-category="${cat}"`, main }));
  built.category++;
}

/* ---------- существующие страницы: SEO-блок ---------- */
const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ООО «Дельтастрой»",
  alternateName: cfg.siteName,
  url: `${SITE}/`,
  logo: abs("assets/apple-touch-icon.png"),
  telephone: cfg.phoneTel,
  areaServed: cfg.region,
  taxID: "7714415934",
};
const siteLd = { "@context": "https://schema.org", "@type": "WebSite", name: cfg.siteName, url: `${SITE}/` };

const staticPages = [
  { file: "index.html", root: "", path: "", ld: [orgLd, siteLd] },
  { file: "pages/catalog.html", root: "../", path: "pages/catalog.html" },
  { file: "pages/certificates.html", root: "../", path: "pages/certificates.html" },
  { file: "pages/contacts.html", root: "../", path: "pages/contacts.html" },
  { file: "pages/privacy.html", root: "../", path: "pages/privacy.html" },
  {
    file: "pages/consent.html",
    root: "../",
    path: "pages/consent.html",
    desc: "Текст согласия на обработку персональных данных ООО Дельтастрой: перечень данных, цели обработки, срок действия и порядок отзыва согласия.",
  },
  { file: "pages/product.html", root: "../", path: null, robots: "noindex,follow" },
];

for (const sp of staticPages) {
  let html = read(sp.file);
  if (sp.desc) html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(sp.desc)}$2`);
  if (sp.file === "pages/catalog.html") {
    html = html.replace(/\d+\s+позици\S*\s+в одном каталоге/, `${products.length} ${plural(products.length, "позиция", "позиции", "позиций")} в одном каталоге`);
  }
  const title = html.match(/<title>([\s\S]*?)<\/title>/)[1].trim();
  const desc = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [])[1].replace(/\s+/g, " ").trim();
  const url = sp.path === null ? null : `${SITE}/${sp.path}`;
  const block = seoBlock({
    root: sp.root,
    url,
    title,
    desc,
    robots: sp.robots,
    jsonld: sp.ld || [],
  });
  const re = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/;
  if (!re.test(html)) throw new Error("В " + sp.file + " нет маркеров seo:start/seo:end");
  html = html.replace(re, `<!-- seo:start -->\n${block}\n    <!-- seo:end -->`);
  // viewport с поддержкой «чёлок»
  html = html.replace(/<meta name="viewport" content="[^"]*"\s*\/?>/, '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
  write(sp.file, html);
}

/* ---------- sitemap.xml и robots.txt ---------- */
const urls = [
  [`${SITE}/`, "1.0"],
  [`${SITE}/pages/catalog.html`, "0.9"],
  ...categoriesPresent.map((c) => [`${SITE}/category/${c}.html`, "0.8"]),
  ...products.map((p) => [`${SITE}/product/${p.slug}.html`, "0.6"]),
  [`${SITE}/pages/certificates.html`, "0.5"],
  [`${SITE}/pages/contacts.html`, "0.5"],
  [`${SITE}/pages/privacy.html`, "0.2"],
];
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(([u, p]) => `  <url><loc>${esc(u)}</loc><lastmod>${TODAY}</lastmod><priority>${p}</priority></url>`).join("\n") +
    `\n</urlset>\n`,
);
write(
  "robots.txt",
  `User-agent: *\nAllow: /\nDisallow: /pages/product.html\nDisallow: /tools/\n\nSitemap: ${SITE}/sitemap.xml\n`,
);

console.log(`Готово: товаров ${built.product}, категорий ${built.category}, URL в sitemap ${urls.length}. Домен: ${SITE}`);
if (/REPLACE-DOMAIN/.test(SITE))
  console.log("⚠ Укажите настоящий домен в tools/site.config.json и запустите скрипт ещё раз.");

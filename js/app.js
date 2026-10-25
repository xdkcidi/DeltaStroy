/* ---------- Базовые пути ---------- */
const IS_IN_PAGES = location.pathname.includes("/pages/");
const ROOT = IS_IN_PAGES ? "../" : "";
const PAGES = IS_IN_PAGES ? "" : "pages/";

function assetUrl(p) {
  if (!p) return p;
  if (/^(https?:)?\/\//.test(p) || p.startsWith("data:") || p.startsWith("/"))
    return p;
  return ROOT + p;
}
function pageUrl(name) {
  return PAGES + name;
}
function rootUrl(path) {
  return ROOT + path;
}

/* ---------- Данные и утилиты ---------- */
const products = window.DELTA_PRODUCTS || [];
const money = (n) =>
  n === null || n === undefined || n === ""
    ? "Цена по запросу"
    : new Intl.NumberFormat("ru-RU").format(Number(n)) + " ₽";

const categoryInfo = {
  stations: {
    title: "Станции глубокой очистки",
    desc: "Для постоянного и сезонного проживания.",
  },
  septic: {
    title: "Септики",
    desc: "Энергонезависимые решения и крупные модели.",
  },
  kesson: {
    title: "Кессоны",
    desc: "Защита скважины и размещение оборудования.",
  },
  storage: {
    title: "Накопительные ёмкости",
    desc: "Подземное накопление стоков и жидкостей.",
  },
  water: { title: "Ёмкости для воды", desc: "Питьевая и техническая вода." },
  fuel: {
    title: "Ёмкости для топлива",
    desc: "Подземное хранение дизельного топлива.",
  },
  modular: {
    title: "Модульные ёмкости",
    desc: "Большие сегментные подземные резервуары.",
  },
  fire: {
    title: "Пожарные резервуары",
    desc: "Подземный запас воды для пожаротушения.",
  },
  grease: { title: "Жироуловители", desc: "Под мойку и промышленные модели." },
  oil: {
    title: "Нефтеуловители",
    desc: "Решения для очистки стоков от нефтепродуктов.",
  },
  kns: { title: "КНС", desc: "Канализационные насосные станции." },
  sorption: {
    title: "Сорбционные фильтры",
    desc: "Системы фильтрации для объектов и производств.",
  },
  rain: {
    title: "Ливневые очистные",
    desc: "Системы очистки ливневого стока.",
  },
  storm: {
    title: "Пескоуловители",
    desc: "Удаление песка и взвесей из ливневого стока.",
  },
  wells: {
    title: "Колодцы",
    desc: "Дренажные, ревизионные и кабельные решения.",
  },
  components: {
    title: "Комплектующие",
    desc: "Насосы, сигнализация, доборы и сервисные элементы.",
  },
};
const categoryOrder = [
  "stations",
  "septic",
  "kesson",
  "storage",
  "water",
  "fuel",
  "modular",
  "fire",
  "grease",
  "oil",
  "kns",
  "sorption",
  "rain",
  "storm",
  "wells",
  "components",
];

function escapeHtml(s = "") {
  return String(s).replace(
    /[&<>'"]/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        m
      ],
  );
}
function imgFor(item) {
  return item.image || null;
}
function categoryLabel(item) {
  return item.meta?.liters
    ? `${new Intl.NumberFormat("ru-RU").format(item.meta.liters)} л`
    : item.meta?.users
      ? `${item.meta.users} польз.`
      : item.category === "stations"
        ? "Станция"
        : "Каталог";
}
function productUrl(item) {
  return `${pageUrl("product.html")}?id=${encodeURIComponent(item.id)}`;
}

function productCard(item, compact = false) {
  const image = imgFor(item);
  const url = productUrl(item);
  const chips = (item.features || [])
    .slice(0, compact ? 2 : 3)
    .map((x) => `<span class="feature-chip">${escapeHtml(x)}</span>`)
    .join("");
  return `<article class="product-card">
    <a class="product-card-link" href="${url}" aria-label="${escapeHtml(item.name)}">
      <div class="product-visual ${image ? "" : "placeholder"}">
        <span class="card-tag">${escapeHtml(categoryLabel(item))}</span>
        ${image ? `<img src="${assetUrl(image)}" alt="${escapeHtml(item.name)}" loading="lazy">` : ""}
      </div>
    </a>
    <div class="product-body">
      <div class="collection">${escapeHtml(item.collection || "")}</div>
      <h3><a href="${url}">${escapeHtml(item.name)}</a></h3>
      <p>${escapeHtml(item.subtitle || "Инженерное оборудование")}</p>
      <div class="feature-list">${chips}</div>
      <div class="price-row"><div class="price">${money(item.price)}</div></div>
      <a class="btn btn-primary card-btn" href="${url}">Подробнее</a>
    </div>
  </article>`;
}

/* ---------- Подборки на главной ---------- */
function renderFeatured() {
  const box = document.getElementById("featured-products");
  if (!box) return;
  const ids = [
    "ergobox-5",
    "ergobox-3",
    "ergobox-7",
    "pelican-4",
    "termit-profi-3.0",
    "kesson-2-1",
    "storage-3000",
    "grease-03-15",
  ];
  box.innerHTML = ids
    .map((id) => products.find((x) => x.id === id))
    .filter(Boolean)
    .map((x) => productCard(x))
    .join("");
}
function renderErgoboxFeatured() {
  const box = document.getElementById("ergobox-featured");
  if (!box) return;
  const ids = ["ergobox-3", "ergobox-5", "ergobox-6", "ergobox-8"];
  box.innerHTML = ids
    .map((id) => products.find((x) => x.id === id))
    .filter(Boolean)
    .map((x) => productCard(x, true))
    .join("");
}
function renderPelicanFeatured() {
  const box = document.getElementById("pelican-featured");
  if (!box) return;
  const ids = [
    "pelican-3",
    "pelican-3-long",
    "pelican-4",
    "pelican-4-long",
    "pelican-5",
    "pelican-5-long",
  ];
  box.innerHTML = ids
    .map((id) => products.find((x) => x.id === id))
    .filter(Boolean)
    .map((x) => productCard(x, true))
    .join("");
}
function renderTermitFeatured() {
  const box = document.getElementById("termit-featured");
  if (!box) return;
  const ids = [
    "termit-profi-0.7",
    "termit-profi-2.0",
    "termit-profi-3.0",
    "termit-profi-5.5",
    "termit-profi-8.5",
    "termit-profi-м20",
  ];
  box.innerHTML = ids
    .map((id) => products.find((x) => x.id === id))
    .filter(Boolean)
    .map((x) => productCard(x, true))
    .join("");
}

/* ---------- Меню, модалки, формы ---------- */
function initMenu() {
  const t = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  if (!t || !links) return;
  t.setAttribute("aria-expanded", "false");
  t.addEventListener("click", () => {
    const open = links.dataset.open === "1";
    links.dataset.open = open ? "0" : "1";
    t.setAttribute("aria-expanded", String(!open));
    document.body.classList.toggle("menu-open", !open);
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.dataset.open = "0";
      document.body.classList.remove("menu-open");
      t.setAttribute("aria-expanded", "false");
    }),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.dataset.open === "1") {
      links.dataset.open = "0";
      document.body.classList.remove("menu-open");
      t.setAttribute("aria-expanded", "false");
    }
  });
}

function closeModals() {
  document
    .querySelectorAll(".modal")
    .forEach((m) => m.classList.remove("open"));
}
function initModals() {
  document
    .querySelectorAll(
      "[data-close-modal],[data-close-contact],[data-close-bot]",
    )
    .forEach((b) => b.addEventListener("click", closeModals));
  document.querySelectorAll(".modal").forEach((m) =>
    m.addEventListener("click", (e) => {
      if (e.target === m) m.classList.remove("open");
    }),
  );
  document.querySelectorAll("[data-open-contact]").forEach((b) =>
    b.addEventListener("click", () => {
      closeModals();
      document.getElementById("contact-modal")?.classList.add("open");
    }),
  );
  document.querySelectorAll("[data-open-ergobox]").forEach((b) =>
    b.addEventListener("click", () => {
      location.href = pageUrl("catalog.html") + "?search=Ergobox";
    }),
  );
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}
function initForms() {
  document.querySelectorAll("[data-contact-form]").forEach((form) =>
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      form.reset();
      closeModals();
      showToast(
        "Заявка подготовлена. Подключите обработчик формы, чтобы отправлять её в CRM.",
      );
    }),
  );
}

/* ---------- Чат-бот ---------- */
const botSteps = [
  {
    q: "Что нужно решить?",
    opts: [
      ["Канализация для дома", "home"],
      ["Ёмкость для воды", "water"],
      ["Кессон", "kesson"],
      ["Решение для бизнеса", "business"],
    ],
  },
  {
    q: "Сколько человек будет пользоваться системой?",
    opts: [
      ["1–3", "3"],
      ["4–5", "5"],
      ["6–8", "8"],
      ["9–15", "15"],
      ["15+", "20"],
    ],
  },
  {
    q: "Как объект используется?",
    opts: [
      ["Постоянно", "const"],
      ["Сезонно", "season"],
      ["Периодически", "period"],
    ],
  },
  {
    q: "Что важнее?",
    opts: [
      ["Максимальный комфорт", "comfort"],
      ["Независимость от электричества", "energy"],
      ["Минимальная стартовая стоимость", "price"],
      ["Нужен большой объём", "volume"],
    ],
  },
];
let botState = { step: 0, answers: [] };

function botBubble(text, role = "bot") {
  const t = document.getElementById("bot-thread");
  if (!t) return;
  t.insertAdjacentHTML(
    "beforeend",
    `<div class="bot-bubble ${role}">${escapeHtml(text)}</div>`,
  );
  t.scrollTop = t.scrollHeight;
}
function openBot() {
  const m = document.getElementById("bot-modal");
  if (!m) return;
  m.classList.add("open");
  botState = { step: 0, answers: [] };
  const thread = document.getElementById("bot-thread");
  if (thread) thread.innerHTML = "";
  const result = document.getElementById("bot-result");
  if (result) result.innerHTML = "";
  renderBotStep();
}
function renderBotStep() {
  const step = botSteps[botState.step];
  const actions = document.getElementById("bot-actions");
  if (!actions) return;
  if (botState.step === 0)
    botBubble("Здравствуйте! Помогу сузить выбор. Начнём с задачи.");
  else botBubble(step.q);
  actions.innerHTML =
    `<div class="bot-question">${escapeHtml(step.q)}</div>` +
    step.opts
      .map(
        ([label, val]) =>
          `<button class="bot-action" data-bot-value="${val}">${escapeHtml(label)}</button>`,
      )
      .join("");
  actions
    .querySelectorAll("[data-bot-value]")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        chooseBot(btn.dataset.botValue, btn.textContent),
      ),
    );
}
function chooseBot(value, label) {
  botBubble(label, "user");
  botState.answers[botState.step] = value;
  if (botState.step < botSteps.length - 1) {
    botState.step++;
    setTimeout(renderBotStep, 250);
    return;
  }
  setTimeout(renderBotResult, 300);
}
function renderBotResult() {
  const [task, users, mode, priority] = botState.answers;
  let picks = [];
  if (task === "home") {
    if (mode === "season" || priority === "energy")
      picks = products
        .filter((p) => p.collection === "Термит Профи")
        .sort(
          (a, b) =>
            parseFloat(a.meta?.size || 999) - parseFloat(b.meta?.size || 999),
        )
        .slice(0, 3);
    else
      picks = products
        .filter((p) => p.collection === "Ergobox" && p.meta?.users)
        .slice(0, 3);
  } else if (task === "water")
    picks = products.filter((p) => p.category === "water").slice(0, 3);
  else if (task === "kesson")
    picks = products.filter((p) => p.category === "kesson").slice(0, 3);
  else
    picks = products
      .filter((p) =>
        [
          "grease",
          "oil",
          "kns",
          "sorption",
          "rain",
          "storm",
          "modular",
        ].includes(p.category),
      )
      .slice(0, 3);

  if (users && ["3", "5", "8"].includes(users) && task === "home") {
    const n = Number(users);
    picks = picks
      .filter((p) => !p.meta?.users || Number(p.meta.users) <= n)
      .slice(-2)
      .concat(
        picks
          .filter((p) => p.meta?.users && Number(p.meta.users) === n)
          .slice(0, 1),
      );
    picks = [...new Map(picks.map((p) => [p.id, p])).values()].slice(0, 3);
  }
  if (!picks.length) picks = products.slice(0, 3);

  const result = document.getElementById("bot-result");
  if (!result) return;
  result.innerHTML = `<div class="bot-result-box">
    <strong>Предварительно подходят:</strong>
    ${picks.map((p) => `<div style="margin-top:8px"><b><a href="${productUrl(p)}" style="color:inherit">${escapeHtml(p.name)}</a></b> — ${money(p.price)}</div>`).join("")}
    <div style="margin-top:12px;color:#65758a;font-size:11px">Это предварительный подбор. Точный вариант зависит от условий участка и задачи объекта.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:13px">
      <a class="btn btn-primary" href="${pageUrl("catalog.html")}?search=${encodeURIComponent(picks[0]?.collection || "")}">Открыть каталог</a>
      <button class="btn btn-outline" data-open-contact-from-bot>Запросить расчёт</button>
    </div>
  </div>`;
  document
    .querySelector("[data-open-contact-from-bot]")
    ?.addEventListener("click", () => {
      closeModals();
      document.getElementById("contact-modal")?.classList.add("open");
    });
  const actions = document.getElementById("bot-actions");
  if (actions) actions.innerHTML = "";
}
function initBot() {
  document
    .querySelectorAll("[data-open-bot]")
    .forEach((b) => b.addEventListener("click", openBot));
}

/* ---------- Каталог ---------- */
function initCatalog() {
  const root = document.getElementById("catalog-root");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const search = document.getElementById("catalog-search");
  const category = document.getElementById("catalog-category");
  const sort = document.getElementById("catalog-sort");
  const min = document.getElementById("price-min");
  const max = document.getElementById("price-max");
  if (search) search.value = params.get("search") || "";
  if (category) category.value = params.get("category") || "all";

  const audienceBoxes = [...document.querySelectorAll("[data-audience]")];
  const setAudience = params.get("audience");
  if (setAudience && ["home", "business"].includes(setAudience))
    audienceBoxes.forEach((el) => (el.checked = el.value === setAudience));

  const getSel = () =>
    audienceBoxes.filter((el) => el.checked).map((el) => el.value);
  const labelAud = (v) => (v === "home" ? "для дома / дачи" : "для бизнеса");
  const matchesAud = (p, sel) => {
    if (!sel.length) return true;
    const a = String(p.audience || "").toLowerCase();
    return sel.some((v) =>
      v === "home"
        ? a.includes("дом") || a.includes("дач")
        : a.includes("бизнес") || a.includes("промышлен"),
    );
  };

  const render = () => {
    let list = [...products];
    const q = (search?.value || "").trim().toLowerCase();
    const cat = category?.value || "all";
    const sel = getSel();
    const lo = Number(min?.value || 0);
    const hi = Number(max?.value || Infinity);
    if (q)
      list = list.filter((p) =>
        [
          p.name,
          p.collection,
          p.subtitle,
          p.audience,
          (p.tags || []).join(" "),
          (p.features || []).join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    list = list.filter((p) => matchesAud(p, sel));
    list = list.filter((p) => Number(p.price) >= lo && Number(p.price) <= hi);
    if (sort?.value === "priceAsc") list.sort((a, b) => a.price - b.price);
    else if (sort?.value === "priceDesc")
      list.sort((a, b) => b.price - a.price);
    else if (sort?.value === "name")
      list.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    else list.sort((a, b) => Number(b.popular) - Number(a.popular));

    document.getElementById("catalog-count").textContent =
      `Найдено: ${list.length} товаров`;

    const active = document.getElementById("active-filters");
    const chips = [];
    if (cat !== "all") chips.push(categoryInfo[cat]?.title || cat);
    sel.forEach((v) => chips.push(labelAud(v)));
    if (q) chips.push(`поиск: ${q}`);
    active.innerHTML = chips
      .map((x) => `<span class="filter-chip-active">${escapeHtml(x)}</span>`)
      .join("");

    const wrap = document.getElementById("catalog-grid-wrap");
    if (!list.length) {
      wrap.innerHTML =
        '<div class="empty">По выбранным условиям товаров не найдено.<br>Попробуйте убрать часть фильтров или запустить подбор в чат-боте.</div>';
      return;
    }
    const grouped = new Map();
    for (const p of list) {
      const key = p.collection || categoryInfo[p.category]?.title || p.category;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(p);
    }
    const ordered = [...grouped.entries()].sort((a, b) => {
      const ac = categoryOrder.indexOf(a[1][0]?.category);
      const bc = categoryOrder.indexOf(b[1][0]?.category);
      const ai = ac < 0 ? 999 : ac,
        bi = bc < 0 ? 999 : bc;
      if (ai !== bi) return ai - bi;
      return a[0].localeCompare(b[0], "ru");
    });
    wrap.innerHTML = ordered
      .map(
        ([key, items]) => `
      <section class="collection-block">
        <div class="collection-head"><div><h2>${escapeHtml(key)}</h2><p>${items.length} поз.</p></div></div>
        <div class="catalog-grid">${items.map((x) => productCard(x)).join("")}</div>
      </section>`,
      )
      .join("");
  };

  [search, category, sort, min, max].forEach((el) =>
    el?.addEventListener("input", render),
  );
  [category, sort].forEach((el) => el?.addEventListener("change", render));
  audienceBoxes.forEach((el) => el.addEventListener("change", render));
  document.getElementById("clear-filters")?.addEventListener("click", () => {
    search.value = "";
    category.value = "all";
    sort.value = "popular";
    min.value = "";
    max.value = "";
    audienceBoxes.forEach((x) => (x.checked = false));
    render();
  });
  document
    .getElementById("mobile-filter")
    ?.addEventListener("click", () =>
      document.getElementById("filters")?.classList.toggle("open"),
    );
  render();
}

/* ---------- Страница товара ---------- */
function renderProductPage() {
  const root = document.getElementById("product-page");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const item = products.find((x) => x.id === id);
  const crumbs = document.getElementById("product-crumbs");

  if (!item) {
    document.title = "Товар не найден — Дельтастрой";
    if (crumbs)
      crumbs.innerHTML = `<a href="${rootUrl("index.html")}">Главная</a><span>/</span><a href="${pageUrl("catalog.html")}">Каталог</a>`;
    root.innerHTML = `<div class="empty" style="padding:80px 24px;text-align:center">
      <p style="margin:0 0 16px">Товар не найден или снят с продажи.</p>
      <a class="btn btn-primary" href="${pageUrl("catalog.html")}">Вернуться в каталог</a>
    </div>`;
    return;
  }

  document.title = item.name + " — Дельтастрой";
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc)
    metaDesc.setAttribute(
      "content",
      (item.subtitle || item.details?.users_note || item.name) +
        " — Дельтастрой, Москва и МО. Цена, характеристики, доставка и монтаж.",
    );

  if (crumbs) {
    const catTitle = categoryInfo[item.category]?.title || "Каталог";
    crumbs.innerHTML =
      `<a href="${rootUrl("index.html")}">Главная</a><span>/</span>` +
      `<a href="${pageUrl("catalog.html")}">Каталог</a><span>/</span>` +
      `<a href="${pageUrl("catalog.html")}?category=${encodeURIComponent(item.category)}">${escapeHtml(catTitle)}</a><span>/</span>` +
      `<span class="crumb-current">${escapeHtml(item.name)}</span>`;
  }

  const image = item.image || "";
  const gallery =
    item.gallery && item.gallery.length ? item.gallery : image ? [image] : [];

  const specItems = [];
  if (item.meta?.users)
    specItems.push(["Пользователи", String(item.meta.users)]);
  if (item.meta?.liters)
    specItems.push([
      "Объём",
      new Intl.NumberFormat("ru-RU").format(item.meta.liters) + " л",
    ]);
  if (item.meta?.model) specItems.push(["Модель", item.meta.model]);
  if (item.meta?.dimensions)
    specItems.push(["Габариты (Д×Ш×В)", item.meta.dimensions]);
  if (item.details?.warranty)
    specItems.push(["Гарантия", item.details.warranty]);
  if (item.details?.users_note)
    specItems.push(["Применение", item.details.users_note]);
  if (item.details?.installation)
    specItems.push(["Монтаж", item.details.installation]);
  if (item.details?.min_pit_depth_mm) {
    specItems.push([
      "Мин. глубина котлована",
      item.details.min_pit_depth_mm + " мм",
    ]);
    if (item.details.pit_size_mm)
      specItems.push([
        "Мин. размер котлована",
        item.details.pit_size_mm + " мм",
      ]);
    if (item.details.inlet_mm)
      specItems.push([
        "Входящий трубопровод",
        "Ø " + item.details.inlet_mm + " мм",
      ]);
    if (item.details.sand_cushion_mm)
      specItems.push([
        "Песчаная подушка",
        "не менее " + item.details.sand_cushion_mm + " мм",
      ]);
    if (item.details.insulation_mm)
      specItems.push(["Утепление", item.details.insulation_mm + " мм"]);
  }

  const sameCollection = products
    .filter((p) => p.collection === item.collection && p.id !== item.id)
    .slice(0, 4);
  const related = sameCollection.length
    ? sameCollection
    : products
        .filter((p) => p.category === item.category && p.id !== item.id)
        .slice(0, 4);

  root.innerHTML = `
    <div class="product-page-grid">
      <div class="product-page-gallery">
        ${
          gallery.length
            ? `
          <img id="product-main-image" src="${assetUrl(gallery[0])}" alt="${escapeHtml(item.name)}">
          ${
            gallery.length > 1
              ? `<div class="product-page-thumbs">${gallery
                  .map(
                    (src, i) =>
                      `<img src="${assetUrl(src)}" data-thumb-index="${i}" class="${i === 0 ? "active" : ""}" alt="">`,
                  )
                  .join("")}</div>`
              : ""
          }
        `
            : `<div class="product-visual placeholder" style="height:440px;border-radius:20px"></div>`
        }
      </div>
      <div class="product-page-info">
        <div class="eyebrow">${escapeHtml(item.collection || "Каталог")}</div>
        <h1>${escapeHtml(item.name)}</h1>
        <p class="product-page-sub">${escapeHtml(item.subtitle || "Инженерное решение")}</p>
        <div class="product-page-price">${money(item.price)}</div>
        <div class="modal-note">Доставка, монтаж и дополнительные опции рассчитываются отдельно.</div>
        <div class="product-page-cta">
          <button class="btn btn-primary btn-lg" data-open-contact>Запросить расчёт</button>
          <a class="btn btn-outline btn-lg" href="tel:+74955064878">Позвонить</a>
        </div>
        ${
          specItems.length
            ? `<div class="spec-grid">${specItems
                .map(
                  ([k, v]) =>
                    `<div class="spec-item"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`,
                )
                .join("")}</div>`
            : ""
        }
        ${
          item.features?.length
            ? `<h3 class="product-page-h3">Особенности</h3>
          <ul class="modal-features">${item.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>`
            : ""
        }
        ${
          item.options?.length
            ? `<h3 class="product-page-h3">Дополнительные опции</h3>
          <div class="modal-options">${item.options
            .map(
              (o) =>
                `<div class="modal-option"><span>${escapeHtml(o.title)}</span><strong>${money(o.price)}</strong></div>`,
            )
            .join("")}</div>`
            : ""
        }
        ${
          item.documents?.length
            ? `<h3 class="product-page-h3">Документы</h3>
          <div class="modal-docs" style="display:flex">${item.documents
            .map(
              (d) =>
                `<a class="doc-link" href="${assetUrl(d.url)}" target="_blank" rel="noopener">${escapeHtml(d.title)} · ${escapeHtml(d.type || "Документ")}</a>`,
            )
            .join("")}</div>`
            : ""
        }
      </div>
    </div>
    ${
      related.length
        ? `<section class="product-page-related"><h2>Похожие товары</h2>
      <div class="product-grid">${related.map((p) => productCard(p, true)).join("")}</div></section>`
        : ""
    }
  `;

  const main = document.getElementById("product-main-image");
  if (main) {
    root.querySelectorAll("[data-thumb-index]").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        main.src = assetUrl(gallery[Number(thumb.dataset.thumbIndex)]);
        root
          .querySelectorAll("[data-thumb-index]")
          .forEach((t) => t.classList.toggle("active", t === thumb));
      });
    });
  }
}

function boot() {
  renderFeatured();
  renderErgoboxFeatured();
  renderPelicanFeatured();
  renderTermitFeatured();
  renderProductPage();
  initMenu();
  initModals();
  initForms();
  initBot();
  initCatalog();
}
document.addEventListener("DOMContentLoaded", boot);

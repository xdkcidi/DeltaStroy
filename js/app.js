/* ---------- Базовые пути ---------- */
const IS_IN_PAGES = location.pathname.includes("/pages/");
const ROOT =
  document.documentElement.dataset.root ?? (IS_IN_PAGES ? "../" : "");
const PAGES = ROOT + "pages/";

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
    title: "Накопительные септики и ёмкости",
    desc: "Герметичные подземные резервуары для сбора и хранения стоков.",
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
  if (item.meta?.liters)
    return `${new Intl.NumberFormat("ru-RU").format(item.meta.liters)} л`;
  if (item.meta?.users) return `${item.meta.users} польз.`;
  if (item.meta?.flow_l_s) return `${item.meta.flow_l_s} л/с`;
  if (item.meta?.flow_l_min) return `${item.meta.flow_l_min} л/мин`;
  if (item.category === "stations") return "Станция";
  if (item.category === "grease") return "Жироуловитель";
  if (item.category === "storm") return "Пескоуловитель";
  if (item.category === "kns") return "КНС";
  return categoryInfo[item.category]?.title || "Каталог";
}
function productUrl(item) {
  return `${ROOT}product/${item.slug || item.id}.html`;
}
function categoryUrl(cat) {
  return `${ROOT}category/${cat}.html`;
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
    // Каталог из 300+ карточек тяжёлый для телефонов: в каждой линейке сначала
    // показываем часть карточек, остальные раскрываются кнопкой.
    const LIMIT = window.innerWidth < 781 ? 4 : 6;
    const limited = list.length > 40;
    wrap.innerHTML = ordered
      .map(([key, items]) => {
        const extra = limited ? Math.max(0, items.length - LIMIT) : 0;
        const cards = items
          .map((x, i) => {
            const html = productCard(x);
            return limited && i >= LIMIT
              ? html.replace(
                  '<article class="product-card">',
                  '<article class="product-card" data-extra hidden>',
                )
              : html;
          })
          .join("");
        return `
      <section class="collection-block">
        <div class="collection-head"><div><h2>${escapeHtml(key)}</h2><p>${items.length} поз.</p></div></div>
        <div class="catalog-grid">${cards}</div>
        ${extra ? `<button type="button" class="btn btn-outline show-more" data-show-more>Показать ещё ${extra}</button>` : ""}
      </section>`;
      })
      .join("");
    wrap.querySelectorAll("[data-show-more]").forEach((btn) =>
      btn.addEventListener("click", () => {
        btn
          .closest(".collection-block")
          .querySelectorAll("[data-extra]")
          .forEach((el) => el.removeAttribute("hidden"));
        btn.remove();
      }),
    );
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
// Статические страницы товаров лежат в /product/<slug>.html и собираются tools/build.js.
// Старые ссылки pages/product.html?id=... перенаправляются на новые адреса.
function renderProductPage() {
  const root = document.getElementById("product-page");
  if (!root || root.dataset.static === "1") return;
  const params = new URLSearchParams(location.search);
  const aliases = window.DELTA_ID_ALIASES || {};
  const id = aliases[params.get("id")] || params.get("id");
  const item = products.find((x) => x.id === id);
  if (item) {
    location.replace(productUrl(item));
    return;
  }
  document.title = "Товар не найден — Дельтастрой";
  root.innerHTML = `<div class="empty" style="padding:80px 24px;text-align:center">
      <p style="margin:0 0 16px">Товар не найден или снят с продажи.</p>
      <a class="btn btn-primary" href="${pageUrl("catalog.html")}">Вернуться в каталог</a>
    </div>`;
}

/* Галерея на статической странице товара */
function initStaticGallery() {
  const main = document.getElementById("product-main-image");
  if (!main) return;
  const thumbs = document.querySelectorAll("[data-thumb-index]");
  thumbs.forEach((thumb) =>
    thumb.addEventListener("click", () => {
      main.src = thumb.dataset.src;
      thumbs.forEach((t) => t.classList.toggle("active", t === thumb));
    }),
  );
}

/* ---------- Нижняя панель на телефонах ---------- */
function initMobileBar() {
  if (document.querySelector(".mobile-bar") || !document.getElementById("contact-modal")) return;
  const phoneLink = document.querySelector('a.phone[href^="tel:"]');
  const tel = phoneLink ? phoneLink.getAttribute("href") : "tel:+74955064878";
  const bar = document.createElement("div");
  bar.className = "mobile-bar";
  bar.innerHTML = `<a class="btn btn-outline" href="${tel}">Позвонить</a><button class="btn btn-primary" type="button" data-open-contact>Оставить заявку</button>`;
  document.body.appendChild(bar);
}

function boot() {
  renderFeatured();
  renderErgoboxFeatured();
  renderPelicanFeatured();
  renderTermitFeatured();
  renderProductPage();
  initStaticGallery();
  initMenu();
  initMobileBar();
  initModals();
  initForms();
  initBot();
  initCatalog();
}
document.addEventListener("DOMContentLoaded", boot);

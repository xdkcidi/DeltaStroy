/* Яндекс.Метрика и цели.
 *
 * 1. Создайте счётчик на https://metrika.yandex.ru и впишите его номер в YM_ID ниже.
 * 2. Пока YM_ID = 0, скрипт ничего не загружает и не отправляет.
 * 3. Цели создайте в Метрике как «JavaScript-событие» с идентификаторами из списка:
 *    phone_click, messenger_click, open_contact_modal, open_bot, form_submit,
 *    doc_open, product_view, category_view, catalog_search
 * Вебвизор отключён намеренно: в формах вводятся персональные данные.
 */
(function () {
  var YM_ID = 0; // ← номер счётчика Яндекс.Метрики

  function goal(name, params) {
    if (!YM_ID || typeof window.ym !== "function") return;
    try {
      window.ym(YM_ID, "reachGoal", name, params || {});
    } catch (e) {}
  }
  window.deltaGoal = goal; // можно вызывать из другого кода, например после отправки формы

  if (YM_ID) {
    (function (m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function () {
          (m[i].a = m[i].a || []).push(arguments);
        };
      m[i].l = 1 * new Date();
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(YM_ID, "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false,
    });
  }

  var page = location.pathname;

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target.closest ? e.target.closest("a,button") : null;
      if (!el) return;
      var href = el.getAttribute("href") || "";
      if (href.indexOf("tel:") === 0) return goal("phone_click", { page: page });
      if (/wa\.me|t\.me|max\.ru/.test(href))
        return goal("messenger_click", { page: page, url: href });
      if (/\.pdf($|\?)/i.test(href) || el.classList.contains("doc-link") || el.closest(".certificate-card"))
        return goal("doc_open", { page: page, url: href });
      if (el.hasAttribute("data-open-contact"))
        return goal("open_contact_modal", { page: page });
      if (el.hasAttribute("data-open-bot")) return goal("open_bot", { page: page });
    },
    true,
  );

  // Отправка формы: срабатывает при любой реализации обработчика (в том числе PHP).
  document.addEventListener(
    "submit",
    function (e) {
      if (e.target.matches && e.target.matches("[data-contact-form]"))
        goal("form_submit", { page: page });
    },
    true,
  );

  document.addEventListener("change", function (e) {
    if (e.target.id === "catalog-search") goal("catalog_search", { q: e.target.value });
  });

  document.addEventListener("DOMContentLoaded", function () {
    var body = document.body;
    if (body.dataset.product)
      goal("product_view", { id: body.dataset.product, name: body.dataset.productName || "" });
    if (body.dataset.category) goal("category_view", { category: body.dataset.category });
  });
})();

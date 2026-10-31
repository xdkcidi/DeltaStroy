# Дельтастрой: как пересобрать страницы

1. Откройте `tools/site.config.json` и впишите настоящий домен в `siteUrl` (например `https://example.ru`).
2. Откройте `js/analytics.js` и впишите номер счётчика Яндекс.Метрики в `YM_ID`.
3. Запустите: `node tools/build.js` (нужен Node.js). Скрипт пересоздаёт `product/`, `category/`, `sitemap.xml`, `robots.txt` и SEO-блоки.

Запускать заново нужно после любых правок `js/data.js`, шапки/подвала (они берутся из `pages/product.html`) или адреса сайта.
Папку `tools/` на хостинг загружать не обязательно.
Без Node.js: пришлите домен, и страницы будут пересобраны за вас.

Старые ссылки `pages/product.html?id=...` перенаправляются на `product/<slug>.html` автоматически.

## Описания товаров
`node tools/enrich.js` пересоздаёт описания и вместимость (meta.users) в `js/data.js`.
Факты взяты с сайта производителя multplast.ru (вместимость моделей, особенности корпуса) и из параметров каталога.
Если вы вручную поправили описание конкретного товара в `js/data.js`, не запускайте enrich.js повторно: он перепишет все описания.

## GitHub Pages
В `tools/site.config.json` указан адрес https://xdkcidi.github.io/DeltaStroy. robots.txt на адресе вида /DeltaStroy/ поисковики не читают
(он работает только в корне домена), поэтому отправьте sitemap.xml в Яндекс Вебмастер и Google Search Console вручную.
При переходе на свой домен поменяйте siteUrl и запустите `node tools/build.js`.

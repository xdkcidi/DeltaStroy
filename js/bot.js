/* Помощник по подбору оборудования Дельтастроя.
 * Загружается по первому нажатию на кнопку чата (см. initBot в app.js).
 * Логика подбора вынесена в чистые функции recommend*() — их можно тестировать без интерфейса:
 *   DeltaBot.recommend("home", { users: 4, mode: "const", outlet: "ground", priority: "energy" })
 */
(function () {
  "use strict";
  var ROOT = document.documentElement.dataset.root || "";
  var nf = function (n) {
    return new Intl.NumberFormat("ru-RU").format(n).replace(/\u00a0/g, " ");
  };
  var money = function (n) {
    return n ? nf(n) + " ₽" : "Цена по запросу";
  };
  var rnd = function (a) {
    return a[Math.floor(Math.random() * a.length)];
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var plural = function (n, a, b, c) {
    var m10 = n % 10, m100 = n % 100;
    return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c;
  };
  var upTo = function (n) {
    return "до " + n + " " + (n === 1 ? "человека" : "человек");
  };

  /* ---------------- данные ---------------- */
  function products() {
    return window.DELTA_PRODUCTS || [];
  }
  function ensureData(cb) {
    if (window.DELTA_PRODUCTS) return cb();
    var s = document.createElement("script");
    s.src = ROOT + "js/data.js";
    s.onload = cb;
    document.head.appendChild(s);
  }
  var byPrice = function (a, b) {
    return (a.price || 1e12) - (b.price || 1e12);
  };

  /* ---------------- подбор: дом / дача ---------------- */
  var FAMILIES = {
    profi: { kind: "septic", test: function (p) { return p.collection === "Термит Профи"; } },
    transformer: { kind: "septic", test: function (p) { return p.collection === "Термит Трансформер"; } },
    profiM: { kind: "septic", test: function (p) { return p.collection === "Термит Профи М"; } },
    ergobox: { kind: "station", test: function (p) { return p.collection === "Ergobox" && p.category === "stations"; } },
    pelican: { kind: "station", test: function (p) { return p.collection === "Пеликан" && p.category === "stations"; } },
    st: { kind: "station", test: function (p) { return p.collection === "Модуль ST"; } },
    storage: { kind: "storage", test: function (p) { return p.category === "storage"; } },
  };

  function famScore(fam, a) {
    var kind = FAMILIES[fam].kind, s = 0;
    if (kind === "station") {
      if (a.mode === "const") s += 3;
      if (a.mode === "period") s -= 2;
      if (a.priority === "comfort") s += 3;
      if (a.priority === "energy") s -= 4;
      if (a.priority === "price") s -= 2;
      if (a.outlet === "limited") s += 3;
      if (a.outlet === "unknown") s += 1;
      if (fam === "pelican" && a.priority === "comfort") s += 0.6;
      if (fam === "ergobox" && a.priority === "price") s += 0.6;
      if (fam === "ergobox") s += 0.2;
    } else if (kind === "septic") {
      if (a.mode !== "const") s += 3;
      if (a.priority === "energy") s += 4;
      if (a.priority === "price") s += 3;
      if (a.priority === "comfort") s -= 1;
      if (a.outlet === "ground") s += 2;
      if (a.outlet === "limited") s -= 9;
      if (fam === "profi") s += a.priority === "price" ? 1 : 0.3;
    } else if (kind === "storage") {
      s = a.outlet === "limited" && a.mode !== "const" ? 5 + (a.priority === "price" ? 2 : 0) : -99;
    }
    return s;
  }

  function whyHome(fam, p, a, need) {
    var w = [], kind = FAMILIES[fam].kind;
    if (kind === "storage") {
      w.push("Герметичный накопитель — очищенную воду не нужно отводить в грунт");
      w.push("Объём " + nf(p.meta.liters) + " л (ориентир — около 600 л на человека; итог зависит от частоты вывоза)");
      w.push("Потребуется периодический вызов ассенизатора");
      return w;
    }
    if (p.meta.users) w.push("Рассчитан " + upTo(p.meta.users) + (need ? " — вы указали " + need : ""));
    if (kind === "septic") {
      w.push("Работает без электричества" + (a.priority === "energy" ? " — как вы и хотели" : ""));
      if (a.outlet === "ground") w.push("Очищенная вода уходит в грунт — нужна почвенная доочистка");
      if (a.mode !== "const") w.push("Хорошо подходит для сезонного и периодического использования");
    } else {
      w.push("Глубокая биологическая очистка (до 98% по данным производителя)");
      if (a.outlet === "limited") w.push("Подходит, когда грунт плохо принимает воду");
      if (a.mode === "const") w.push("Рассчитана на постоянное проживание");
      w.push("Нужно подключение к электросети");
    }
    return w;
  }

  function recommendHome(a) {
    var P = products(), need = Number(a.users) || 1;
    var fams = ["profi", "transformer", "ergobox", "pelican", "storage"];
    if (need > 10) fams = ["profi", "profiM", "st"];
    else if (need > 6) fams = ["profi", "ergobox", "pelican", "storage"];
    var cands = [];
    fams.forEach(function (f) {
      var items = P.filter(FAMILIES[f].test).filter(function (p) {
        if (f === "storage") return p.meta.liters >= need * 600;
        return p.meta.users >= need;
      });
      items.sort(function (x, y) {
        var kx = f === "storage" ? x.meta.liters : x.meta.users;
        var ky = f === "storage" ? y.meta.liters : y.meta.users;
        return kx - ky || byPrice(x, y);
      });
      if (!items.length) return;
      var sc = famScore(f, a);
      if (sc <= -50) return;
      cands.push({ fam: f, score: sc, items: items });
    });
    cands.sort(function (x, y) { return y.score - x.score; });
    var picks = [];
    cands.slice(0, 3).forEach(function (c, i) {
      var p = c.items[0];
      picks.push({ p: p, tag: i === 0 ? "Лучше всего подходит" : "Альтернатива", why: whyHome(c.fam, p, a, need), fam: c.fam });
    });
    if (picks.length < 3 && cands[0] && cands[0].items[1]) {
      var p2 = cands[0].items[1];
      picks.push({ p: p2, tag: "С запасом по нагрузке", why: whyHome(cands[0].fam, p2, a, need), fam: cands[0].fam });
    }
    var notes = ["Это предварительный подбор: окончательный вариант зависит от грунтов, уровня грунтовых вод и рельефа участка."];
    if (picks[0] && FAMILIES[picks[0].fam].kind === "septic" && a.mode === "const") {
      notes.push("Септик даёт предварительную очистку — стоки нужно доочищать в грунте; если участок это не позволяет, лучше станция глубокой очистки.");
    }
    if (a.outlet === "limited" && a.priority === "energy" && picks[0] && FAMILIES[picks[0].fam].kind === "station") {
      notes.push("Станции нужна электросеть, но при плохом приёме воды грунтом септик без доочистки не подойдёт — поэтому на первом месте станция.");
    }
    if (a.outlet === "limited" && picks[0] && FAMILIES[picks[0].fam].kind === "septic") {
      notes.push("Внимание: при плохом приёме воды грунтом септику потребуется дренажное решение или регулярный вывоз — обсудите это с менеджером.");
    }
    if (a.outlet === "limited" && picks.some(function (x) { return FAMILIES[x.fam].kind === "septic"; })) {
      notes.push("При высоких грунтовых водах септик Термит Профи выпускается в исполнении PR с дренажным насосом — потребуется розетка.");
    }
    if (need > 10) notes.push("Для такой нагрузки расчёт лучше делать по суточному расходу воды — менеджер поможет.");
    return { picks: picks, notes: notes };
  }

  /* ---------------- подбор: вода и ёмкости ---------------- */
  var WATER = {
    drink: function (p) { return p.category === "water" && (p.collection === "ДПВ — питьевая вода" || p.collection === "Модуль 3В" || p.collection.indexOf("питьевой воды") > -1); },
    tech: function (p) { return p.collection === "Техническая вода КР" || p.collection === "Модульные ёмкости М" || p.collection === "Модуль 3М"; },
    kas: function (p) { return p.collection === "Ёмкости КАС"; },
    fire: function (p) { return p.category === "fire"; },
    diesel: function (p) { return p.category === "fuel"; },
  };
  var WATER_WHY = {
    drink: "Предназначена для хранения питьевой воды",
    tech: "Подходит для технической воды: полив, хозяйственные и технологические нужды",
    kas: "Рассчитана на хранение жидкого удобрения КАС",
    fire: "Пожарный резервуар для противопожарного запаса воды",
    diesel: "Резервуар для хранения дизельного топлива",
  };
  function recommendWater(a) {
    var P = products(), need = Number(a.volume) || 1000;
    var pool = P.filter(WATER[a.purpose] || WATER.tech).filter(function (p) { return p.meta.liters; });
    pool.sort(function (x, y) { return x.meta.liters - y.meta.liters || byPrice(x, y); });
    var notes = [];
    var fit = pool.filter(function (p) { return p.meta.liters >= need; });
    var picks = [];
    var why = function (p, extra) {
      var w = [WATER_WHY[a.purpose], "Объём " + nf(p.meta.liters) + " л" + (need ? " — вам нужно не меньше " + nf(need) + " л" : "")];
      if (extra) w.push(extra);
      return w;
    };
    if (!fit.length && pool.length) {
      var last = pool[pool.length - 1];
      picks.push({ p: last, tag: "Максимум в линейке", why: why(last, "Больший объём набирается из нескольких модулей — рассчитаем") });
      notes.push("Запрошенный объём больше, чем одна ёмкость этой серии — подберём набор модулей.");
    } else {
      var minLiters = fit[0].meta.liters;
      var sameSize = fit.filter(function (p) { return p.meta.liters === minLiters; }).sort(byPrice);
      picks.push({ p: sameSize[0], tag: "Лучше всего подходит", why: why(sameSize[0]) });
      if (sameSize[1]) picks.push({ p: sameSize[1], tag: "Тот же объём, другая серия", why: why(sameSize[1], "Другая конструкция того же объёма — сравните цену и комплектацию") });
      var bigger = fit.filter(function (p) { return p.meta.liters > minLiters; })[0];
      if (bigger) picks.push({ p: bigger, tag: "С запасом по объёму", why: why(bigger, "Запас на будущее или на пиковое потребление") });
      var smaller = pool.filter(function (p) { return p.meta.liters < need; }).pop();
      if (smaller && picks.length < 3) picks.push({ p: smaller, tag: "Если хватит меньшего", why: why(smaller, "Меньше запрошенного — подойдёт, если расход ниже расчётного") });
    }
    if (a.purpose === "fire") notes.push("Объём пожарного запаса определяется проектом и нормами — лучше согласовать его до заказа.");
    if (a.purpose === "fire" && need < 10000) notes.push("Минимальный пожарный резервуар в каталоге — 10 м³ (10 000 л).");
    if (a.purpose === "kas" && need > 10000) notes.push("Для объёмов больше 10 м³ уточните у менеджера совместимость модульных ёмкостей с КАС.");
    if (a.purpose === "drink") notes.push("Перед заполнением питьевая ёмкость промывается и дезинфицируется; подводку подберём под источник воды.");
    if (a.purpose === "diesel") notes.push("Условия размещения топливной ёмкости зависят от нормативов — менеджер подскажет по вашему случаю.");
    return { picks: picks.slice(0, 3), notes: notes.length ? notes : ["Предварительный подбор: точный вариант зависит от места установки и подключения."] };
  }

  /* ---------------- подбор: бизнес ---------------- */
  function recommendBusiness(a) {
    var P = products(), picks = [], notes = [], links = [];
    var t = a.type;
    if (t === "grease") {
      var small = P.filter(function (p) { return p.category === "grease" && !p.meta.liters; }).sort(byPrice);
      var flows = { small: ["grease-03-15", "grease-03-20"], mid: ["grease-05-25", "grease-05-40", "grease-1-60"], large: ["grease-1-60", "grease-1-80"] };
      var ids = flows[a.size] || flows.mid;
      ids.forEach(function (id, i) {
        var p = P.filter(function (x) { return x.id === id; })[0];
        if (p) picks.push({ p: p, tag: i === 0 ? "Лучше всего подходит" : "Альтернатива", why: ["Компактный жироуловитель под мойку", "Отделяет жир до попадания в канализацию", "Корпус из полиэтилена не подвержен коррозии"] });
      });
      if (a.size === "xl") {
        var big = P.filter(function (p) { return p.category === "grease" && p.meta.liters; }).sort(function (x, y) { return x.meta.liters - y.meta.liters; }).slice(0, 3);
        picks = big.map(function (p, i) { return { p: p, tag: i === 0 ? "С чего начать" : "Больший объём", why: ["Промышленный жироуловитель объёмом " + nf(p.meta.liters) + " л", "Типоразмер уточняется по расходу стоков"] }; });
        notes.push("Для крупных кухонь и производств объём жироуловителя считается по расходу стоков — пришлите данные, рассчитаем.");
      }
      if (!small.length) picks = [];
    } else if (t === "treat") {
      links = [["Пескоуловители", "storm"], ["Нефтеуловители", "oil"], ["Сорбционные фильтры", "sorption"], ["Ливневые очистные", "rain"]];
      notes.push("Типовая схема для площадок с автотранспортом: пескоуловитель → нефтеуловитель → при необходимости сорбционный фильтр. Типоразмеры подбираются расчётом по площади водосбора и интенсивности осадков.");
      var s1 = P.filter(function (p) { return p.category === "oil"; }).sort(byPrice)[0];
      if (s1) picks.push({ p: s1, tag: "Нефтеуловитель (от)", why: ["Отделяет нефтепродукты от стоков", "В каталоге типоразмеры от Н5 до Н100 — подберём по расчёту"] });
      var s2 = P.filter(function (p) { return p.category === "storm"; }).sort(byPrice)[0];
      if (s2) picks.push({ p: s2, tag: "Пескоуловитель (от)", why: ["Задерживает песок и взвесь перед следующей ступенью", "Размер зависит от расхода стока"] });
      var s3 = P.filter(function (p) { return p.category === "rain"; }).sort(byPrice)[0];
      if (s3) picks.push({ p: s3, tag: "Модуль ЛОС (от)", why: ["Комплексная очистка ливневого стока", "Типоразмеры от ЛОС 8 до ЛОС 100"] });
    } else if (t === "storm") {
      var l = P.filter(function (p) { return p.category === "rain"; }).sort(byPrice);
      picks = l.slice(0, 2).map(function (p, i) { return { p: p, tag: i === 0 ? "С чего начать" : "Больше производительность", why: ["Очистное сооружение для ливневого и производственного стока", "Типоразмер подбирается расчётом"] }; });
      links = [["Пескоуловители", "storm"], ["Сорбционные фильтры", "sorption"]];
      notes.push("Для ливневой канализации обычно добавляют пескоуловитель на входе и сорбционный фильтр на выходе.");
    } else if (t === "people") {
      var n = Number(a.size) || 20;
      var fams = [["st", "station"], ["profiM", "septic"]];
      fams.forEach(function (f, i) {
        var items = P.filter(FAMILIES[f[0]].test).filter(function (p) { return p.meta.users >= n; }).sort(function (x, y) { return x.meta.users - y.meta.users; });
        if (!items[0]) return;
        var isSt = f[1] === "station";
        picks.push({ p: items[0], tag: isSt ? "Станция глубокой очистки" : "Энергонезависимый септик", why: [
          "Рассчитан " + upTo(items[0].meta.users) + " — вы указали " + n,
          isSt ? "Модульная станция, нужна электросеть" : "Работает без электричества, подходит для удалённых объектов",
          isSt ? "Глубокая очистка для сброса в более требовательных условиях" : "Стоки требуют доочистки в грунте",
        ] });
      });
      if (n <= 10) {
        var eb = P.filter(FAMILIES.ergobox.test).filter(function (p) { return p.meta.users >= n; }).sort(function (x, y) { return x.meta.users - y.meta.users; })[0];
        if (eb) picks.push({ p: eb, tag: "Для небольшого объекта", why: ["Рассчитан " + upTo(eb.meta.users), "Станция глубокой очистки до 98% по данным производителя"] });
      }
      notes.push("Для гостиниц, баз отдыха и посёлков нагрузку считают по суточному расходу воды, а не по числу жильцов — менеджер сделает расчёт.");
    } else if (t === "kns") {
      var k = P.filter(function (p) { return p.category === "kns"; })[0];
      if (k) picks.push({ p: k, tag: "Подходит для малых объёмов", why: ["Собирает стоки и перекачивает при невозможности самотёчного отвода", "Производительность " + k.meta.flow_l_min + " л/мин"] });
      notes.push("Если нужна большая производительность, подберём насосную станцию под ваш расход — оставьте заявку.");
    }
    if (!notes.length) notes.push("Предварительный подбор: точный типоразмер зависит от расчёта по вашему объекту.");
    return { picks: picks.slice(0, 4), notes: notes, links: links };
  }

  function recommendKesson() {
    var items = products().filter(function (p) { return p.category === "kesson"; }).sort(byPrice);
    return {
      picks: items.map(function (p, i) {
        return { p: p, tag: i === 0 ? "Самый доступный" : "Вариант", why: (p.features || []).slice(0, 3) };
      }),
      notes: ["Размер кессона зависит от диаметра обсадной трубы, глубины и состава оборудования (насос, автоматика, гидроаккумулятор) — менеджер уточнит и подтвердит модель."],
    };
  }

  function recommend(flow, a) {
    if (flow === "home") return recommendHome(a);
    if (flow === "water") return recommendWater(a);
    if (flow === "business") return recommendBusiness(a);
    if (flow === "kesson") return recommendKesson(a);
    return { picks: [], notes: [] };
  }

  /* ---------------- сценарий диалога ---------------- */
  var GREET = [
    "Здравствуйте! Я помощник Дельтастроя. Помогу сузить выбор за пару вопросов.",
    "Добрый день! Давайте подберём оборудование — это займёт минуту.",
    "Привет! Отвечайте на вопросы кнопками, а я предложу подходящие модели.",
  ];
  var START = {
    key: "flow",
    q: ["Что нужно решить?", "С чего начнём — какая задача?", "Расскажите, что вы подбираете?"],
    opts: [["Канализация для дома или дачи", "home"], ["Ёмкость для воды, топлива, удобрений", "water"], ["Кессон для скважины", "kesson"], ["Решение для бизнеса", "business"]],
  };
  var FLOWS = {
    home: [
      {
        key: "users", q: ["Сколько человек будут пользоваться системой?", "Сколько человек живёт в доме (с учётом гостей)?"],
        opts: [["1–2", 2], ["3–4", 4], ["5–6", 6], ["7–10", 10], ["Больше 10", 15]],
        react: function (v) { return rnd(["Учту запас по нагрузке: подбираю модели, которые выдержат " + v + " " + plural(v, "человека", "человек", "человек") + ".", "Хорошо, ориентируюсь на нагрузку — не менее " + v + " чел."]); },
      },
      {
        key: "mode", q: ["Как вы будете жить в доме?", "Как часто дом используется?"],
        opts: [["Постоянно, круглый год", "const"], ["Сезонно (весна–осень)", "season"], ["Периодически, по выходным", "period"]],
        react: function (v) { return v === "const" ? "При постоянном проживании важна стабильность очистки." : "При непостоянном использовании важна простота и устойчивость к простоям."; },
      },
      {
        key: "outlet", q: ["Куда можно отводить очищенную воду?", "Как участок принимает воду — есть ли куда её отвести?"],
        opts: [["В грунт — участок песчаный/суглинок, УГВ низкий", "ground"], ["Грунт плохо принимает: глина, высокий УГВ, мало места", "limited"], ["Не знаю", "unknown"]],
        react: function (v) { return v === "unknown" ? "Ничего страшного — при расчёте менеджер уточнит грунты и УГВ." : v === "limited" ? "Тогда септик с фильтрацией в грунт рискованный выбор — учту это." : "Хорошо, значит можно рассматривать варианты с отводом в грунт."; },
      },
      {
        key: "priority", q: ["Что для вас важнее всего?", "И последний вопрос — главный приоритет?"],
        opts: [["Максимальный комфорт и качество очистки", "comfort"], ["Независимость от электричества", "energy"], ["Минимальная цена", "price"]],
        react: function () { return rnd(["Принято, считаю варианты.", "Спасибо! Подбираю модели…", "Отлично, сейчас всё сопоставлю."]); },
      },
    ],
    water: [
      {
        key: "purpose", q: ["Что будет храниться?", "Для чего нужна ёмкость?"],
        opts: [["Питьевая вода", "drink"], ["Техническая вода (полив, хозяйство)", "tech"], ["Удобрение КАС", "kas"], ["Пожарный запас воды", "fire"], ["Дизельное топливо", "diesel"]],
      },
      {
        key: "volume", q: ["Какой объём нужен?", "Сколько нужно хранить?"],
        opts: [["до 1 м³", 1000], ["до 3 м³", 3000], ["до 10 м³", 10000], ["до 30 м³", 30000], ["больше 30 м³", 60000]],
        react: function () { return "Подберу ёмкости не меньше этого объёма."; },
      },
    ],
    business: [
      {
        key: "type", q: ["Какая задача на объекте?", "Что нужно очищать или хранить?"],
        opts: [["Кафе, столовая, пищевое производство", "grease"], ["Мойка, парковка, АЗС, промплощадка", "treat"], ["Ливневая канализация", "storm"], ["Гостиница, база отдыха, посёлок", "people"], ["Перекачка стоков", "kns"]],
      },
    ],
  };
  var BUSINESS_SECOND = {
    grease: { key: "size", q: ["Какой расход на кухне?", "Какая нагрузка на жироуловитель?"], opts: [["1–2 мойки", "small"], ["Кухня кафе", "mid"], ["Большая столовая", "large"], ["Промышленное производство", "xl"]] },
    people: { key: "size", q: ["На сколько человек нужна система?", "Какая нагрузка по людям?"], opts: [["до 10", 10], ["до 20", 20], ["до 40", 40], ["до 60", 60], ["до 100", 100]] },
  };

  /* ---------------- интерфейс ---------------- */
  var modal, thread, actions, result, state;

  function build() {
    var old = document.getElementById("bot-modal");
    if (old) old.remove();
    modal = document.createElement("div");
    modal.className = "modal bot-modal";
    modal.id = "bot-modal";
    modal.innerHTML =
      '<div class="modal-card bot-card" role="dialog" aria-label="Помощник по подбору">' +
      '<button class="modal-close" type="button" data-close-bot aria-label="Закрыть">×</button>' +
      '<div class="eyebrow">Помощник Дельтастроя</div><h3>Подберём оборудование в чате</h3>' +
      '<div id="bot-thread" class="bot-thread"></div><div id="bot-actions" class="bot-actions"></div><div id="bot-result" class="bot-result"></div></div>';
    document.body.appendChild(modal);
    thread = modal.querySelector("#bot-thread");
    actions = modal.querySelector("#bot-actions");
    result = modal.querySelector("#bot-result");
    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.hasAttribute("data-close-bot")) close();
    });
  }
  function close() {
    modal.classList.remove("open");
  }
  function goal(n, p) {
    if (window.deltaGoal) window.deltaGoal(n, p);
  }

  function bubble(text, role) {
    var d = document.createElement("div");
    d.className = "bot-bubble " + (role || "bot");
    d.textContent = text;
    thread.appendChild(d);
    thread.scrollTop = thread.scrollHeight;
    return d;
  }
  function say(text, cb) {
    actions.innerHTML = "";
    var t = bubble("• • •", "bot typing");
    setTimeout(function () {
      t.classList.remove("typing");
      t.textContent = text;
      thread.scrollTop = thread.scrollHeight;
      if (cb) cb();
    }, 320 + Math.random() * 380);
  }

  function totalSteps() {
    var n = 1 + (FLOWS[state.flow] ? FLOWS[state.flow].length : 0);
    if (state.flow === "business" && BUSINESS_SECOND[state.answers.type]) n += 1;
    if (state.flow === "kesson") n = 1;
    return n;
  }

  function askStart() {
    state = { flow: null, answers: {}, stack: [], stepNo: 1 };
    thread.innerHTML = "";
    result.innerHTML = "";
    say(rnd(GREET), function () {
      ask(START);
    });
  }

  function ask(step, silent) {
    state.current = step;
    var q = rnd(step.q);
    var showQ = function () {
      actions.innerHTML = "";
      var tot = state.flow ? totalSteps() : 4;
      var head = document.createElement("div");
      head.className = "bot-question";
      head.textContent = q;
      actions.appendChild(head);
      var prog = document.createElement("div");
      prog.className = "bot-progress";
      prog.innerHTML = '<span style="width:' + Math.min(100, Math.round((state.stepNo / tot) * 100)) + '%"></span>';
      actions.appendChild(prog);
      step.opts.forEach(function (o) {
        var b = document.createElement("button");
        b.className = "bot-action";
        b.type = "button";
        b.textContent = o[0];
        b.addEventListener("click", function () {
          choose(step, o);
        });
        actions.appendChild(b);
      });
      if (state.stack.length) {
        var back = document.createElement("button");
        back.className = "bot-action bot-back";
        back.type = "button";
        back.textContent = "← Назад";
        back.addEventListener("click", goBack);
        actions.appendChild(back);
      }
    };
    if (silent) {
      showQ();
    } else if (state.stepNo === 1 && !thread.querySelector(".bot-bubble.user")) {
      bubble(q);
      showQ();
    } else {
      say(q, showQ);
    }
  }

  function choose(step, o) {
    state.stack.push({ step: step, flow: state.flow, answers: JSON.parse(JSON.stringify(state.answers)), stepNo: state.stepNo, thread: thread.innerHTML });
    bubble(o[0], "user");
    if (step === START) {
      state.flow = o[1];
      goal("bot_start", { flow: o[1] });
    } else {
      state.answers[step.key] = o[1];
    }
    state.stepNo += 1;
    next(step, o[1]);
  }

  function goBack() {
    var s = state.stack.pop();
    if (!s) return;
    state.flow = s.flow;
    state.answers = s.answers;
    state.stepNo = s.stepNo;
    thread.innerHTML = s.thread;
    result.innerHTML = "";
    ask(s.step, true);
  }

  function nextStepFor() {
    if (state.flow === "kesson") return null;
    var list = FLOWS[state.flow] || [];
    for (var i = 0; i < list.length; i++) {
      if (state.answers[list[i].key] === undefined) return list[i];
    }
    if (state.flow === "business") {
      var sec = BUSINESS_SECOND[state.answers.type];
      if (sec && state.answers.size === undefined) return sec;
    }
    return null;
  }

  function next(prevStep, val) {
    var reaction = prevStep.react ? prevStep.react(val) : null;
    var nx = nextStepFor();
    var go = function () {
      if (nx) ask(nx);
      else showResult();
    };
    if (reaction) {
      say(reaction, go);
    } else go();
  }

  var LABELS = {
    home: "Канализация для дома", water: "Ёмкость", kesson: "Кессон", business: "Решение для бизнеса",
    const: "постоянно", season: "сезонно", period: "периодически",
    ground: "отвод в грунт возможен", limited: "грунт плохо принимает воду", unknown: "грунт неизвестен",
    comfort: "важен комфорт", energy: "без электричества", price: "минимальная цена",
    drink: "питьевая вода", tech: "техническая вода", kas: "КАС", fire: "пожарный запас", diesel: "дизельное топливо",
  };
  function summaryText() {
    var a = state.answers, parts = [LABELS[state.flow]];
    if (state.flow === "home") parts.push(a.users + " чел.", LABELS[a.mode], LABELS[a.outlet], LABELS[a.priority]);
    if (state.flow === "water") parts.push(LABELS[a.purpose], "от " + nf(a.volume) + " л");
    if (state.flow === "business") parts.push(a.type + (a.size ? " / " + a.size : ""));
    return parts.filter(Boolean).join(", ");
  }

  function showResult() {
    goal("bot_result", { flow: state.flow });
    var rec = recommend(state.flow, state.answers);
    var intro = rec.picks.length
      ? rnd(["Готово! Вот что подходит под ваши ответы.", "Подобрал варианты — смотрите ниже.", "Есть что предложить. Сравните варианты:"])
      : "По этим параметрам в каталоге ничего не нашлось — давайте уточним у менеджера.";
    actions.innerHTML = "";
    say(intro, function () {
      var html = '<div class="bot-result-box"><div class="bot-summary">Ваш запрос: ' + esc(summaryText()) + "</div>";
      rec.picks.forEach(function (x) {
        var p = x.p;
        var url = ROOT + "product/" + (p.slug || p.id) + ".html";
        html +=
          '<div class="bot-pick"><div class="bot-pick-tag">' + esc(x.tag) + "</div>" +
          '<a class="bot-pick-name" href="' + url + '">' + esc(p.name) + "</a>" +
          '<div class="bot-pick-price">' + money(p.price) + "</div>" +
          '<ul class="bot-pick-why">' + x.why.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></div>";
      });
      if (rec.links && rec.links.length) {
        html += '<div class="bot-links">' + rec.links.map(function (l) { return '<a class="category-link" href="' + ROOT + "category/" + l[1] + '.html">' + esc(l[0]) + "</a>"; }).join("") + "</div>";
      }
      html += '<div class="bot-note">' + rec.notes.map(esc).join("<br>") + "</div>";
      html += '<div class="bot-cta"><button class="btn btn-primary" type="button" data-bot-calc>Запросить расчёт</button>' +
        '<button class="btn btn-outline" type="button" data-bot-restart>Начать заново</button></div></div>';
      result.innerHTML = html;
      result.querySelector("[data-bot-restart]").addEventListener("click", askStart);
      result.querySelector("[data-bot-calc]").addEventListener("click", function () {
        var names = rec.picks.map(function (x) { return x.p.name; }).join("; ");
        var msg = "Подбор в чат-боте. Запрос: " + summaryText() + (names ? ". Рассматриваю: " + names : "") + ".";
        close();
        var cm = document.getElementById("contact-modal");
        if (cm) {
          cm.classList.add("open");
          var ta = cm.querySelector("textarea");
          if (ta) ta.value = msg;
        }
      });
      thread.scrollTop = thread.scrollHeight;
      modal.querySelector(".bot-card").scrollTop = modal.querySelector(".bot-card").scrollHeight;
    });
  }

  function open() {
    ensureData(function () {
      if (!modal || !document.body.contains(modal)) build();
      modal.classList.add("open");
      askStart();
    });
  }

  window.DeltaBot = { open: open, recommend: recommend, _families: FAMILIES };
})();

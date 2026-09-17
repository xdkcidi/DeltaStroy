const products = window.DELTA_PRODUCTS || [];
const money = n => new Intl.NumberFormat('ru-RU').format(Number(n)) + ' ₽';
const categoryInfo = {
  stations:{title:'Станции глубокой очистки',desc:'Для постоянного и сезонного проживания.'},
  septic:{title:'Септики',desc:'Энергонезависимые решения и крупные модели.'},
  kesson:{title:'Кессоны',desc:'Защита скважины и размещение оборудования.'},
  storage:{title:'Накопительные ёмкости',desc:'Подземное накопление стоков и жидкостей.'},
  water:{title:'Ёмкости для воды',desc:'Питьевая и техническая вода.'},
  fuel:{title:'Ёмкости для топлива',desc:'Подземное хранение дизельного топлива.'},
  modular:{title:'Модульные ёмкости',desc:'Большие сегментные подземные резервуары.'},
  fire:{title:'Пожарные резервуары',desc:'Подземный запас воды для пожаротушения.'},
  grease:{title:'Жироуловители',desc:'Под мойку и промышленные модели.'},
  oil:{title:'Нефтеуловители',desc:'Решения для очистки стоков от нефтепродуктов.'},
  kns:{title:'КНС',desc:'Канализационные насосные станции.'},
  sorption:{title:'Сорбционные фильтры',desc:'Системы фильтрации для объектов и производств.'},
  rain:{title:'Ливневые очистные',desc:'Системы очистки ливневого стока.'},
  storm:{title:'Пескоуловители',desc:'Удаление песка и взвесей из ливневого стока.'},
  wells:{title:'Колодцы',desc:'Дренажные, ревизионные и кабельные решения.'},
  components:{title:'Комплектующие',desc:'Насосы, сигнализация, доборы и сервисные элементы.'}
};
const categoryOrder=['stations','septic','kesson','storage','water','fuel','modular','fire','grease','oil','kns','sorption','rain','storm','wells','components'];

function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function imgFor(item){return item.image || null;}
function categoryLabel(item){return item.meta?.liters ? `${new Intl.NumberFormat('ru-RU').format(item.meta.liters)} л` : item.meta?.users ? `${item.meta.users} польз.` : (item.category==='stations'?'Станция':'Каталог');}
function productCard(item, compact=false){
  const image=imgFor(item);
  const chips=(item.features||[]).slice(0, compact?2:3).map(x=>`<span class="feature-chip">${escapeHtml(x)}</span>`).join('');
  return `<article class="product-card">
    <div class="product-visual ${image?'':'placeholder'}"><span class="card-tag">${escapeHtml(categoryLabel(item))}</span>${image?`<img src="${image}" alt="${escapeHtml(item.name)}">`:''}</div>
    <div class="product-body">
      <div class="collection">${escapeHtml(item.collection||'')}</div>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.subtitle||'Инженерное оборудование')}</p>
      <div class="feature-list">${chips}</div>
      <div class="price-row"><div class="price">${money(item.price)}</div></div>
      <button class="btn btn-primary card-btn" type="button" data-product="${escapeHtml(item.id)}">Подробнее</button>
    </div>
  </article>`;
}
function renderFeatured(){
  const box=document.getElementById('featured-products'); if(!box)return;
  const curatedIds=['ergobox-5','ergobox-3','ergobox-7','pelican-4','termit-profi-3.0','kesson-2-1','storage-3000','grease-03-15'];
  const curated=curatedIds.map(id=>products.find(x=>x.id===id)).filter(Boolean);
  box.innerHTML=curated.map(x=>productCard(x)).join(''); wireProductButtons();
}
function renderErgoboxFeatured(){
  const box=document.getElementById('ergobox-featured'); if(!box)return;
  const picks=['ergobox-3','ergobox-5','ergobox-6','ergobox-8'];
  box.innerHTML=picks.map(id=>products.find(x=>x.id===id)).filter(Boolean).map(x=>productCard(x,true)).join(''); wireProductButtons();
}
function renderPelicanFeatured(){
  const box=document.getElementById('pelican-featured'); if(!box)return;
  const picks=['pelican-3','pelican-3-long','pelican-4','pelican-4-long','pelican-5','pelican-5-long'];
  box.innerHTML=picks.map(id=>products.find(x=>x.id===id)).filter(Boolean).map(x=>productCard(x,true)).join('');
  wireProductButtons();
}

function initMenu(){
  const t=document.querySelector('.menu-toggle'), links=document.querySelector('.nav-links'); if(!t||!links)return;
  t.addEventListener('click',()=>{
    const open=links.dataset.open==='1';
    links.dataset.open=open?'0':'1';
    links.style.display=open?'none':'flex';links.style.flexDirection='column';links.style.position='absolute';links.style.top='72px';links.style.left='12px';links.style.right='12px';links.style.padding='14px';links.style.background='#fff';links.style.border='1px solid var(--line)';links.style.borderRadius='16px';
  });
}
function openModal(item){
  const modal=document.getElementById('product-modal'); if(!modal)return;
  modal.querySelector('[data-modal-title]').textContent=item.name;
  modal.querySelector('[data-modal-brand]').textContent=item.collection || 'Каталог';
  modal.querySelector('[data-modal-sub]').textContent=item.subtitle || 'Инженерное решение';
  modal.querySelector('[data-modal-price]').textContent=money(item.price);
  const main=modal.querySelector('[data-modal-image]');
  main.src=item.image || 'assets/ergobox/4.jpg';
  main.alt=item.name;
  const thumbs=modal.querySelector('[data-modal-thumbs]');
  const gallery=(item.gallery||[]).slice(0,5);
  thumbs.innerHTML=gallery.map(src=>`<img src="${src}" alt="${escapeHtml(item.name)}">`).join('');
  thumbs.querySelectorAll('img').forEach(im=>im.addEventListener('click',()=>main.src=im.src));
  const specs=modal.querySelector('[data-modal-specs]');
  const specItems=[];
  if(item.meta?.users) specItems.push(['Пользователи',item.meta.users]);
  if(item.meta?.liters) specItems.push(['Объём',`${new Intl.NumberFormat('ru-RU').format(item.meta.liters)} л`]);
  if(item.meta?.model) specItems.push(['Модель',item.meta.model]);
  if(item.details?.warranty) specItems.push(['Гарантия',item.details.warranty]);
  if(item.details?.users_note) specItems.push(['Применение',item.details.users_note]);
  specs.innerHTML=specItems.map(([k,v])=>`<div class="spec-item"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join('');
  modal.querySelector('[data-modal-features]').innerHTML=(item.features||[]).map(f=>`<li>${escapeHtml(f)}</li>`).join('');
  const opts=modal.querySelector('[data-modal-options]');
  if(opts){opts.innerHTML=(item.options||[]).map(o=>`<div class="modal-option"><span>${escapeHtml(o.title)}</span><strong>${money(o.price)}</strong></div>`).join('');}
  const docs=modal.querySelector('[data-modal-docs]');
  if(docs){docs.innerHTML=(item.documents||[]).map(d=>`<a class="doc-link" href="${d.url}" target="_blank">${escapeHtml(d.title)} · ${escapeHtml(d.type||'Документ')}</a>`).join(''); docs.style.display=(item.documents||[]).length?'flex':'none';}
  if(item.details?.min_pit_depth_mm){
    const extra=[['Минимальная глубина котлована',`${item.details.min_pit_depth_mm} мм`],['Минимальный размер котлована',item.details.pit_size_mm+' мм'],['Входящий трубопровод',`Ø ${item.details.inlet_mm} мм`],['Песчаная подушка',`не менее ${item.details.sand_cushion_mm} мм`],['Утепление',item.details.insulation_mm+' мм']];
    specs.insertAdjacentHTML('beforeend',extra.map(([k,v])=>`<div class="spec-item"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`).join(''));
  }
  modal.classList.add('open');
}
function wireProductButtons(){document.querySelectorAll('[data-product]').forEach(btn=>{btn.onclick=()=>{const item=products.find(x=>x.id===btn.dataset.product);if(item)openModal(item);};});}
function closeModals(){document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));}
function initModals(){
  document.querySelectorAll('[data-close-modal],[data-close-contact],[data-close-bot]').forEach(b=>b.addEventListener('click',closeModals));
  document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));
  document.querySelectorAll('[data-open-contact]').forEach(b=>b.addEventListener('click',()=>{closeModals();document.getElementById('contact-modal')?.classList.add('open');}));
  document.querySelectorAll('[data-open-ergobox]').forEach(b=>b.addEventListener('click',()=>{location.href='catalog.html?search=Ergobox';}));
}
function showToast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600);}
function initForms(){
  document.querySelectorAll('[data-contact-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();form.reset();closeModals();showToast('Заявка подготовлена. Подключите обработчик формы, чтобы отправлять её в CRM.');}));
}

const botSteps=[
  {q:'Что нужно решить?',opts:[['Канализация для дома','home'],['Ёмкость для воды','water'],['Кессон','kesson'],['Решение для бизнеса','business']]},
  {q:'Сколько человек будет пользоваться системой?',opts:[['1–3','3'],['4–5','5'],['6–8','8'],['9–15','15'],['15+','20']]},
  {q:'Как объект используется?',opts:[['Постоянно','const'],['Сезонно','season'],['Периодически','period']]},
  {q:'Что важнее?',opts:[['Максимальный комфорт','comfort'],['Независимость от электричества','energy'],['Минимальная стартовая стоимость','price'],['Нужен большой объём','volume']]}
];
let botState={step:0,answers:[]};
function botBubble(text,role='bot'){const t=document.getElementById('bot-thread');t.insertAdjacentHTML('beforeend',`<div class="bot-bubble ${role}">${escapeHtml(text)}</div>`);t.scrollTop=t.scrollHeight;}
function openBot(){document.getElementById('bot-modal')?.classList.add('open');botState={step:0,answers:[]};document.getElementById('bot-thread').innerHTML='';document.getElementById('bot-result').innerHTML='';renderBotStep();}
function renderBotStep(){
  const step=botSteps[botState.step];const actions=document.getElementById('bot-actions');if(!actions)return;
  if(botState.step===0)botBubble('Здравствуйте! Помогу сузить выбор. Начнём с задачи.'); else botBubble(step.q);
  actions.innerHTML=`<div class="bot-question">${escapeHtml(step.q)}</div>`+step.opts.map(([label,val])=>`<button class="bot-action" data-bot-value="${val}">${escapeHtml(label)}</button>`).join('');
  actions.querySelectorAll('[data-bot-value]').forEach(btn=>btn.addEventListener('click',()=>chooseBot(btn.dataset.botValue,btn.textContent)));
}
function chooseBot(value,label){botBubble(label,'user');botState.answers[botState.step]=value;if(botState.step<botSteps.length-1){botState.step++;setTimeout(renderBotStep,250);return;}setTimeout(renderBotResult,300);}
function renderBotResult(){
  const [task,users,mode,priority]=botState.answers;let picks=[];
  if(task==='home'){
    if(mode==='season'||priority==='energy') picks=products.filter(p=>p.collection==='Термит Профи').sort((a,b)=>parseFloat(a.meta?.size||999)-parseFloat(b.meta?.size||999)).slice(0,3);
    else picks=products.filter(p=>p.collection==='Ergobox'&&p.meta?.users).slice(0,3);
  } else if(task==='water') picks=products.filter(p=>p.category==='water').slice(0,3);
  else if(task==='kesson') picks=products.filter(p=>p.category==='kesson').slice(0,3);
  else picks=products.filter(p=>['grease','oil','kns','sorption','rain','storm','modular'].includes(p.category)).slice(0,3);
  if(users && ['3','5','8'].includes(users) && task==='home'){const n=Number(users);picks=picks.filter(p=>!p.meta?.users || Number(p.meta.users)<=n).slice(-2).concat(picks.filter(p=>p.meta?.users && Number(p.meta.users)===n).slice(0,1));picks=[...new Map(picks.map(p=>[p.id,p])).values()].slice(0,3);}
  if(!picks.length)picks=products.slice(0,3);
  const result=document.getElementById('bot-result');
  result.innerHTML=`<div class="bot-result-box"><strong>Предварительно подходят:</strong>${picks.map(p=>`<div style="margin-top:8px"><b>${escapeHtml(p.name)}</b> — ${money(p.price)}</div>`).join('')}<div style="margin-top:12px;color:#65758a;font-size:11px">Это предварительный подбор. Точный вариант зависит от условий участка и задачи объекта.</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:13px"><a class="btn btn-primary" href="catalog.html?search=${encodeURIComponent(picks[0]?.collection||'')}">Открыть каталог</a><button class="btn btn-outline" data-open-contact-from-bot>Запросить расчёт</button></div></div>`;
  document.querySelector('[data-open-contact-from-bot]')?.addEventListener('click',()=>{closeModals();document.getElementById('contact-modal')?.classList.add('open');});
  document.getElementById('bot-actions').innerHTML='';
}

function initBot(){document.querySelectorAll('[data-open-bot]').forEach(b=>b.addEventListener('click',openBot));}

function initCatalog(){
  const root=document.getElementById('catalog-root');if(!root)return;
  const params=new URLSearchParams(location.search);
  const search=document.getElementById('catalog-search'),category=document.getElementById('catalog-category'),audience=document.getElementById('catalog-audience'),sort=document.getElementById('catalog-sort'),min=document.getElementById('price-min'),max=document.getElementById('price-max');
  if(search)search.value=params.get('search')||'';if(category)category.value=params.get('category')||'all';
  const render=()=>{
    let list=[...products];const q=(search?.value||'').trim().toLowerCase();const cat=category?.value||'all';const aud=audience?.value||'all';const lo=Number(min?.value||0);const hi=Number(max?.value||Infinity);
    if(q)list=list.filter(p=>[p.name,p.collection,p.subtitle,p.audience,(p.tags||[]).join(' '),(p.features||[]).join(' ')].join(' ').toLowerCase().includes(q));
    if(cat!=='all')list=list.filter(p=>p.category===cat);if(aud!=='all')list=list.filter(p=>String(p.audience||'').toLowerCase().includes(aud==='home'?'дом':'бизнес'));list=list.filter(p=>Number(p.price)>=lo&&Number(p.price)<=hi);
    if(sort?.value==='priceAsc')list.sort((a,b)=>a.price-b.price);else if(sort?.value==='priceDesc')list.sort((a,b)=>b.price-a.price);else if(sort?.value==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'ru'));else list.sort((a,b)=>Number(b.popular)-Number(a.popular));
    document.getElementById('catalog-count').textContent=`Найдено: ${list.length} товаров`;
    const active=document.getElementById('active-filters');const chips=[];if(cat!=='all')chips.push(cat);if(aud!=='all')chips.push(aud==='home'?'для дома':'для бизнеса');if(q)chips.push(`поиск: ${q}`);active.innerHTML=chips.map(x=>`<span class="filter-chip-active">${escapeHtml(x)}</span>`).join('');
    const wrap=document.getElementById('catalog-grid-wrap');if(!list.length){wrap.innerHTML='<div class="empty">По выбранным условиям товаров не найдено.<br>Попробуйте убрать часть фильтров или запустить подбор в чат-боте.</div>';return;}
    const groups=[];const grouped=new Map();for(const p of list){const key=p.collection||categoryInfo[p.category]?.title||p.category;if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(p);}for(const [key,items] of grouped){groups.push(`<section class="collection-block"><div class="collection-head"><div><h2>${escapeHtml(key)}</h2><p>${items.length} поз.</p></div></div><div class="catalog-grid">${items.map(x=>productCard(x)).join('')}</div></section>`);}wrap.innerHTML=groups.join('');wireProductButtons();
  };
  [search,category,audience,sort,min,max].forEach(el=>el?.addEventListener('input',render));[category,audience,sort].forEach(el=>el?.addEventListener('change',render));
  document.querySelectorAll('[data-audience]').forEach(el=>el.addEventListener('change',()=>{if(el.checked){audience.value=el.value;}else if(![...document.querySelectorAll('[data-audience]')].some(x=>x.checked))audience.value='all';render();}));
  document.querySelectorAll('.quick-cats button').forEach(btn=>btn.addEventListener('click',()=>{category.value=btn.dataset.cat;render();window.scrollTo({top:document.querySelector('.catalog-section').offsetTop-80,behavior:'smooth'});}));
  document.getElementById('clear-filters')?.addEventListener('click',()=>{search.value='';category.value='all';audience.value='all';sort.value='popular';min.value='';max.value='';document.querySelectorAll('[data-audience]').forEach(x=>x.checked=false);render();});
  document.getElementById('mobile-filter')?.addEventListener('click',()=>document.getElementById('filters')?.classList.toggle('open'));
  render();
}

function boot(){renderFeatured();renderErgoboxFeatured();renderPelicanFeatured();initMenu();initModals();initForms();initBot();initCatalog();wireProductButtons();}
document.addEventListener('DOMContentLoaded',boot);

/* This UI sends only course completion, latest scores and star ratings. */
(()=>{
'use strict';
const nav=document.querySelector('nav');
const link=document.createElement('a');link.href='#analytics';link.innerHTML='◷ <span>Python аналитика</span>';nav.insertBefore(link,nav.lastElementChild);
let controller;
function payload(format){
const learning=read('yc-learning',{}),ratings=read('yc-reviews',[]);
return {courses:courses.map(c=>({id:c.id,done:Array.isArray(learning[c.id]?.done)?learning[c.id].done:[],score:learning[c.id]?.score??null})),ratings:Array.isArray(ratings)?ratings.map(r=>({course_id:r.teacher,rating:r.rating})):[],...(format?{format}: {})};
}
async function request(format){
const res=await fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload(format)),signal:controller.signal});
if(!res.ok)throw new Error(res.status===404?'Python API табылмады. Vercel-де api папкасы жарияланғанын тексер.':'Python есебі орындалмады ('+res.status+').');
if(format==='csv')return res.blob();
const data=await res.json();if(data.engine!=='Python'||!data.summary||!Array.isArray(data.courses))throw new Error('Серверден күтілген Python жауабы келмеді.');return data;
}
const number=v=>v===null?'—':String(v);
function errorText(error){return error.name==='AbortError'?'Сұрау тоқтатылды.':(error.message||'Серверге қосылу мүмкін болмады.');}
async function showAnalytics(){
if(location.hash!=='#analytics'){controller?.abort();return;}
controller?.abort();controller=new AbortController();
document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.hash==='#analytics'));
app.innerHTML=head('Python аналитика','Оқу барысы мен тест нәтижелерін серверде есептеу.')+`<div class="notice"><b>Осы браузердің демо деректері.</b> Бұл университеттің жалпы статистикасы емес. Python-ға сабақ нөмірлері, тест ұпайлары және жұлдыздар ғана жіберіледі. Есім, email, пікір мәтіні жіберілмейді. Сервер деректерді сақтамайды.</div><div class="panel" id="analytics-result" aria-live="polite">Python есептеп жатыр…</div>`;
try{
const data=await request();if(location.hash!=='#analytics')return;
const s=data.summary;
document.querySelector('#analytics-result').outerHTML=`<div id="analytics-result"><div class="row"><span class="score">✓ Сервер: Python</span><button class="btn outline" id="refresh-analytics">Қайта есептеу ↻</button></div><div class="stats"><div class="stat"><small>Аяқталған сабақтар</small><strong>${s.lessons_done}<small> / ${s.lessons_total}</small></strong><span>${s.completion_percent}% орындалды</span></div><div class="stat"><small>Толық аяқталған курстар</small><strong>${s.courses_completed}<small> / 6</small></strong><span>3 сабағы да аяқталған</span></div><div class="stat"><small>Тесттің орташа ұпайы</small><strong>${number(s.average_test_score)}</strong><span>${s.tests_attempted} тапсырылған тест · 100 ұпайдан</span></div><div class="stat"><small>Орташа пікір рейтингі</small><strong>${number(s.average_rating)}<small> / 5</small></strong><span>${s.reviews_count} пікір бойынша</span></div></div><div class="bottom-grid"><section class="panel"><h3>Курстардың оқу барысы</h3>${data.courses.map(c=>`<div style="margin:20px 0"><div class="row"><span>${esc(c.title)}</span><b>${c.progress}%</b></div><div class="progress" style="height:10px" role="progressbar" aria-label="${esc(c.title)}" aria-valuenow="${c.progress}" aria-valuemin="0" aria-valuemax="100"><b style="width:${c.progress}%"></b></div><span class="tiny">${c.lessons_done} / 3 сабақ аяқталған</span></div>`).join('')}</section><section class="panel"><h3>Python не есептеді?</h3><p><b>Сабақтардың орындалуы:</b><br>${s.lessons_done} ÷ 18 × 100 = ${s.completion_percent}%</p><p><b>Тесттің орташа ұпайы:</b><br>Тапсырылған тесттердің соңғы ұпайларының қосындысы ÷ тест саны.</p><p><b>Пікір рейтингі:</b><br>Барлық жұлдыздардың қосындысы ÷ пікір саны. Әр пікір бірдей салмақпен есептеледі.</p><p class="tiny">Дерек жоқ болса «—» көрсетіледі. Үлгі пән бағалары есепке қосылмайды. Бұл тек осы браузердегі деректердің есебі.</p><button class="btn" id="download-analytics">CSV есебін жүктеу ↓</button><p class="tiny">CSV файлын Excel арқылы ашуға болады.</p><div id="export-status" role="status"></div></section></div><div class="section-head"><h2>Пәндер бойынша есеп</h2><span class="tiny">${esc(new Date(data.generated_at).toLocaleString('kk-KZ'))}</span></div><section class="panel" style="overflow:auto"><table><thead><tr><th>Пән</th><th>Сабақ</th><th>Тест / 100</th><th>Пікір саны</th><th>Рейтинг / 5</th></tr></thead><tbody>${data.courses.map(c=>`<tr><td>${esc(c.title)}</td><td>${c.lessons_done} / 3</td><td>${number(c.test_score)}</td><td>${c.reviews_count}</td><td>${number(c.rating)}</td></tr>`).join('')}</tbody></table></section></div>`;
document.querySelector('#refresh-analytics').onclick=showAnalytics;
document.querySelector('#download-analytics').onclick=async e=>{const btn=e.currentTarget;btn.disabled=true;try{const blob=await request('csv');const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='yessenov-analytics.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){const el=document.querySelector('#export-status');if(el)el.textContent=errorText(error);}finally{btn.disabled=false;}};
}catch(error){if(error.name==='AbortError'||location.hash!=='#analytics')return;document.querySelector('#analytics-result').innerHTML=`<h3>Python серверіне қосылмады</h3><p>${esc(errorText(error))}</p><p class="tiny">Файлды компьютерден ашу жеткіліксіз: api/analytics.py Vercel-де жариялануы керек. Сайттың басқа бөлімдері жұмыс істей береді.</p><button class="btn" id="retry-analytics">Қайта көру</button>`;document.querySelector('#retry-analytics').onclick=showAnalytics;}
}
window.addEventListener('hashchange',showAnalytics);showAnalytics();
})();

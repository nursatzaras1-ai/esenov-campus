/* Supabase Auth + WebAuthn. Only the public publishable key belongs here. */
(()=>{
'use strict';
const PROJECT_URL='https://pnlljrnqtcdglftdfhed.supabase.co';
const PUBLIC_KEY='sb_publishable_h8F-5NlnjhujacXqMoG_gQ_BL-_I33z';
const SITE_ORIGIN='https://esenov-campus.vercel.app';
const profile=document.querySelector('#profile');
const authModal=document.createElement('dialog');
authModal.id='account-dialog';authModal.setAttribute('aria-label','Студент аккаунты');document.body.append(authModal);
let client=null,user=null,ready=false,busy=false,mode='login';
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function status(text,error=false){const el=authModal.querySelector('#account-status');if(el){el.textContent=text;el.style.color=error?'#9b3932':'#315d42';el.hidden=false;}}
function updateHeader(){profile.innerHTML=user?'<em>✓</em><span>Менің аккаунтым</span>':'<em>↗</em><span>Кіру / Тіркелу</span>';}
function passkeySupported(){return window.isSecureContext&&!!window.PublicKeyCredential&&!!navigator.credentials;}
function message(error){const code=error?.code||'',raw=error?.message||'';
if(code==='email_not_confirmed'||/Email not confirmed/i.test(raw))return 'Email расталмаған. Поштаңа келген растау сілтемесін аш.';
if(code==='invalid_credentials'||/Invalid login credentials/i.test(raw))return 'Email немесе құпиясөз дұрыс емес.';
if(code==='passkey_disabled')return 'Supabase баптауында Passkey қосылмаған.';
if(code==='webauthn_credential_exists')return 'Бұл Passkey аккаунтыңа бұрын қосылған.';
if(/NotAllowed|cancel|aborted/i.test(code+' '+raw))return 'Растау тоқтатылды немесе уақыт аяқталды. Қайта байқап көр.';
if(/origin|rp.?id|relying party/i.test(raw))return 'Домен сәйкес емес. esenov-campus.vercel.app сайтында ашып, Supabase Passkeys баптауын тексер.';
if(/rate.limit|too.many|rate_limit/i.test(code+' '+raw))return 'Сұрау тым көп. Біраз уақыттан кейін қайтала.';
return 'Әрекет орындалмады: '+(raw||'Интернет байланысын тексер.');}
async function run(task){if(busy)return;busy=true;authModal.querySelectorAll('button,input').forEach(x=>x.disabled=true);status('Күте тұр…');try{await task();}catch(e){status(message(e),true);}finally{busy=false;authModal.querySelectorAll('button,input').forEach(x=>x.disabled=false);}}
function show(note=''){
if(authModal.open&&busy)return;
authModal.innerHTML=`<button class="close" id="account-close" aria-label="Жабу">×</button><div class="eyebrow">YESSENOV CAMPUS / АККАУНТ</div><h2 style="margin-top:20px">${user?'Менің аккаунтым':mode==='signup'?'Студентті тіркеу':'Аккаунтқа кіру'}</h2><p id="account-status" role="status" aria-live="polite" class="notice" ${note?'':'hidden'}>${safe(note)}</p>`;
authModal.querySelector('#account-close').onclick=()=>authModal.close();
if(!ready){authModal.insertAdjacentHTML('beforeend','<p>Аккаунт жүйесі жүктеліп жатыр…</p>');}
else if(!client){authModal.insertAdjacentHTML('beforeend','<p>Аккаунт жүйесі жүктелмеді. Бетті жаңартып көр.</p>');}
else if(user){
authModal.insertAdjacentHTML('beforeend',`<p><b>Email:</b> ${safe(user.email||'')}</p><div class="notice">Курстар, үлгі бағалар мен пікірлер әлі де осы браузердегі демо деректер. Олар Supabase аккаунтына көшірілмейді және жеке студент деректері ретінде қорғалмайды.</div><h3>Face ID / Passkey</h3><p>Passkey қосу үшін құрылғыдағы растауды орында. iPhone-да Face ID, басқа құрылғыда PIN, саусақ ізі немесе қауіпсіздік кілті ұсынылуы мүмкін.</p><button class="btn" id="register-passkey">Face ID / Passkey қосу</button><div id="passkey-help" class="tiny" style="margin-top:12px"></div><hr style="border:0;border-top:1px solid #e4e9e5;margin:24px 0"><button class="btn outline" id="signout">Аккаунттан шығу</button>`);
const help=authModal.querySelector('#passkey-help');
if(location.origin!==SITE_ORIGIN)help.textContent='Passkey үшін негізгі сайтты аш: '+SITE_ORIGIN;
else if(!passkeySupported())help.textContent='Бұл браузерде Passkey қолдауы жоқ. Қолдайтын құрылғыда аш.';
else help.textContent='Құпия кілт сайтқа жіберілмейді. Қолдау: Supabase Passkeys Beta.';
authModal.querySelector('#register-passkey').onclick=()=>run(async()=>{if(location.origin!==SITE_ORIGIN)throw new Error('Passkey қосу үшін '+SITE_ORIGIN+' мекенжайын аш.');if(!passkeySupported())throw new Error('Бұл браузерде Passkey қолдауы жоқ.');if(typeof client.auth.registerPasskey!=='function')throw new Error('Кітапхана Passkey қолдамайды.');const {error}=await client.auth.registerPasskey();if(error)throw error;status('Passkey қосылды! Енді шығып, Passkey арқылы қайта кіріп тексеруге болады.');});
authModal.querySelector('#signout').onclick=()=>run(async()=>{const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;user=null;updateHeader();busy=false;show('Аккаунттан шықтың.');});
}else{
authModal.insertAdjacentHTML('beforeend',`<form id="account-form"><label for="account-email">Email</label><input id="account-email" type="email" required autocomplete="username webauthn" style="width:100%" placeholder="student@example.com"><label for="account-password">Құпиясөз</label><input id="account-password" type="password" required minlength="8" autocomplete="${mode==='signup'?'new-password':'current-password'}" style="width:100%" placeholder="Кемінде 8 таңба"><button class="btn" type="submit" style="margin-top:20px;width:100%">${mode==='signup'?'Тіркелу':'Кіру'}</button></form><button class="btn outline" id="toggle-mode" style="margin-top:12px;width:100%">${mode==='signup'?'Аккаунтым бар → Кіру':'Аккаунтым жоқ → Тіркелу'}</button><button class="btn outline" id="passkey-signin" style="margin-top:12px;width:100%">Face ID / Passkey арқылы кіру</button><p class="tiny">Алғаш рет email арқылы тіркеліп, поштаңды раста. Содан кейін аккаунт ішінде Passkey қос. Тіркелген email мен құпиясөз Supabase Auth қызметіне жіберіледі.</p>`);
authModal.querySelector('#toggle-mode').onclick=()=>{mode=mode==='signup'?'login':'signup';show();};
authModal.querySelector('#account-form').onsubmit=e=>{e.preventDefault();const email=authModal.querySelector('#account-email').value.trim(),password=authModal.querySelector('#account-password').value;run(async()=>{if(mode==='signup'){const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:SITE_ORIGIN+'/'} });if(error)throw error;if(data.session){user=data.user;updateHeader();busy=false;show('Тіркелдің! Енді Passkey қосуға болады.');}else status('Поштаңа растау хаты жіберілді. Хаттағы сілтемені ашып, кейін осы жерден кір.');}else{const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;user=data.user;updateHeader();busy=false;show('Аккаунтқа кірдің.');}});};
authModal.querySelector('#passkey-signin').onclick=()=>run(async()=>{if(location.origin!==SITE_ORIGIN)throw new Error('Passkey арқылы кіру үшін '+SITE_ORIGIN+' мекенжайын аш.');if(!passkeySupported())throw new Error('Бұл браузерде Passkey қолдауы жоқ.');const {data,error}=await client.auth.signInWithPasskey();if(error)throw error;user=data.user;updateHeader();busy=false;show('Passkey арқылы кірдің!');});
}
if(!authModal.open)authModal.showModal();
}
profile.onclick=()=>show();updateHeader();
(async()=>{try{if(!window.supabase?.createClient)throw new Error('Supabase кітапханасы табылмады.');client=window.supabase.createClient(PROJECT_URL,PUBLIC_KEY,{auth:{experimental:{passkey:true}}});client.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;updateHeader();});const {data,error}=await client.auth.getSession();if(error)throw error;user=data.session?.user||null;ready=true;updateHeader();if(authModal.open)show();}catch(e){ready=true;client=null;if(authModal.open)show(message(e));}})();
})();

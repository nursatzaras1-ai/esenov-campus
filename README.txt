YESSENOV CAMPUS — EMAIL + PASSKEY

ЖАҢАРТУ
1. ZIP архивін шығарып ал.
2. GitHub-та сайт жобасын аш: Add file > Upload files.
3. Осы папканың ІШІНДЕГІ барлық файл мен vendor папкасын жүкте.
   index.html repository түбірінде қалсын; сыртқы Yessenov-Campus-Passkey
   папкасын немесе ZIP архивті жүктеме.
4. Commit changes бас. Егер жоба GitHub-пен байланыстырылса,
   Vercel жаңа нұсқаны өзі жариялайды. Ready болғанын күт.
5. https://esenov-campus.vercel.app мекенжайын жаңарт.

ҚОСЫЛҒАН ФАЙЛДАР
- auth.js: Supabase аккаунттары мен Passkey UI.
- vendor/supabase-2.105.0.js: бекітілген Supabase JS кітапханасы.
- index.html: auth.js және кітапхананы жүктейді.
- app.js: Жоба туралы мәтіні жаңартылған.
- style.css: бұрынғы дизайн.

ТЕКСЕРУ
1. Жоғарғы «Кіру / Тіркелу» батырмасын бас.
2. «Аккаунтым жоқ > Тіркелу» арқылы email мен кемінде 8 таңбалы
   құпиясөзді енгіз. Бұл деректер Supabase Auth-қа жіберіледі.
3. Поштадағы растау сілтемесін аш; spam папкасын да тексер.
4. Email және құпиясөз арқылы кір.
5. iPhone-да Safari арқылы негізгі сайтты ашып, аккаунт ішінде
   «Face ID / Passkey қосу» бас және құрылғының нұсқауын орында.
6. Аккаунттан шығып, «Face ID / Passkey арқылы кіру» бас.
   Құрылғы Face ID орнына PIN, Touch ID немесе басқа әдісті ұсынуы мүмкін.

SUPABASE БАПТАУЛАРЫ
Passkeys: Enabled
Relying Party ID: esenov-campus.vercel.app
Origins: https://esenov-campus.vercel.app
Site URL: https://esenov-campus.vercel.app
Redirect URLs: https://esenov-campus.vercel.app/**

МАҢЫЗДЫ ШЕКТЕУЛЕР
Supabase Passkey API Beta/experimental. Тәуелділік: supabase-js 2.105.0.
Passkey тек негізгі доменде тексеріледі; Vercel preview URL-інде істемейді.
Supabase SDK сервермен WebAuthn тексеруін өзі орындайды; Python қажет емес.
Кілт пен Auth settings қосылымы тексерілді; нақты тіркелу және құрылғыдағы
Face ID рәсімі пайдаланушының аккаунты мен құрылғысында тексерілуі тиіс.
Аккаунтқа кіру қосылды, бірақ курс барысы, үлгі бағалар мен пікірлер
браузерлік демо күйінде қалды. Олар жеке аккаунтқа байланыстырылмаған.
Осы нұсқаға нақты студент бағаларын немесе жеке деректерді енгізбе.
Клиентте тек Publishable key бар. Secret/service_role кілтін қоспа.

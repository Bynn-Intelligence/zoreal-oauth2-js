/**
 * Pairing-modal copy, carried by the SDK.
 *
 * The modal is rendered by this package, so its strings have to ship with it:
 * an integrator cannot translate a component they never write, and asking every
 * one of them to re-supply the same fifteen strings is how a sign-in screen
 * ends up half-English in production.
 *
 * No i18n runtime. A frozen record and one `{time}` substitution is the whole
 * requirement, and a dependency here would be inherited by every host app.
 *
 * Locales match the set ZOREAL's own pairing page serves, so the phone and the
 * browser say the same thing in the same language. `strings()` resolves BCP 47
 * down to that set; anything unknown falls back to English rather than
 * rendering a key.
 */

export interface PairingStrings {
  /** Dialog title while the code is still unscanned. */
  title: string;
  /** Dialog title once the request is waiting in the app. */
  titleApprove: string;
  bodyScan: string;
  bodyApprove: string;
  bodyEnrolling: string;
  waiting: string;
  waitingApproval: string;
  /** Carries `{time}`, substituted with mm:ss. */
  expiresIn: string;
  secured: string;
  noIdTitle: string;
  noIdBody: string;
  cancel: string;
  close: string;
  qrAlt: string;
}

const en: PairingStrings = {
  title: 'Scan to sign in',
  titleApprove: 'Approve on your phone',
  bodyScan: 'Scan with your phone camera or the ZOREAL ID app.',
  bodyApprove: 'Approve the login in your ZOREAL ID app.',
  bodyEnrolling: 'Finish setting up ZOREAL ID on your phone, then approve the login.',
  waiting: 'Waiting for scan',
  waitingApproval: 'Waiting for approval',
  expiresIn: 'Expires in {time}',
  secured: 'Proof-of-Human verification by ZOREAL',
  noIdTitle: 'No ZOREAL ID yet?',
  noIdBody: 'Scan the same code to download the app and create one for free. It only takes a minute.',
  cancel: 'Cancel',
  close: 'Close',
  qrAlt: 'QR code to sign in with ZOREAL',
};

const TRANSLATIONS: Record<string, PairingStrings> = {
  en,
  sv: {
    title: 'Skanna för att logga in',
    titleApprove: 'Godkänn på telefonen',
    bodyScan: 'Skanna med telefonens kamera eller ZOREAL ID-appen.',
    bodyApprove: 'Godkänn inloggningen i ZOREAL ID-appen.',
    bodyEnrolling: 'Slutför konfigurationen av ZOREAL ID på telefonen och godkänn sedan inloggningen.',
    waiting: 'Väntar på skanning',
    waitingApproval: 'Väntar på godkännande',
    expiresIn: 'Upphör om {time}',
    secured: 'Proof-of-Human-verifiering av ZOREAL',
    noIdTitle: 'Har du inget ZOREAL ID?',
    noIdBody: 'Skanna samma kod för att ladda ner appen och skapa ett gratis. Det tar bara en minut.',
    cancel: 'Avbryt',
    close: 'Stäng',
    qrAlt: 'QR-kod för att logga in med ZOREAL',
  },
  es: {
    title: 'Escanea para iniciar sesión',
    titleApprove: 'Apruébalo en tu teléfono',
    bodyScan: 'Escanea con la cámara de tu teléfono o con la app ZOREAL ID.',
    bodyApprove: 'Aprueba el inicio de sesión en tu app ZOREAL ID.',
    bodyEnrolling: 'Termina de configurar ZOREAL ID en tu teléfono y luego aprueba el inicio de sesión.',
    waiting: 'Esperando el escaneo',
    waitingApproval: 'Esperando aprobación',
    expiresIn: 'Caduca en {time}',
    secured: 'Verificación Proof-of-Human de ZOREAL',
    noIdTitle: '¿Aún no tienes ZOREAL ID?',
    noIdBody: 'Escanea el mismo código para descargar la app y crear una gratis. Solo toma un minuto.',
    cancel: 'Cancelar',
    close: 'Cerrar',
    qrAlt: 'Código QR para iniciar sesión con ZOREAL',
  },
  pt: {
    title: 'Digitalize para entrar',
    titleApprove: 'Aprove no seu telefone',
    bodyScan: 'Digitalize com a câmara do seu telefone ou com a app ZOREAL ID.',
    bodyApprove: 'Aprove o login no app ZOREAL ID.',
    bodyEnrolling: 'Termine de configurar o ZOREAL ID no seu telefone e depois aprove o login.',
    waiting: 'Aguardando digitalização',
    waitingApproval: 'Aguardando aprovação',
    expiresIn: 'Expira em {time}',
    secured: 'Verificação Proof-of-Human da ZOREAL',
    noIdTitle: 'Ainda não tem ZOREAL ID?',
    noIdBody: 'Digitalize o mesmo código para baixar o app e criar uma conta grátis. Leva só um minuto.',
    cancel: 'Cancelar',
    close: 'Fechar',
    qrAlt: 'Código QR para entrar com ZOREAL',
  },
  fr: {
    title: 'Scannez pour vous connecter',
    titleApprove: 'Approuvez sur votre téléphone',
    bodyScan: "Scannez avec l'appareil photo de votre téléphone ou l'app ZOREAL ID.",
    bodyApprove: 'Approuvez la connexion dans votre app ZOREAL ID.',
    bodyEnrolling: 'Terminez la configuration de ZOREAL ID sur votre téléphone, puis approuvez la connexion.',
    waiting: 'En attente du scan',
    waitingApproval: "En attente d'approbation",
    expiresIn: 'Expire dans {time}',
    secured: 'Vérification Proof-of-Human par ZOREAL',
    noIdTitle: "Pas encore de ZOREAL ID ?",
    noIdBody: "Scannez le même code pour télécharger l'app et en créer un gratuitement. Cela prend une minute.",
    cancel: 'Annuler',
    close: 'Fermer',
    qrAlt: 'Code QR pour se connecter avec ZOREAL',
  },
  de: {
    title: 'Zum Anmelden scannen',
    titleApprove: 'Auf dem Handy bestätigen',
    bodyScan: 'Mit der Handykamera oder der ZOREAL ID App scannen.',
    bodyApprove: 'Anmeldung in der ZOREAL ID App bestätigen.',
    bodyEnrolling: 'ZOREAL ID auf dem Handy fertig einrichten und dann die Anmeldung bestätigen.',
    waiting: 'Warten auf Scan',
    waitingApproval: 'Warten auf Bestätigung',
    expiresIn: 'Läuft ab in {time}',
    secured: 'Proof-of-Human-Verifizierung von ZOREAL',
    noIdTitle: 'Noch keine ZOREAL ID?',
    noIdBody: 'Denselben Code scannen, um die App zu laden und kostenlos eine zu erstellen. Dauert nur eine Minute.',
    cancel: 'Abbrechen',
    close: 'Schließen',
    qrAlt: 'QR-Code für die Anmeldung mit ZOREAL',
  },
  ru: {
    title: 'Отсканируйте, чтобы войти',
    titleApprove: 'Подтвердите на телефоне',
    bodyScan: 'Отсканируйте камерой телефона или через приложение ZOREAL ID.',
    bodyApprove: 'Подтвердите вход в приложении ZOREAL ID.',
    bodyEnrolling: 'Завершите настройку ZOREAL ID на телефоне, затем подтвердите вход.',
    waiting: 'Ожидание сканирования',
    waitingApproval: 'Ожидание подтверждения',
    expiresIn: 'Истекает через {time}',
    secured: 'Проверка Proof-of-Human от ZOREAL',
    noIdTitle: 'Ещё нет ZOREAL ID?',
    noIdBody: 'Отсканируйте тот же код, чтобы скачать приложение и создать его бесплатно. Это займёт минуту.',
    cancel: 'Отмена',
    close: 'Закрыть',
    qrAlt: 'QR-код для входа через ZOREAL',
  },
  ja: {
    title: 'スキャンしてログイン',
    titleApprove: 'スマートフォンで承認',
    bodyScan: 'スマートフォンのカメラまたはZOREAL IDアプリでスキャンしてください。',
    bodyApprove: 'ZOREAL IDアプリでログインを承認してください。',
    bodyEnrolling: 'スマートフォンでZOREAL IDの設定を完了し、ログインを承認してください。',
    waiting: 'スキャン待ち',
    waitingApproval: '承認待ち',
    expiresIn: '有効期限まで {time}',
    secured: 'ZOREALによるProof-of-Human認証',
    noIdTitle: 'ZOREAL IDをお持ちでないですか？',
    noIdBody: '同じコードをスキャンしてアプリをダウンロードし、無料で作成できます。1分ほどで完了します。',
    cancel: 'キャンセル',
    close: '閉じる',
    qrAlt: 'ZOREALでログインするためのQRコード',
  },
  hi: {
    title: 'साइन इन करने के लिए स्कैन करें',
    titleApprove: 'अपने फोन पर स्वीकृत करें',
    bodyScan: 'अपने फोन के कैमरे या ZOREAL ID ऐप से स्कैन करें।',
    bodyApprove: 'अपने ZOREAL ID ऐप में लॉगिन स्वीकृत करें।',
    bodyEnrolling: 'अपने फोन पर ZOREAL ID सेटअप पूरा करें, फिर लॉगिन स्वीकृत करें।',
    waiting: 'स्कैन की प्रतीक्षा है',
    waitingApproval: 'स्वीकृति की प्रतीक्षा है',
    expiresIn: '{time} में समाप्त',
    secured: 'ZOREAL द्वारा Proof-of-Human सत्यापन',
    noIdTitle: 'अभी तक ZOREAL ID नहीं है?',
    noIdBody: 'ऐप डाउनलोड करने और मुफ्त में एक बनाने के लिए वही कोड स्कैन करें। इसमें बस एक मिनट लगता है।',
    cancel: 'रद्द करें',
    close: 'बंद करें',
    qrAlt: 'ZOREAL से साइन इन करने के लिए QR कोड',
  },
  zhs: {
    title: '扫码登录',
    titleApprove: '在手机上批准',
    bodyScan: '使用手机相机或 ZOREAL ID 应用扫描。',
    bodyApprove: '请在 ZOREAL ID 应用中批准登录。',
    bodyEnrolling: '请在手机上完成 ZOREAL ID 设置，然后批准登录。',
    waiting: '等待扫描',
    waitingApproval: '等待批准',
    expiresIn: '{time} 后失效',
    secured: '由 ZOREAL 提供的 Proof-of-Human 验证',
    noIdTitle: '还没有 ZOREAL ID？',
    noIdBody: '扫描同一个二维码即可下载应用并免费创建，只需一分钟。',
    cancel: '取消',
    close: '关闭',
    qrAlt: '使用 ZOREAL 登录的二维码',
  },
  zht: {
    title: '掃碼登入',
    titleApprove: '在手機上核准',
    bodyScan: '使用手機相機或 ZOREAL ID 應用程式掃描。',
    bodyApprove: '請在 ZOREAL ID 應用程式中核准登入。',
    bodyEnrolling: '請在手機上完成 ZOREAL ID 設定，然後核准登入。',
    waiting: '等待掃描',
    waitingApproval: '等待核准',
    expiresIn: '{time} 後失效',
    secured: '由 ZOREAL 提供的 Proof-of-Human 驗證',
    noIdTitle: '還沒有 ZOREAL ID？',
    noIdBody: '掃描同一個 QR code 即可下載應用程式並免費建立，只需一分鐘。',
    cancel: '取消',
    close: '關閉',
    qrAlt: '使用 ZOREAL 登入的 QR code',
  },
  ar: {
    title: 'امسح لتسجيل الدخول',
    titleApprove: 'وافق على هاتفك',
    bodyScan: 'امسح باستخدام كاميرا هاتفك أو تطبيق ZOREAL ID.',
    bodyApprove: 'وافق على تسجيل الدخول في تطبيق ZOREAL ID.',
    bodyEnrolling: 'أكمل إعداد ZOREAL ID على هاتفك، ثم وافق على تسجيل الدخول.',
    waiting: 'في انتظار المسح',
    waitingApproval: 'في انتظار الموافقة',
    expiresIn: 'تنتهي الصلاحية خلال {time}',
    secured: 'التحقق من Proof-of-Human بواسطة ZOREAL',
    noIdTitle: 'ليس لديك ZOREAL ID بعد؟',
    noIdBody: 'امسح الرمز نفسه لتنزيل التطبيق وإنشاء حساب مجاني. يستغرق الأمر دقيقة واحدة فقط.',
    cancel: 'إلغاء',
    close: 'إغلاق',
    qrAlt: 'رمز QR لتسجيل الدخول باستخدام ZOREAL',
  },
  ko: {
    title: '스캔하여 로그인',
    titleApprove: '휴대폰에서 승인',
    bodyScan: '휴대폰 카메라 또는 ZOREAL ID 앱으로 스캔하세요.',
    bodyApprove: 'ZOREAL ID 앱에서 로그인을 승인하세요.',
    bodyEnrolling: '휴대폰에서 ZOREAL ID 설정을 완료한 후 로그인을 승인하세요.',
    waiting: '스캔 대기 중',
    waitingApproval: '승인 대기 중',
    expiresIn: '{time} 후 만료',
    secured: 'ZOREAL의 Proof-of-Human 인증',
    noIdTitle: '아직 ZOREAL ID가 없으신가요?',
    noIdBody: '같은 코드를 스캔해 앱을 내려받고 무료로 만드세요. 1분이면 됩니다.',
    cancel: '취소',
    close: '닫기',
    qrAlt: 'ZOREAL로 로그인하기 위한 QR 코드',
  },
  // Български
  bg: {
    title: 'Сканирайте за вход',
    titleApprove: 'Потвърдете на телефона си',
    bodyScan: 'Сканирайте с камерата на телефона или с приложението ZOREAL ID.',
    bodyApprove: 'Потвърдете входа в приложението ZOREAL ID.',
    bodyEnrolling: 'Довършете настройката на ZOREAL ID на телефона си, след което потвърдете входа.',
    waiting: 'Изчакване на сканиране',
    waitingApproval: 'Изчакване на потвърждение',
    expiresIn: 'Изтича след {time}',
    secured: 'Проверка Proof-of-Human от ZOREAL',
    noIdTitle: 'Все още нямате ZOREAL ID?',
    noIdBody: 'Сканирайте същия код, за да изтеглите приложението и да си създадете безплатен акаунт. Отнема само минута.',
    cancel: 'Отказ',
    close: 'Затвори',
    qrAlt: 'QR код за вход със ZOREAL',
  },
  // বাংলা
  bn: {
    title: 'সাইন ইন করতে স্ক্যান করুন',
    titleApprove: 'আপনার ফোনে অনুমোদন করুন',
    bodyScan: 'আপনার ফোনের ক্যামেরা বা ZOREAL ID অ্যাপ দিয়ে স্ক্যান করুন।',
    bodyApprove: 'আপনার ZOREAL ID অ্যাপে লগইন অনুমোদন করুন।',
    bodyEnrolling: 'আপনার ফোনে ZOREAL ID সেটআপ সম্পূর্ণ করুন, তারপর লগইন অনুমোদন করুন।',
    waiting: 'স্ক্যানের অপেক্ষায়',
    waitingApproval: 'অনুমোদনের অপেক্ষায়',
    expiresIn: '{time} পরে মেয়াদ শেষ হবে',
    secured: 'ZOREAL দ্বারা Proof-of-Human যাচাইকরণ',
    noIdTitle: 'এখনো ZOREAL ID নেই?',
    noIdBody: 'অ্যাপ ডাউনলোড করে বিনামূল্যে একটি তৈরি করতে একই কোড স্ক্যান করুন। এতে মাত্র এক মিনিট সময় লাগে।',
    cancel: 'বাতিল',
    close: 'বন্ধ',
    qrAlt: 'ZOREAL দিয়ে সাইন ইন করার জন্য QR কোড',
  },
  // Bosanski
  bs: {
    title: 'Skenirajte za prijavu',
    titleApprove: 'Odobrite na svom telefonu',
    bodyScan: 'Skenirajte kamerom svog telefona ili aplikacijom ZOREAL ID.',
    bodyApprove: 'Odobrite prijavu u aplikaciji ZOREAL ID.',
    bodyEnrolling: 'Završite podešavanje ZOREAL ID-a na svom telefonu, a zatim odobrite prijavu.',
    waiting: 'Čeka se skeniranje',
    waitingApproval: 'Čeka se odobrenje',
    expiresIn: 'Ističe za {time}',
    secured: 'ZOREAL Proof-of-Human verifikacija',
    noIdTitle: 'Nemate ZOREAL ID?',
    noIdBody: 'Skenirajte isti kod da preuzmete aplikaciju i besplatno ga napravite. Traje samo minutu.',
    cancel: 'Otkaži',
    close: 'Zatvori',
    qrAlt: 'QR kod za prijavu putem ZOREAL-a',
  },
  // Čeština
  cs: {
    title: 'Přihlaste se naskenováním',
    titleApprove: 'Potvrďte v telefonu',
    bodyScan: 'Naskenujte fotoaparátem telefonu nebo aplikací ZOREAL ID.',
    bodyApprove: 'Potvrďte přihlášení v aplikaci ZOREAL ID.',
    bodyEnrolling: 'Dokončete nastavení ZOREAL ID v telefonu a poté potvrďte přihlášení.',
    waiting: 'Čekání na naskenování',
    waitingApproval: 'Čekání na potvrzení',
    expiresIn: 'Vyprší za {time}',
    secured: 'Ověření Proof-of-Human od ZOREAL',
    noIdTitle: 'Ještě nemáte ZOREAL ID?',
    noIdBody: 'Naskenováním stejného kódu si stáhnete aplikaci a zdarma vytvoříte ZOREAL ID. Zabere to jen minutu.',
    cancel: 'Zrušit',
    close: 'Zavřít',
    qrAlt: 'QR kód pro přihlášení pomocí ZOREAL',
  },
  // Dansk
  da: {
    title: 'Scan for at logge ind',
    titleApprove: 'Godkend på din telefon',
    bodyScan: 'Scan med telefonens kamera eller ZOREAL ID-appen.',
    bodyApprove: 'Godkend login i din ZOREAL ID-app.',
    bodyEnrolling: 'Færdiggør opsætningen af ZOREAL ID på din telefon, og godkend derefter login.',
    waiting: 'Venter på scanning',
    waitingApproval: 'Venter på godkendelse',
    expiresIn: 'Udløber om {time}',
    secured: 'Proof-of-Human-verificering af ZOREAL',
    noIdTitle: 'Har du ikke et ZOREAL ID endnu?',
    noIdBody: 'Scan den samme kode for at hente appen og oprette et gratis. Det tager kun et minut.',
    cancel: 'Annuller',
    close: 'Luk',
    qrAlt: 'QR-kode til at logge ind med ZOREAL',
  },
  // Ελληνικά
  el: {
    title: 'Σάρωση για σύνδεση',
    titleApprove: 'Έγκριση από το κινητό σας',
    bodyScan: 'Σαρώστε με την κάμερα του κινητού σας ή την εφαρμογή ZOREAL ID.',
    bodyApprove: 'Εγκρίνετε τη σύνδεση στην εφαρμογή ZOREAL ID.',
    bodyEnrolling: 'Ολοκληρώστε τη ρύθμιση του ZOREAL ID στο κινητό σας και έπειτα εγκρίνετε τη σύνδεση.',
    waiting: 'Αναμονή σάρωσης',
    waitingApproval: 'Αναμονή έγκρισης',
    expiresIn: 'Λήγει σε {time}',
    secured: 'Επαλήθευση Proof-of-Human από τη ZOREAL',
    noIdTitle: 'Δεν έχετε ακόμα ZOREAL ID;',
    noIdBody: 'Σαρώστε τον ίδιο κωδικό για να κατεβάσετε την εφαρμογή και να δημιουργήσετε ένα δωρεάν. Χρειάζεται μόνο ένα λεπτό.',
    cancel: 'Άκυρο',
    close: 'Κλείσιμο',
    qrAlt: 'Κωδικός QR για σύνδεση με ZOREAL',
  },
  // Español (LA)
  'es-419': {
    title: 'Escanea para iniciar sesión',
    titleApprove: 'Aprueba desde tu celular',
    bodyScan: 'Escanea con la cámara de tu celular o con la app ZOREAL ID.',
    bodyApprove: 'Aprueba el inicio de sesión en tu app ZOREAL ID.',
    bodyEnrolling: 'Termina de configurar ZOREAL ID en tu celular y luego aprueba el inicio de sesión.',
    waiting: 'Esperando escaneo',
    waitingApproval: 'Esperando aprobación',
    expiresIn: 'Expira en {time}',
    secured: 'Verificación Proof-of-Human de ZOREAL',
    noIdTitle: '¿Todavía no tienes ZOREAL ID?',
    noIdBody: 'Escanea el mismo código para descargar la app y crear uno gratis. Solo toma un minuto.',
    cancel: 'Cancelar',
    close: 'Cerrar',
    qrAlt: 'Código QR para iniciar sesión con ZOREAL',
  },
  // Suomi
  fi: {
    title: 'Kirjaudu sisään skannaamalla',
    titleApprove: 'Hyväksy puhelimessasi',
    bodyScan: 'Skannaa puhelimesi kameralla tai ZOREAL ID -sovelluksella.',
    bodyApprove: 'Hyväksy kirjautuminen ZOREAL ID -sovelluksessasi.',
    bodyEnrolling: 'Viimeistele ZOREAL ID -sovelluksen käyttöönotto puhelimellasi ja hyväksy sitten kirjautuminen.',
    waiting: 'Odotetaan skannausta',
    waitingApproval: 'Odotetaan hyväksyntää',
    expiresIn: 'Vanhenee {time} kuluttua',
    secured: 'ZOREALin Proof-of-Human-vahvistus',
    noIdTitle: 'Eikö sinulla ole vielä ZOREAL ID:tä?',
    noIdBody: 'Skannaa sama koodi ladataksesi sovelluksen ja luodaksesi tunnuksen ilmaiseksi. Se vie vain minuutin.',
    cancel: 'Peruuta',
    close: 'Sulje',
    qrAlt: 'QR-koodi ZOREAL-kirjautumista varten',
  },
  // עברית
  he: {
    title: 'סרוק כדי להתחבר',
    titleApprove: 'אשר בטלפון שלך',
    bodyScan: 'סרוק באמצעות מצלמת הטלפון שלך או אפליקציית ZOREAL ID.',
    bodyApprove: 'אשר את ההתחברות באפליקציית ZOREAL ID שלך.',
    bodyEnrolling: 'סיים להגדיר את ZOREAL ID בטלפון שלך, ואז אשר את ההתחברות.',
    waiting: 'ממתין לסריקה',
    waitingApproval: 'ממתין לאישור',
    expiresIn: 'יפוג בעוד {time}',
    secured: 'אימות Proof-of-Human מבית ZOREAL',
    noIdTitle: 'עדיין אין לך ZOREAL ID?',
    noIdBody: 'סרוק את אותו הקוד כדי להוריד את האפליקציה וליצור אחד בחינם. זה לוקח רק דקה.',
    cancel: 'ביטול',
    close: 'סגור',
    qrAlt: 'קוד QR להתחברות עם ZOREAL',
  },
  // Hrvatski
  hr: {
    title: 'Skenirajte za prijavu',
    titleApprove: 'Odobrite na svom mobitelu',
    bodyScan: 'Skenirajte kamerom svog mobitela ili aplikacijom ZOREAL ID.',
    bodyApprove: 'Odobrite prijavu u aplikaciji ZOREAL ID.',
    bodyEnrolling: 'Dovršite postavljanje ZOREAL ID-a na svom mobitelu, a zatim odobrite prijavu.',
    waiting: 'Čeka se skeniranje',
    waitingApproval: 'Čeka se odobrenje',
    expiresIn: 'Ističe za {time}',
    secured: 'ZOREAL Proof-of-Human provjera',
    noIdTitle: 'Nemate ZOREAL ID?',
    noIdBody: 'Skenirajte isti kod da preuzmete aplikaciju i besplatno ga izradite. Traje samo minutu.',
    cancel: 'Odustani',
    close: 'Zatvori',
    qrAlt: 'QR kod za prijavu putem ZOREAL-a',
  },
  // Magyar
  hu: {
    title: 'Bejelentkezés beolvasással',
    titleApprove: 'Jóváhagyás a telefonján',
    bodyScan: 'Olvassa be a telefonja kamerájával, vagy a ZOREAL ID alkalmazással.',
    bodyApprove: 'Hagyja jóvá a bejelentkezést a ZOREAL ID alkalmazásban.',
    bodyEnrolling: 'Fejezze be a ZOREAL ID beállítását a telefonján, majd hagyja jóvá a bejelentkezést.',
    waiting: 'Várakozás beolvasásra',
    waitingApproval: 'Várakozás jóváhagyásra',
    expiresIn: 'Lejár {time} múlva',
    secured: 'Proof-of-Human hitelesítés a ZOREAL-tól',
    noIdTitle: 'Még nincs ZOREAL ID-je?',
    noIdBody: 'Olvassa be ugyanazt a kódot az alkalmazás letöltéséhez, és hozzon létre egyet ingyenesen. Mindössze egy percet vesz igénybe.',
    cancel: 'Mégse',
    close: 'Bezárás',
    qrAlt: 'QR-kód a ZOREAL-lal való bejelentkezéshez',
  },
  // Bahasa Indonesia
  id: {
    title: 'Pindai untuk masuk',
    titleApprove: 'Setujui di ponsel Anda',
    bodyScan: 'Pindai dengan kamera ponsel atau aplikasi ZOREAL ID.',
    bodyApprove: 'Setujui proses masuk di aplikasi ZOREAL ID Anda.',
    bodyEnrolling: 'Selesaikan pengaturan ZOREAL ID di ponsel Anda, lalu setujui proses masuk.',
    waiting: 'Menunggu pemindaian',
    waitingApproval: 'Menunggu persetujuan',
    expiresIn: 'Berakhir dalam {time}',
    secured: 'Verifikasi Proof-of-Human oleh ZOREAL',
    noIdTitle: 'Belum punya ZOREAL ID?',
    noIdBody: 'Pindai kode yang sama untuk mengunduh aplikasi dan membuat akun secara gratis. Hanya butuh waktu satu menit.',
    cancel: 'Batal',
    close: 'Tutup',
    qrAlt: 'Kode QR untuk masuk dengan ZOREAL',
  },
  // Italiano
  it: {
    title: 'Scansiona per accedere',
    titleApprove: 'Approva sul tuo telefono',
    bodyScan: 'Scansiona con la fotocamera del telefono o con l\'app ZOREAL ID.',
    bodyApprove: 'Approva l\'accesso nell\'app ZOREAL ID.',
    bodyEnrolling: 'Completa la configurazione di ZOREAL ID sul telefono, poi approva l\'accesso.',
    waiting: 'In attesa della scansione',
    waitingApproval: 'In attesa di approvazione',
    expiresIn: 'Scade tra {time}',
    secured: 'Verifica Proof-of-Human di ZOREAL',
    noIdTitle: 'Non hai ancora uno ZOREAL ID?',
    noIdBody: 'Scansiona lo stesso codice per scaricare l\'app e crearne uno gratis. Basta un minuto.',
    cancel: 'Annulla',
    close: 'Chiudi',
    qrAlt: 'Codice QR per accedere con ZOREAL',
  },
  // Bahasa Melayu
  ms: {
    title: 'Imbas untuk log masuk',
    titleApprove: 'Luluskan di telefon anda',
    bodyScan: 'Imbas dengan kamera telefon atau aplikasi ZOREAL ID.',
    bodyApprove: 'Luluskan log masuk dalam aplikasi ZOREAL ID anda.',
    bodyEnrolling: 'Selesaikan persediaan ZOREAL ID di telefon anda, kemudian luluskan log masuk.',
    waiting: 'Menunggu imbasan',
    waitingApproval: 'Menunggu kelulusan',
    expiresIn: 'Tamat tempoh dalam {time}',
    secured: 'Pengesahan Proof-of-Human oleh ZOREAL',
    noIdTitle: 'Belum ada ZOREAL ID?',
    noIdBody: 'Imbas kod yang sama untuk memuat turun aplikasi dan cipta satu secara percuma. Hanya mengambil masa seminit.',
    cancel: 'Batal',
    close: 'Tutup',
    qrAlt: 'Kod QR untuk log masuk dengan ZOREAL',
  },
  // Nederlands
  nl: {
    title: 'Scan om in te loggen',
    titleApprove: 'Keur goed op je telefoon',
    bodyScan: 'Scan met de camera van je telefoon of de ZOREAL ID-app.',
    bodyApprove: 'Keur de aanmelding goed in je ZOREAL ID-app.',
    bodyEnrolling: 'Rond het instellen van ZOREAL ID op je telefoon af en keur daarna de aanmelding goed.',
    waiting: 'Wachten op scan',
    waitingApproval: 'Wachten op goedkeuring',
    expiresIn: 'Verloopt over {time}',
    secured: 'Proof-of-Human-verificatie door ZOREAL',
    noIdTitle: 'Nog geen ZOREAL ID?',
    noIdBody: 'Scan dezelfde code om de app te downloaden en gratis een account aan te maken. Dit duurt maar een minuut.',
    cancel: 'Annuleren',
    close: 'Sluiten',
    qrAlt: 'QR-code om in te loggen met ZOREAL',
  },
  // Norsk
  no: {
    title: 'Skann for å logge inn',
    titleApprove: 'Godkjenn på telefonen din',
    bodyScan: 'Skann med telefonens kamera eller ZOREAL ID-appen.',
    bodyApprove: 'Godkjenn innloggingen i ZOREAL ID-appen din.',
    bodyEnrolling: 'Fullfør oppsettet av ZOREAL ID på telefonen din, og godkjenn deretter innloggingen.',
    waiting: 'Venter på skanning',
    waitingApproval: 'Venter på godkjenning',
    expiresIn: 'Utløper om {time}',
    secured: 'Proof-of-Human-verifisering av ZOREAL',
    noIdTitle: 'Har du ikke ZOREAL ID ennå?',
    noIdBody: 'Skann den samme koden for å laste ned appen og opprette en gratis. Det tar bare et minutt.',
    cancel: 'Avbryt',
    close: 'Lukk',
    qrAlt: 'QR-kode for å logge inn med ZOREAL',
  },
  // Polski
  pl: {
    title: 'Zeskanuj, aby się zalogować',
    titleApprove: 'Zatwierdź w telefonie',
    bodyScan: 'Zeskanuj aparatem telefonu lub aplikacją ZOREAL ID.',
    bodyApprove: 'Zatwierdź logowanie w aplikacji ZOREAL ID.',
    bodyEnrolling: 'Dokończ konfigurację ZOREAL ID w telefonie, a następnie zatwierdź logowanie.',
    waiting: 'Czekanie na skan',
    waitingApproval: 'Czekanie na zatwierdzenie',
    expiresIn: 'Wygasa za {time}',
    secured: 'Weryfikacja Proof-of-Human od ZOREAL',
    noIdTitle: 'Nie masz jeszcze ZOREAL ID?',
    noIdBody: 'Zeskanuj ten sam kod, aby pobrać aplikację i bezpłatnie utworzyć ZOREAL ID. Zajmie to tylko minutę.',
    cancel: 'Anuluj',
    close: 'Zamknij',
    qrAlt: 'Kod QR do logowania za pomocą ZOREAL',
  },
  // Português (BR)
  'pt-br': {
    title: 'Escaneie para entrar',
    titleApprove: 'Aprove no seu celular',
    bodyScan: 'Escaneie com a câmera do seu celular ou com o app ZOREAL ID.',
    bodyApprove: 'Aprove o login no app ZOREAL ID.',
    bodyEnrolling: 'Termine de configurar o ZOREAL ID no seu celular e depois aprove o login.',
    waiting: 'Aguardando escaneamento',
    waitingApproval: 'Aguardando aprovação',
    expiresIn: 'Expira em {time}',
    secured: 'Verificação Proof-of-Human da ZOREAL',
    noIdTitle: 'Ainda não tem um ZOREAL ID?',
    noIdBody: 'Escaneie o mesmo código para baixar o app e criar um de graça. Leva só um minuto.',
    cancel: 'Cancelar',
    close: 'Fechar',
    qrAlt: 'Código QR para entrar com ZOREAL',
  },
  // Română
  ro: {
    title: 'Scanați pentru conectare',
    titleApprove: 'Aprobați de pe telefon',
    bodyScan: 'Scanați cu camera telefonului sau cu aplicația ZOREAL ID.',
    bodyApprove: 'Aprobați conectarea în aplicația ZOREAL ID.',
    bodyEnrolling: 'Finalizați configurarea ZOREAL ID pe telefon, apoi aprobați conectarea.',
    waiting: 'Se așteaptă scanarea',
    waitingApproval: 'Se așteaptă aprobarea',
    expiresIn: 'Expiră în {time}',
    secured: 'Verificare Proof-of-Human de la ZOREAL',
    noIdTitle: 'Nu aveți încă un ZOREAL ID?',
    noIdBody: 'Scanați același cod pentru a descărca aplicația și a crea unul gratuit. Durează doar un minut.',
    cancel: 'Anulează',
    close: 'Închide',
    qrAlt: 'Cod QR pentru conectare cu ZOREAL',
  },
  // Српски
  sr: {
    title: 'Скенирајте за пријаву',
    titleApprove: 'Одобрите на свом телефону',
    bodyScan: 'Скенирајте камером свог телефона или апликацијом ZOREAL ID.',
    bodyApprove: 'Одобрите пријаву у апликацији ZOREAL ID.',
    bodyEnrolling: 'Довршите подешавање ZOREAL ID-а на свом телефону, па одобрите пријаву.',
    waiting: 'Чека се скенирање',
    waitingApproval: 'Чека се одобрење',
    expiresIn: 'Истиче за {time}',
    secured: 'ZOREAL Proof-of-Human верификација',
    noIdTitle: 'Немате ZOREAL ID?',
    noIdBody: 'Скенирајте исти код да преузмете апликацију и бесплатно га направите. Траје само минут.',
    cancel: 'Откажи',
    close: 'Затвори',
    qrAlt: 'QR код за пријаву преко ZOREAL-а',
  },
  // ไทย
  th: {
    title: 'สแกนเพื่อเข้าสู่ระบบ',
    titleApprove: 'อนุมัติบนโทรศัพท์ของคุณ',
    bodyScan: 'สแกนด้วยกล้องโทรศัพท์หรือแอป ZOREAL ID',
    bodyApprove: 'อนุมัติการเข้าสู่ระบบในแอป ZOREAL ID ของคุณ',
    bodyEnrolling: 'ตั้งค่า ZOREAL ID บนโทรศัพท์ของคุณให้เสร็จสิ้น แล้วอนุมัติการเข้าสู่ระบบ',
    waiting: 'รอการสแกน',
    waitingApproval: 'รอการอนุมัติ',
    expiresIn: 'หมดอายุใน {time}',
    secured: 'การยืนยันตัวตน Proof-of-Human โดย ZOREAL',
    noIdTitle: 'ยังไม่มี ZOREAL ID ใช่ไหม',
    noIdBody: 'สแกนโค้ดเดียวกันเพื่อดาวน์โหลดแอปและสร้างบัญชีฟรี ใช้เวลาเพียงนาทีเดียว',
    cancel: 'ยกเลิก',
    close: 'ปิด',
    qrAlt: 'คิวอาร์โค้ดสำหรับเข้าสู่ระบบด้วย ZOREAL',
  },
  // Tagalog
  tl: {
    title: 'I-scan para mag-sign in',
    titleApprove: 'I-approve sa iyong telepono',
    bodyScan: 'I-scan gamit ang camera ng iyong telepono o ang ZOREAL ID app.',
    bodyApprove: 'I-approve ang login sa iyong ZOREAL ID app.',
    bodyEnrolling: 'Tapusin muna ang pag-set up ng ZOREAL ID sa iyong telepono, pagkatapos ay i-approve ang login.',
    waiting: 'Naghihintay ng scan',
    waitingApproval: 'Naghihintay ng approval',
    expiresIn: 'Mag-e-expire sa {time}',
    secured: 'Proof-of-Human verification mula sa ZOREAL',
    noIdTitle: 'Wala ka pang ZOREAL ID?',
    noIdBody: 'I-scan ang parehong code para i-download ang app at gumawa ng iyong ZOREAL ID nang libre. Isang minuto lang ito.',
    cancel: 'Kanselahin',
    close: 'Isara',
    qrAlt: 'QR code para mag-sign in gamit ang ZOREAL',
  },
  // Türkçe
  tr: {
    title: 'Giriş için tarayın',
    titleApprove: 'Telefonunuzdan onaylayın',
    bodyScan: 'Telefonunuzun kamerasıyla veya ZOREAL ID uygulamasıyla tarayın.',
    bodyApprove: 'Girişi ZOREAL ID uygulamanızdan onaylayın.',
    bodyEnrolling: 'Telefonunuzda ZOREAL ID kurulumunu tamamlayın, ardından girişi onaylayın.',
    waiting: 'Tarama bekleniyor',
    waitingApproval: 'Onay bekleniyor',
    expiresIn: '{time} içinde sona erer',
    secured: 'ZOREAL tarafından Proof-of-Human doğrulaması',
    noIdTitle: 'Henüz ZOREAL ID\'niz yok mu?',
    noIdBody: 'Uygulamayı indirmek ve ücretsiz bir tane oluşturmak için aynı kodu tarayın. Sadece bir dakikanızı alır.',
    cancel: 'İptal',
    close: 'Kapat',
    qrAlt: 'ZOREAL ile giriş yapmak için QR kodu',
  },
  // Українська
  uk: {
    title: 'Скануйте для входу',
    titleApprove: 'Підтвердьте на телефоні',
    bodyScan: 'Скануйте камерою телефону або додатком ZOREAL ID.',
    bodyApprove: 'Підтвердьте вхід у додатку ZOREAL ID.',
    bodyEnrolling: 'Завершіть налаштування ZOREAL ID на телефоні, а потім підтвердьте вхід.',
    waiting: 'Очікування сканування',
    waitingApproval: 'Очікування підтвердження',
    expiresIn: 'Спливає через {time}',
    secured: 'Перевірка Proof-of-Human від ZOREAL',
    noIdTitle: 'Ще немає ZOREAL ID?',
    noIdBody: 'Скануйте той самий код, щоб завантажити додаток і безкоштовно створити його. Це займе лише хвилину.',
    cancel: 'Скасувати',
    close: 'Закрити',
    qrAlt: 'QR-код для входу через ZOREAL',
  },
  // اردو
  ur: {
    title: 'لاگ اِن کرنے کے لیے اسکین کریں',
    titleApprove: 'اپنے فون پر منظوری دیں',
    bodyScan: 'اپنے فون کے کیمرے یا ZOREAL ID ایپ سے اسکین کریں۔',
    bodyApprove: 'اپنی ZOREAL ID ایپ میں لاگ اِن کی منظوری دیں۔',
    bodyEnrolling: 'اپنے فون پر ZOREAL ID کی سیٹ اپ مکمل کریں، پھر لاگ اِن کی منظوری دیں۔',
    waiting: 'اسکین کا انتظار',
    waitingApproval: 'منظوری کا انتظار',
    expiresIn: '{time} میں ختم ہوگا',
    secured: 'ZOREAL کی جانب سے Proof-of-Human تصدیق',
    noIdTitle: 'ابھی تک ZOREAL ID نہیں ہے؟',
    noIdBody: 'ایپ ڈاؤن لوڈ کرنے اور مفت میں ایک بنانے کے لیے وہی کوڈ اسکین کریں۔ اس میں صرف ایک منٹ لگتا ہے۔',
    cancel: 'منسوخ کریں',
    close: 'بند کریں',
    qrAlt: 'ZOREAL کے ساتھ لاگ اِن کرنے کے لیے QR کوڈ',
  },
  // Tiếng Việt
  vi: {
    title: 'Quét để đăng nhập',
    titleApprove: 'Phê duyệt trên điện thoại của bạn',
    bodyScan: 'Quét bằng camera điện thoại hoặc ứng dụng ZOREAL ID.',
    bodyApprove: 'Phê duyệt đăng nhập trong ứng dụng ZOREAL ID của bạn.',
    bodyEnrolling: 'Hoàn tất thiết lập ZOREAL ID trên điện thoại, sau đó phê duyệt đăng nhập.',
    waiting: 'Đang chờ quét mã',
    waitingApproval: 'Đang chờ phê duyệt',
    expiresIn: 'Hết hạn sau {time}',
    secured: 'Xác minh Proof-of-Human bởi ZOREAL',
    noIdTitle: 'Chưa có ZOREAL ID?',
    noIdBody: 'Quét cùng mã này để tải ứng dụng và tạo tài khoản miễn phí. Chỉ mất một phút.',
    cancel: 'Hủy',
    close: 'Đóng',
    qrAlt: 'Mã QR để đăng nhập bằng ZOREAL',
  },
};

/** Locales whose script runs right to left, so the dialog flips with `dir`. */
// Only languages we actually carry. Listing an RTL language we do not
// translate would flip the dialog for someone who is then shown the English
// fallback — LTR text in an RTL container, which is worse than either alone.
const RTL = new Set(['ar', 'he', 'iw', 'ur']);

/**
 * One BCP 47 tag to a translation, or undefined if we do not carry it.
 *
 * Chinese is the only case needing more than the primary subtag: `zh-Hans` /
 * `zh-CN` / `zh-SG` are Simplified, everything else `zh` is treated as
 * Traditional, matching how the pairing page splits them.
 */
/**
 * Primary subtags that reach the same table under another name: superseded ISO
 * codes some platforms still emit, and the written standards we carry one entry
 * for. Without these a Norwegian browser sending `nb` gets English while `no`
 * sits right there in the table.
 */
const ALIASES: Record<string, string> = {
  nb: 'no', // Bokmål — what we actually wrote
  nn: 'no', // Nynorsk reader, served Bokmål: closer than English
  fil: 'tl', // Filipino / Tagalog
  iw: 'he', // superseded code for Hebrew, still emitted by some platforms
  in: 'id', // superseded code for Indonesian
};

/**
 * Spanish and Portuguese ship two variants each, and the split that matters is
 * not the language but the side of the Atlantic. A `es-MX` browser resolving to
 * peninsular Spanish is the kind of near-miss that reads as nobody having
 * thought about it, so the Latin American regions are named explicitly.
 */
const LATAM = new Set([
  'ar', 'bo', 'cl', 'co', 'cr', 'cu', 'do', 'ec', 'gt', 'hn',
  'mx', 'ni', 'pa', 'pe', 'pr', 'py', 'sv', 'uy', 've', '419',
]);

function lookup(locale: string): PairingStrings | undefined {
  const tag = locale.toLowerCase().replace(/_/g, '-');
  const parts = tag.split('-');
  const primary = ALIASES[parts[0]] ?? parts[0];
  const region = parts[1];

  // Script, not region, is what separates these two.
  if (primary === 'zh') {
    const simplified = /(^|-)(hans|cn|sg|my)(-|$)/.test(tag);
    return TRANSLATIONS[simplified ? 'zhs' : 'zht'];
  }
  if (primary === 'es' && region && LATAM.has(region)) return TRANSLATIONS['es-419'];
  if (primary === 'pt' && region === 'br') return TRANSLATIONS['pt-br'];

  return TRANSLATIONS[tag] ?? TRANSLATIONS[primary];
}

/**
 * What the browser says the person reads, best first. `languages` is the whole
 * ordered preference list, which matters: someone whose first choice we do not
 * carry may well have a second we do, and falling straight to English would
 * skip it.
 */
function browserLocales(): string[] {
  if (typeof navigator === 'undefined') return [];
  const nav = navigator as Navigator & { languages?: readonly string[] };
  if (nav.languages && nav.languages.length) return [...nav.languages];
  return nav.language ? [nav.language] : [];
}

/**
 * The strings to render.
 *
 * An explicit `locale` (from the provider) wins outright: the host app knows
 * which language it is currently showing, and the modal must not disagree with
 * the page it opened on. With none given we follow the browser's own preference
 * list, so an integrator who never sets `locale` still gets a translated modal
 * instead of English-by-default. Anything we do not carry falls back to English
 * rather than rendering a key.
 */
export function strings(locale?: string): PairingStrings {
  if (locale) return lookup(locale) ?? en;
  for (const candidate of browserLocales()) {
    const hit = lookup(candidate);
    if (hit) return hit;
  }
  return en;
}

export function isRtl(locale?: string): boolean {
  const tag = locale ?? browserLocales()[0];
  if (!tag) return false;
  return RTL.has(tag.toLowerCase().replace(/_/g, '-').split('-')[0]);
}

/** The one substitution the copy needs. */
export function interpolate(template: string, time: string): string {
  return template.replace('{time}', time);
}

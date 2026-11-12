import { useState, useEffect } from 'react';

export type SupportedLanguageCode = 'en' | 'hi' | 'bn' | 'ta' | 'mr';

export interface LanguageMeta {
  code: SupportedLanguageCode;
  englishName: string;
  nativeName: string;
  shortLabel: string;
  bcp47: string;
  voiceGreeting: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: 'en',
    englishName: 'English',
    nativeName: 'English',
    shortLabel: 'EN',
    bcp47: 'en-IN',
    voiceGreeting: 'English voice & protocol guidance active.'
  },
  {
    code: 'hi',
    englishName: 'Hindi',
    nativeName: 'हिंदी',
    shortLabel: 'हिंदी',
    bcp47: 'hi-IN',
    voiceGreeting: 'हिंदी आवाज़ और प्राथमिक उपचार निर्देश सक्रिय हैं।'
  },
  {
    code: 'bn',
    englishName: 'Bengali',
    nativeName: 'বাংলা',
    shortLabel: 'বাংলা',
    bcp47: 'bn-IN',
    voiceGreeting: 'বাংলা ভয়েস এবং প্রাথমিক চিকিৎসার নির্দেশাবলী সক্রিয় করা হয়েছে।'
  },
  {
    code: 'ta',
    englishName: 'Tamil',
    nativeName: 'தமிழ்',
    shortLabel: 'தமிழ்',
    bcp47: 'ta-IN',
    voiceGreeting: 'தமிழ் குரல் மற்றும் முதலுதவி வழிகாட்டுதல் செயல்பாட்டில் உள்ளது.'
  },
  {
    code: 'mr',
    englishName: 'Marathi',
    nativeName: 'मराठी',
    shortLabel: 'मराठी',
    bcp47: 'mr-IN',
    voiceGreeting: 'मराठी आवाज आणि प्रथमोपचार मार्गदर्शन सक्रिय आहे.'
  }
];

export const LANGUAGE_BY_CODE: Record<SupportedLanguageCode, LanguageMeta> = {
  en: SUPPORTED_LANGUAGES[0],
  hi: SUPPORTED_LANGUAGES[1],
  bn: SUPPORTED_LANGUAGES[2],
  ta: SUPPORTED_LANGUAGES[3],
  mr: SUPPORTED_LANGUAGES[4]
};

const STORAGE_KEY = 'sanjeevani_app_language_v1';
const EVENT_NAME = 'sanjeevani_language_changed';

let currentLanguage: SupportedLanguageCode = (() => {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as SupportedLanguageCode | null;
    if (saved && LANGUAGE_BY_CODE[saved]) {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'en';
})();

export function getAppLanguage(): SupportedLanguageCode {
  return currentLanguage;
}

export function getAppLanguageMeta(code: SupportedLanguageCode = currentLanguage): LanguageMeta {
  return LANGUAGE_BY_CODE[code] || LANGUAGE_BY_CODE.en;
}

export function setAppLanguage(code: SupportedLanguageCode): void {
  if (!LANGUAGE_BY_CODE[code]) return;
  currentLanguage = code;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent<SupportedLanguageCode>(EVENT_NAME, { detail: code }));
  }
}

export type UseAppLanguageReturn = [
  SupportedLanguageCode,
  (code: SupportedLanguageCode) => void,
  LanguageMeta
] & {
  lang: SupportedLanguageCode;
  setLang: (code: SupportedLanguageCode) => void;
  meta: LanguageMeta;
};

export function useAppLanguage(): UseAppLanguageReturn {
  const [lang, setLang] = useState<SupportedLanguageCode>(() => getAppLanguage());

  useEffect(() => {
    const handleChange = (e: Event) => {
      const custom = e as CustomEvent<SupportedLanguageCode>;
      if (custom.detail && LANGUAGE_BY_CODE[custom.detail]) {
        setLang(custom.detail);
      } else {
        setLang(getAppLanguage());
      }
    };
    window.addEventListener(EVENT_NAME, handleChange);
    return () => window.removeEventListener(EVENT_NAME, handleChange);
  }, []);

  const meta = LANGUAGE_BY_CODE[lang] || LANGUAGE_BY_CODE.en;
  const tuple: [SupportedLanguageCode, (code: SupportedLanguageCode) => void, LanguageMeta] = [
    lang,
    setAppLanguage,
    meta
  ];
  return Object.assign(tuple, {
    lang,
    setLang: setAppLanguage,
    meta
  });
}

/* ==========================================================================
 * 1. CORE UI COPY TRANSLATIONS (EN, HI, BN, TA, MR)
 * ========================================================================== */

export interface LocalizedUICopy {
  languageBarLabel: string;
  whatsTheEmergency: string;
  rescueToolkit: string;
  sosNoticePrefix: string;
  sosNoticeStrong: string;
  sosNoticeSuffix: string;
  guardianWelcome: string;
  howThisWorks: string;
  hideDetails: string;
  howThisWorksDetail: string;
  composerPlaceholder: string;
  listeningTapToStop: string;
  readAloud: string;
  stopReading: string;
  focusMode: string;
  allSteps: string;
  offlineVerifiedBadge: string;
  loudspeakerLabel: string;
  stopLoudspeakerLabel: string;
  doneOfTotal: (done: number, total: number) => string;
  bystandersQrLabel: string;
  paramedicQrLabel: string;
  libraryTitle: string;
  libraryOfflineBadge: string;
  askAiGuardian: string;
  searchProtocolsPlaceholder: string;
  startHereLifeThreatening: string;
  call112First: string;
  call112NowIf: string;
  call112NowSubtitle: string;
  doThisNow: string;
  whatNotToDoHeading: string;
  listenInLanguage: string;
  stopVoiceGuide: string;
  allProtocolsBack: string;
  scenarios: {
    cpr: string;
    bleeding: string;
    snakeBite: string;
    choking: string;
    burn: string;
    heatstroke: string;
    fracture: string;
    anaphylaxis: string;
    hospitalRoute: string;
  };
  bystanderRoles: {
    compressorTitle: string;
    compressorSubtitle: string;
    compressorInstruction: string;
    callerTitle: string;
    callerSubtitle: string;
    callerInstruction: string;
    aedTitle: string;
    aedSubtitle: string;
    aedInstruction: string;
    flaggerTitle: string;
    flaggerSubtitle: string;
    flaggerInstruction: string;
    marshalTitle: string;
    marshalSubtitle: string;
    marshalInstruction: string;
  };
  crowdAnnouncementSpeech: string;
}

export const UI_TRANSLATIONS: Record<SupportedLanguageCode, LocalizedUICopy> = {
  en: {
    languageBarLabel: 'Voice & Protocol Language',
    whatsTheEmergency: "What's the emergency?",
    rescueToolkit: 'Rescue Toolkit',
    sosNoticePrefix: 'If the victim is unconscious or not breathing, tap ',
    sosNoticeStrong: '112 SOS',
    sosNoticeSuffix: ' immediately.',
    guardianWelcome:
      'Namaste! I am your Sanjeevani AI First-Aid Guardian, built on AHA 2020 and AIIMS Emergency Medicine guidelines.',
    howThisWorks: 'How this works',
    hideDetails: 'Hide details',
    howThisWorksDetail:
      'Ask any urgent first-aid question, speak your symptoms with the microphone, or attach an injury photo or incident video. I provide immediate 1-2-3 steps, contraindication warnings, and live hospital route navigation.',
    composerPlaceholder: 'Describe the emergency…',
    listeningTapToStop: 'Listening… tap to stop',
    readAloud: 'Read aloud',
    stopReading: 'Stop',
    focusMode: 'Focus mode',
    allSteps: 'All steps',
    offlineVerifiedBadge: 'Offline protocol · verified',
    loudspeakerLabel: 'Loudspeaker',
    stopLoudspeakerLabel: 'Stop Audio',
    doneOfTotal: (done, total) => `${done} of ${total} done`,
    bystandersQrLabel: 'Bystanders',
    paramedicQrLabel: 'Paramedic',
    libraryTitle: 'First-Aid Library',
    libraryOfflineBadge: 'Works offline · 100 protocols · v2.4',
    askAiGuardian: 'Ask AI Guardian',
    searchProtocolsPlaceholder: 'Search 100 protocols (e.g. CPR, burns, snake bite)…',
    startHereLifeThreatening: 'Start here — Life-threatening emergencies',
    call112First: 'CALL 112 FIRST',
    call112NowIf: 'Call 112 now if…',
    call112NowSubtitle:
      'Immediate emergency medical dispatch is required when any of these signs are present:',
    doThisNow: 'Do this now',
    whatNotToDoHeading: 'What NOT to do (Critical Contraindications)',
    listenInLanguage: 'Listen in English',
    stopVoiceGuide: 'Stop Voice',
    allProtocolsBack: 'All protocols',
    scenarios: {
      cpr: 'CPR & Unresponsive',
      bleeding: 'Arterial Hemorrhage',
      snakeBite: 'Snake Bite & Anti-Venom',
      choking: 'Toddler Choking',
      burn: 'Severe Scald Burn',
      heatstroke: 'Heatstroke (104°F+)',
      fracture: 'Broken Bone / Fracture',
      anaphylaxis: 'Anaphylactic Shock',
      hospitalRoute: 'Nearest Hospital Route'
    },
    bystanderRoles: {
      compressorTitle: 'Hands-on CPR Compressor',
      compressorSubtitle: 'Continuous Chest Compressions',
      compressorInstruction:
        'Place heel of hand in the center of the chest. Lock elbows straight. Push hard and fast (5–6 cm deep). Swap rescuers every 2 minutes.',
      callerTitle: '112 Emergency Dispatcher',
      callerSubtitle: 'Call 112 on Speakerphone',
      callerInstruction:
        'Dial 112 immediately on speakerphone. Read the exact GPS location and state that bystander resuscitation is in progress.',
      aedTitle: 'AED & Trauma Kit Scout',
      aedSubtitle: 'Fetch Defibrillator & First-Aid Box',
      aedInstruction:
        'Run to the nearest reception, security desk, or school medical room to bring the AED defibrillator and trauma kit.',
      flaggerTitle: 'Ambulance Gate Flagger',
      flaggerSubtitle: 'Clear Main Entrance for EMS',
      flaggerInstruction:
        'Stand at the main street entrance or gate with phone flashlight on to wave down and guide the arriving 112 ambulance.',
      marshalTitle: 'Crowd Airflow & Perimeter Marshal',
      marshalSubtitle: 'Keep 15-Foot Breathing Circle',
      marshalInstruction:
        'Step back onlookers to form a clear 15-foot circle around the patient for fresh airflow and rescuer space.'
    },
    crowdAnnouncementSpeech:
      'Attention everyone nearby! We have an emergency medical incident. Please look at this screen, scan the QR code with your phone camera, and take your assigned rescue task immediately.'
  },

  hi: {
    languageBarLabel: 'आवाज़ और प्रोटोकॉल भाषा',
    whatsTheEmergency: 'क्या आपातकालीन स्थिति है?',
    rescueToolkit: 'बचाव टूलकिट',
    sosNoticePrefix: 'यदि पीड़ित बेहोश है या सांस नहीं ले रहा है, तो तुरंत ',
    sosNoticeStrong: '112 SOS',
    sosNoticeSuffix: ' दबाएं।',
    guardianWelcome:
      'नमस्ते! मैं आपका संजीवनी AI प्राथमिक उपचार गार्जियन हूँ, जो AHA 2020 और AIIMS आपातकालीन चिकित्सा दिशानिर्देशों पर आधारित है।',
    howThisWorks: 'यह कैसे काम करता है',
    hideDetails: 'विवरण छुपाएं',
    howThisWorksDetail:
      'कोई भी आपातकालीन प्राथमिक उपचार प्रश्न पूछें, माइक से लक्षण बोलें, या चोट की फोटो/वीडियो जोड़ें। मैं तुरंत 1-2-3 कदम, क्या न करें की चेतावनी और नजदीकी अस्पताल का रास्ता बताता हूँ।',
    composerPlaceholder: 'आपातकालीन स्थिति बताएं…',
    listeningTapToStop: 'सुन रहा हूँ… रोकने के लिए टैप करें',
    readAloud: 'सुनें (हिंदी)',
    stopReading: 'रोकें',
    focusMode: 'फोकस मोड',
    allSteps: 'सभी चरण',
    offlineVerifiedBadge: 'ऑफ़लाइन प्रोटोकॉल · सत्यापित',
    loudspeakerLabel: 'लाउडस्पीकर (हिंदी)',
    stopLoudspeakerLabel: 'आवाज़ रोकें',
    doneOfTotal: (done, total) => `${total} में से ${done} पूर्ण`,
    bystandersQrLabel: 'मददगार (QR)',
    paramedicQrLabel: 'पैरामेडिक (QR)',
    libraryTitle: 'प्राथमिक उपचार लाइब्रेरी',
    libraryOfflineBadge: 'ऑफ़लाइन उपलब्ध · 100 प्रोटोकॉल · v2.4',
    askAiGuardian: 'AI गार्जियन से पूछें',
    searchProtocolsPlaceholder: '100 प्रोटोकॉल खोजें (जैसे CPR, जलना, सांप का काटना)…',
    startHereLifeThreatening: 'यहाँ से शुरू करें — जीवन-रक्षक आपातकालीन प्रोटोकॉल',
    call112First: 'पहले 112 पर कॉल करें',
    call112NowIf: 'तुरंत 112 पर कॉल करें यदि…',
    call112NowSubtitle:
      'इनमें से कोई भी लक्षण दिखने पर तुरंत एम्बुलेंस (112) बुलाना अनिवार्य है:',
    doThisNow: 'अभी यह करें (तत्काल कदम)',
    whatNotToDoHeading: 'क्या बिल्कुल न करें (सावधानियां)',
    listenInLanguage: 'हिंदी में सुनें',
    stopVoiceGuide: 'आवाज़ बंद करें',
    allProtocolsBack: 'सभी प्रोटोकॉल',
    scenarios: {
      cpr: 'CPR और बेहोशी (सांस न चलना)',
      bleeding: 'तेज़ रक्तस्राव (खून बहना)',
      snakeBite: 'सांप का काटना और एंटी-वेनम',
      choking: 'गले में कुछ अटकना (दम घुटना)',
      burn: 'गंभीर जलन / गर्म पानी से जलना',
      heatstroke: 'लू लगना / हीटस्ट्रोक (104°F+)',
      fracture: 'हड्डी टूटना / फ्रैक्चर',
      anaphylaxis: 'गंभीर एलर्जी (एनाफिलेक्सिस)',
      hospitalRoute: 'नजदीकी अस्पताल का रास्ता'
    },
    bystanderRoles: {
      compressorTitle: '1. छाती दबाने वाला (CPR लीड)',
      compressorSubtitle: 'लगातार छाती पर दबाव',
      compressorInstruction:
        'हथेली का निचला हिस्सा छाती के बीच में रखें। कोहनियां सीधी लॉक करें। 5 से 6 सेमी गहरा और तेज़ दबाएं। हर 2 मिनट में साथी बदलें।',
      callerTitle: '2. 112 आपातकालीन कॉलर',
      callerSubtitle: 'स्पीकरफोन पर 112 डायल करें',
      callerInstruction:
        'तुरंत स्पीकर पर 112 मिलाएं। स्क्रीन पर दिख रहा सटीक GPS पता बताएं और कहें कि मरीज को CPR दिया जा रहा है।',
      aedTitle: '3. AED और फर्स्ट-एड किट रनर',
      aedSubtitle: 'डिफिब्रिलेटर और मेडिकल किट लाएं',
      aedInstruction:
        'तुरंत रिसेप्शन, गार्ड रूम या मेडिकल रूम से AED मशीन और फर्स्ट-एड बॉक्स लेकर दौड़ें।',
      flaggerTitle: '4. एम्बुलेंस गेट गाइड',
      flaggerSubtitle: 'मुख्य गेट खाली कराएं',
      flaggerInstruction:
        'मुख्य सड़क या गेट पर फोन की फ्लैशलाइट जलाकर खड़े हों ताकि 112 एम्बुलेंस बिना रुके सीधे मरीज तक पहुंच सके।',
      marshalTitle: '5. भीड़ और हवा नियंत्रण मार्शल',
      marshalSubtitle: '15 फीट का खुला घेरा बनाएं',
      marshalInstruction:
        'मरीज के चारों ओर से भीड़ को 15 फीट पीछे हटाएं ताकि ताज़ी हवा मिल सके और बचाव कार्य में बाधा न हो।'
    },
    crowdAnnouncementSpeech:
      'कृपया ध्यान दें! यहाँ एक गंभीर चिकित्सा आपातकाल है। कृपया भीड़ न लगाएं, इस स्क्रीन पर दिख रहे क्यूआर कोड को अपने फोन कैमरे से स्कैन करें और तुरंत अपनी बचाव जिम्मेदारी संभालें!'
  },

  bn: {
    languageBarLabel: 'ভয়েস এবং প্রোটোকল ভাষা',
    whatsTheEmergency: 'কী ধরনের জরুরি অবস্থা?',
    rescueToolkit: 'রেসকিউ টুলকিট',
    sosNoticePrefix: 'রোগী যদি অজ্ঞান হন বা শ্বাস না নেন, তবে অবিলম্বে ',
    sosNoticeStrong: '112 SOS',
    sosNoticeSuffix: ' বোতামে ট্যাপ করুন।',
    guardianWelcome:
      'নমস্কার! আমি আপনার সঞ্জীবনী AI ফার্স্ট-এইড গার্ডিয়ান, AHA 2020 এবং AIIMS জরুরি চিকিৎসা নির্দেশিকা অনুসারে নির্মিত।',
    howThisWorks: 'এটি কীভাবে কাজ করে',
    hideDetails: 'বিবরণ লুকান',
    howThisWorksDetail:
      'যেকোনো জরুরি প্রাথমিক চিকিৎসার প্রশ্ন করুন, মাইক্রোফোনে লক্ষণ বলুন, অথবা আঘাতের ছবি বা ভিডিও যুক্ত করুন। আমি তাৎক্ষণিক ১-২-৩ ধাপ, কী করবেন না এবং নিকটস্থ হাসপাতালের পথ দেখাই।',
    composerPlaceholder: 'জরুরি অবস্থা বর্ণনা করুন…',
    listeningTapToStop: 'শুনছি… থামাতে ট্যাপ করুন',
    readAloud: 'শুনুন (বাংলা)',
    stopReading: 'থামান',
    focusMode: 'ফোকাস মোড',
    allSteps: 'সব ধাপ',
    offlineVerifiedBadge: 'অফলাইন প্রোটোকল · যাচাইকৃত',
    loudspeakerLabel: 'লাউডস্পিকার (বাংলা)',
    stopLoudspeakerLabel: 'অডিও থামান',
    doneOfTotal: (done, total) => `${total}-এর মধ্যে ${done}টি সম্পন্ন`,
    bystandersQrLabel: 'স্বেচ্ছাসেবক (QR)',
    paramedicQrLabel: 'প্যারামেডিক (QR)',
    libraryTitle: 'প্রাথমিক চিকিৎসা লাইব্রেরি',
    libraryOfflineBadge: 'অফলাইনে কাজ করে · ১০০টি প্রোটোকল · v2.4',
    askAiGuardian: 'AI গার্ডিয়ানকে জিজ্ঞাসা করুন',
    searchProtocolsPlaceholder: '১০০টি প্রোটোকল খুঁজুন (যেমন CPR, পোড়া, সাপের কামড়)…',
    startHereLifeThreatening: 'এখান থেকে শুরু করুন — জীবন-রক্ষাকারী জরুরি প্রোটোকল',
    call112First: 'আগে 112-এ কল করুন',
    call112NowIf: 'এখনই 112-এ কল করুন যদি…',
    call112NowSubtitle:
      'এই লক্ষণগুলোর যেকোনো একটি দেখা দিলে অবিলম্বে অ্যাম্বুলেন্স (112) ডাকা প্রয়োজন:',
    doThisNow: 'এখনই এটি করুন (তাৎক্ষণিক পদক্ষেপ)',
    whatNotToDoHeading: 'কী একেবারে করবেন না (সতর্কতা)',
    listenInLanguage: 'বাংলায় শুনুন',
    stopVoiceGuide: 'ভয়েস বন্ধ করুন',
    allProtocolsBack: 'সব প্রোটোকল',
    scenarios: {
      cpr: 'CPR এবং অজ্ঞান রোগী',
      bleeding: 'তীব্র রক্তপাত বন্ধ করা',
      snakeBite: 'সাপের কামড় ও অ্যান্টি-ভেনম',
      choking: 'গলায় খাবার বা বস্তু আটকে যাওয়া',
      burn: 'গুরুতর পোড়া / গরম জলে ঝলসে যাওয়া',
      heatstroke: 'হিটস্ট্রোক / অতিরিক্ত গরম (104°F+)',
      fracture: 'হাড় ভাঙা / ফ্র্যাকচার',
      anaphylaxis: 'তীব্র অ্যালার্জি (অ্যানাফিল্যাক্সিস)',
      hospitalRoute: 'নিকটস্থ হাসপাতালের রাস্তা'
    },
    bystanderRoles: {
      compressorTitle: '১. বুকে চাপ প্রদানকারী (CPR লিড)',
      compressorSubtitle: 'নিরবচ্ছিন্ন বুকে চাপ (CPR)',
      compressorInstruction:
        'বুকের ঠিক মাঝখানে হাতের তালুর নিচের অংশ রাখুন। কনুই সোজা রাখুন। ৫–৬ সেমি গভীরে দ্রুত ও জোরে চাপ দিন। প্রতি ২ মিনিটে উদ্ধারকারী পরিবর্তন করুন।',
      callerTitle: '২. 112 জরুরি ডিসপ্যাচার',
      callerSubtitle: 'স্পিকারফোনে 112 ডায়াল করুন',
      callerInstruction:
        'অবিলম্বে স্পিকারফোনে 112-এ কল করুন। স্ক্রিনে দেখানো সঠিক GPS অবস্থান বলুন এবং জানান যে CPR চলছে।',
      aedTitle: '৩. AED ও ট্রমা কিট স্কাউট',
      aedSubtitle: 'ডিফিব্রিলেটর ও ফার্স্ট-এইড বক্স আনুন',
      aedInstruction:
        'নিকটস্থ রিসেপশন, সিকিউরিটি ডেস্ক বা মেডিকেল রুম থেকে দ্রুত AED মেশিন এবং ফার্স্ট-এইড কিট নিয়ে আসুন।',
      flaggerTitle: '৪. অ্যাম্বুলেন্স গেট গাইড',
      flaggerSubtitle: 'প্রধান গেট পরিষ্কার রাখুন',
      flaggerInstruction:
        'ফোনের ফ্ল্যাশলাইট জ্বালিয়ে প্রধান গেটে দাঁড়ান এবং 112 অ্যাম্বুলেন্সকে সরাসরি রোগীর কাছে নিয়ে আসুন।',
      marshalTitle: '৫. ভিড় ও বাতাস নিয়ন্ত্রণ মার্শাল',
      marshalSubtitle: '১৫ ফুটের খোলা বৃত্ত বজায় রাখুন',
      marshalInstruction:
        'রোগীর চারপাশে তাজা বাতাস চলাচলের জন্য দর্শকদের ১৫ ফুট পিছনে সরিয়ে দিন।'
    },
    crowdAnnouncementSpeech:
      'অনুগ্রহ করে মনোযোগ দিন! এখানে একটি জরুরি চিকিৎসা পরিস্থিতি তৈরি হয়েছে। দয়া করে ভিড় করবেন না, আপনার ফোনের ক্যামেরা দিয়ে এই স্ক্রিনের QR কোডটি স্ক্যান করুন এবং অবিলম্বে উদ্ধারের দায়িত্ব নিন!'
  },

  ta: {
    languageBarLabel: 'குரல் மற்றும் வழிகாட்டுதல் மொழி',
    whatsTheEmergency: 'என்ன அவசர நிலை?',
    rescueToolkit: 'மீட்பு கருவிப்பெட்டி',
    sosNoticePrefix: 'பாதிக்கப்பட்டவர் மயக்கமாக இருந்தால் அல்லது மூச்சு விடவில்லை என்றால், உடனே ',
    sosNoticeStrong: '112 SOS',
    sosNoticeSuffix: ' ஐ அழுத்தவும்.',
    guardianWelcome:
      'வணக்கம்! நான் உங்கள் சஞ்சீவனி AI முதலுதவி பாதுகாவலன், AHA 2020 மற்றும் AIIMS அவசர மருத்துவ வழிகாட்டுதல்களின்படி உருவாக்கப்பட்டது.',
    howThisWorks: 'இது எப்படி செயல்படுகிறது',
    hideDetails: 'விவரங்களை மறை',
    howThisWorksDetail:
      'அவசர முதலுதவி கேள்வியைக் கேட்கவும், மைக் மூலம் அறிகுறிகளைப் பேசவும், அல்லது காயத்தின் புகைப்படம்/வீடியோவை இணைக்கவும். உடனடி 1-2-3 படிகள், செய்யக்கூடாதவை மற்றும் அருகிலுள்ள மருத்துவமனை வழியை வழங்குகிறேன்.',
    composerPlaceholder: 'அவசர நிலையை விவரிக்கவும்…',
    listeningTapToStop: 'கேட்கிறது… நிறுத்த தட்டவும்',
    readAloud: 'கேட்க (தமிழ்)',
    stopReading: 'நிறுத்து',
    focusMode: 'கவன முறை',
    allSteps: 'அனைத்து படிகள்',
    offlineVerifiedBadge: 'ஆஃப்லைன் நெறிமுறை · சரிபார்க்கப்பட்டது',
    loudspeakerLabel: 'ஒலிபெருக்கி (தமிழ்)',
    stopLoudspeakerLabel: 'ஒலியை நிறுத்து',
    doneOfTotal: (done, total) => `${total} இல் ${done} முடிந்தது`,
    bystandersQrLabel: 'உதவுபவர்கள் (QR)',
    paramedicQrLabel: 'பாராமெடிக் (QR)',
    libraryTitle: 'முதலுதவி நூலகம்',
    libraryOfflineBadge: 'இணையமின்றி இயங்கும் · 100 நெறிமுறைகள் · v2.4',
    askAiGuardian: 'AI பாதுகாவலனிடம் கேளுங்கள்',
    searchProtocolsPlaceholder: '100 நெறிமுறைகளைத் தேடுங்கள் (எ.கா. CPR, தீக்காயம், பாம்பு கடி)…',
    startHereLifeThreatening: 'இங்கே தொடங்கவும் — உயிர் காக்கும் அவசர நிலைகள்',
    call112First: 'முதலில் 112 ஐ அழைக்கவும்',
    call112NowIf: 'உடனே 112 ஐ அழைக்கவும்…',
    call112NowSubtitle:
      'இந்த அறிகுறிகளில் ஏதேனும் தென்பட்டால் உடனடியாக ஆம்புலன்ஸ் (112) அழைக்கப்பட வேண்டும்:',
    doThisNow: 'இப்போதே இதைச் செய்யுங்கள்',
    whatNotToDoHeading: 'செய்யக்கூடாதவை (முக்கிய எச்சரிக்கைகள்)',
    listenInLanguage: 'தமிழில் கேளுங்கள்',
    stopVoiceGuide: 'குரலை நிறுத்து',
    allProtocolsBack: 'அனைத்து நெறிமுறைகள்',
    scenarios: {
      cpr: 'CPR & மயக்கம் (மூச்சின்மை)',
      bleeding: 'கடுமையான இரத்தப்போக்கு',
      snakeBite: 'பாம்பு கடி & விஷ முறிவு',
      choking: 'தொண்டையில் அடைப்பு (மூச்சுத்திணறல்)',
      burn: 'கடுமையான தீக்காயம் / சுடுநீர் காயம்',
      heatstroke: 'வெப்ப பக்கவாதம் / ஹீட்ஸ்ட்ரோக்',
      fracture: 'எலும்பு முறிவு',
      anaphylaxis: 'கடுமையான ஒவ்வாமை (அனாபிலாக்ஸிஸ்)',
      hospitalRoute: 'அருகிலுள்ள மருத்துவமனை வழி'
    },
    bystanderRoles: {
      compressorTitle: '1. மார்பு அழுத்தம் செய்பவர் (CPR)',
      compressorSubtitle: 'தொடர்ச்சியான மார்பு அழுத்தங்கள்',
      compressorInstruction:
        'மார்பின் மையத்தில் உள்ளங்கையின் அடிப்பகுதியை வைக்கவும். முழங்கைகளை நேராக வைத்திருந்து 5–6 செ.மீ ஆழத்திற்கு வேகமாக அழுத்தவும். 2 நிமிடங்களுக்கு ஒருமுறை மாறவும்.',
      callerTitle: '2. 112 அவசர அழைப்பாளர்',
      callerSubtitle: 'ஸ்பீக்கரில் 112 ஐ அழைக்கவும்',
      callerInstruction:
        'உடனே ஸ்பீக்கரில் 112 ஐ அழைத்து, திரையில் உள்ள GPS இடத்தைக் கூறி CPR நடைபெறுவதைத் தெரிவிக்கவும்.',
      aedTitle: '3. AED & முதலுதவி பெட்டி உதவியாளர்',
      aedSubtitle: 'AED கருவியை எடுத்து வாருங்கள்',
      aedInstruction:
        'அருகிலுள்ள வரவேற்பறை அல்லது மருத்துவ அறையிலிருந்து AED கருவி மற்றும் முதலுதவி பெட்டியை உடனே எடுத்து வரவும்.',
      flaggerTitle: '4. ஆம்புலன்ஸ் வாயில் வழிகாட்டி',
      flaggerSubtitle: 'பிரதான வாயிலை தயார் நிலையில் வைக்கவும்',
      flaggerInstruction:
        'பிரதான வாயிலில் நின்று 112 ஆம்புலன்ஸை நேரடியாக நோயாளியின் இடத்திற்கு வழிகாட்டி அழைத்து வரவும்.',
      marshalTitle: '5. கூட்டக் கட்டுப்பாடு & காற்றோட்ட உதவியாளர்',
      marshalSubtitle: '15 அடி இடைவெளியை உருவாக்கவும்',
      marshalInstruction:
        'நோயாளிக்கு நல்ல காற்றோட்டம் கிடைக்க சுற்றி நிற்பவர்களை 15 அடி பின்னால் நகர்த்தவும்.'
    },
    crowdAnnouncementSpeech:
      'அருகில் உள்ள அனைவரும் கவனிக்கவும்! இங்கே ஒரு மருத்துவ அவசர நிலை ஏற்பட்டுள்ளது. தயவுசெய்து உங்கள் தொலைபேசி கேமரா மூலம் இந்தத் திரையில் உள்ள QR குறியீட்டை ஸ்கேன் செய்து உடனடியாக மீட்புப் பணியை ஏற்றுக்கொள்ளுங்கள்!'
  },

  mr: {
    languageBarLabel: 'आवाज आणि प्रोटोकॉल भाषा',
    whatsTheEmergency: 'कोणती आणीबाणीची परिस्थिती आहे?',
    rescueToolkit: 'बचाव टूलकिट',
    sosNoticePrefix: 'जर रुग्ण बेशुद्ध असेल किंवा श्वास घेत नसेल, तर ताबडतोब ',
    sosNoticeStrong: '112 SOS',
    sosNoticeSuffix: ' वर टॅप करा.',
    guardianWelcome:
      'नमस्कार! मी तुमचा संजीवनी AI प्रथमोपचार रक्षक आहे, AHA 2020 आणि AIIMS आपत्कालीन वैद्यकीय मार्गदर्शक तत्त्वांवर आधारित.',
    howThisWorks: 'हे कसे कार्य करते',
    hideDetails: 'तपशील लपवा',
    howThisWorksDetail:
      'कोणताही तातडीचा प्रथमोपचार प्रश्न विचारा, माइकने लक्षणे सांगा किंवा जखमेचा फोटो/व्हिडिओ जोडा. मी तात्काळ १-२-३ पायऱ्या, काय करू नये याची काळजी आणि जवळच्या रुग्णालयाचा मार्ग दाखवतो.',
    composerPlaceholder: 'आणीबाणीची परिस्थिती सांगा…',
    listeningTapToStop: 'ऐकत आहे… थांबण्यासाठी टॅप करा',
    readAloud: 'ऐका (मराठी)',
    stopReading: 'थांबा',
    focusMode: 'फोकस मोड',
    allSteps: 'सर्व पायऱ्या',
    offlineVerifiedBadge: 'ऑफलाइन प्रोटोकॉल · सत्यापित',
    loudspeakerLabel: 'लाऊडस्पीकर (मराठी)',
    stopLoudspeakerLabel: 'आवाज थांबवा',
    doneOfTotal: (done, total) => `${total} पैकी ${done} पूर्ण`,
    bystandersQrLabel: 'मदतनीस (QR)',
    paramedicQrLabel: 'पॅरामेडिक (QR)',
    libraryTitle: 'प्रथमोपचार लायब्ररी',
    libraryOfflineBadge: 'ऑफलाइन चालते · १०० प्रोटोकॉल · v2.4',
    askAiGuardian: 'AI रक्षकाला विचारा',
    searchProtocolsPlaceholder: '१०० प्रोटोकॉल शोधा (उदा. CPR, भाजणे, सर्पदंश)…',
    startHereLifeThreatening: 'येथून सुरू करा — जीव वाचवणारे आपत्कालीन प्रोटोकॉल',
    call112First: 'आधी 112 वर कॉल करा',
    call112NowIf: 'ताबडतोब 112 वर कॉल करा जर…',
    call112NowSubtitle:
      'खालीलपैकी कोणतीही लक्षणे दिसल्यास ताबडतोब रुग्णवाहिका (112) बोलावणे आवश्यक आहे:',
    doThisNow: 'आत्ताच हे करा (तातडीच्या पायऱ्या)',
    whatNotToDoHeading: 'काय अजिबात करू नये (महत्त्वाची काळजी)',
    listenInLanguage: 'मराठीत ऐका',
    stopVoiceGuide: 'आवाज बंद करा',
    allProtocolsBack: 'सर्व प्रोटोकॉल',
    scenarios: {
      cpr: 'CPR आणि बेशुद्ध अवस्था',
      bleeding: 'तीव्र रक्तस्राव थांबवणे',
      snakeBite: 'सर्पदंश आणि अँटी-व्हेनम',
      choking: 'घशात काहीतरी अडकणे (गुदमरणे)',
      burn: 'गंभीर भाजणे / गरम पाण्याने पोळणे',
      heatstroke: 'उष्माघात / हीटस्ट्रोक (104°F+)',
      fracture: 'हाड मोडणे / फ्रॅक्चर',
      anaphylaxis: 'तीव्र ऍलर्जी (एनाफिलेक्सिस)',
      hospitalRoute: 'जवळच्या रुग्णालयाचा मार्ग'
    },
    bystanderRoles: {
      compressorTitle: '१. छातीवर दाब देणारा (CPR लीड)',
      compressorSubtitle: 'सतत छातीवर दाब (CPR)',
      compressorInstruction:
        'तळहाताचा खालचा भाग छातीच्या मध्यभागी ठेवा. कोपरे सरळ ठेवा. ५ ते ६ सेमी खोल आणि वेगाने दाबा. दर २ मिनिटांनी मदतनीस बदला.',
      callerTitle: '२. 112 आपत्कालीन कॉलर',
      callerSubtitle: 'स्पीकरफोनवर 112 डायल करा',
      callerInstruction:
        'ताबडतोब स्पीकरफोनवर 112 ला कॉल करा. स्क्रीनवरील अचूक GPS पत्ता सांगा आणि रुग्णाला CPR दिला जात असल्याचे कळवा.',
      aedTitle: '३. AED आणि प्रथमोपचार किट धावपटू',
      aedSubtitle: 'डिफिब्रिलेटर आणि मेडिकल बॉक्स आणा',
      aedInstruction:
        'जवळच्या रिसेप्शन, सुरक्षा कक्ष किंवा वैद्यकीय खोलीतून ताबडतोब AED मशीन आणि प्रथमोपचार पेटी घेऊन या.',
      flaggerTitle: '४. रुग्णवाहिका गेट मार्गदर्शक',
      flaggerSubtitle: 'मुख्य प्रवेशद्वार मोकळे ठेवा',
      flaggerInstruction:
        'फोनची फ्लॅशलाईट चालू करून मुख्य गेटवर उभे रहा आणि येणाऱ्या 112 रुग्णवाहिकेला थेट रुग्णापर्यंत मार्ग दाखवा.',
      marshalTitle: '५. गर्दी आणि मोकळी हवा नियंत्रक',
      marshalSubtitle: '१५ फुटांचे मोकळे वर्तुळ ठेवा',
      marshalInstruction:
        'रुग्णाला ताजी हवा मिळण्यासाठी आणि बचाव कार्यासाठी बघ्यांची गर्दी १५ फूट मागे हटवा.'
    },
    crowdAnnouncementSpeech:
      'कृपया लक्ष द्या! येथे एक गंभीर वैद्यकीय आणीबाणी आहे. कृपया गर्दी करू नका, तुमच्या फोन कॅमेऱ्याने या स्क्रीनवरील क्यूआर कोड स्कॅन करा आणि ताबडतोब बचावाची जबाबदारी घ्या!'
  }
};

/* ==========================================================================
 * 2. LOCALIZED PINNED EMERGENCY PROTOCOLS (LIBRARY & DOCUMENT VIEW)
 * ========================================================================== */

export interface LocalizedProtocolOverride {
  shortTitle: string;
  subtitle: string;
  fullDescription: string;
  redFlags: string[];
  steps: { title: string; text: string }[];
  donts: string[];
}

export const LOCALIZED_PINNED_PROTOCOLS: Record<
  SupportedLanguageCode,
  Record<string, LocalizedProtocolOverride>
> = {
  en: {},
  hi: {
    'cardiac-arrest-aed': {
      shortTitle: 'हृदय गति रुकना (Cardiac Arrest & AED)',
      subtitle: 'बेहोश · सांस नहीं चल रही · तुरंत CPR शुरू करें',
      fullDescription:
        'जब कोई व्यक्ति अचानक गिर जाए, हिलाने पर कोई प्रतिक्रिया न दे और सामान्य सांस न ले रहा हो। हर सेकंड कीमती है—तुरंत छाती पर दबाव (CPR) शुरू करें।',
      redFlags: [
        'व्यक्ति आवाज देने या कंधे थपथपाने पर कोई प्रतिक्रिया नहीं दे रहा है।',
        'बिल्कुल सांस नहीं ले रहा है या केवल रुक-रुक कर हांफ (Agonal gasping) रहा है।'
      ],
      steps: [
        {
          title: 'प्रतिक्रिया और सांस जांचें (5 सेकंड)',
          text: 'दोनों कंधों को जोर से थपथपाएं और पूछें "क्या आप ठीक हैं?" छाती को 5 सेकंड तक देखें कि सामान्य सांस चल रही है या नहीं।'
        },
        {
          title: '112 पर कॉल करें और AED मंगाएं',
          text: 'स्पीकरफोन पर तुरंत 112 मिलाएं। पास खड़े किसी व्यक्ति को तुरंत AED मशीन लाने के लिए भेजें।'
        },
        {
          title: 'छाती के बीच में लगातार दबाव दें (CPR)',
          text: 'छाती के बीचों-बीच एक हाथ की हथेली रखें, दूसरा हाथ ऊपर लॉक करें। कोहनियां सीधी रखते हुए 5–6 सेमी गहरा और तेज़ दबाएं। हर बार छाती को पूरा ऊपर आने दें।'
        },
        {
          title: 'AED आते ही चालू करें',
          text: 'AED मशीन खोलें, चित्र के अनुसार खुली छाती पर पैड चिपकाएं और मशीन के आवाज निर्देशों का पालन करें।'
        }
      ],
      donts: [
        'जब AED हृदय की जांच कर रहा हो या झटका (Shock) दे रहा हो, तब मरीज को बिल्कुल न छुएं।',
        'बेहोश व्यक्ति को पानी या कोई दवा पिलाने की कोशिश न करें।'
      ]
    },
    'child-choking': {
      shortTitle: 'गले में कुछ अटकना (Choking Airway)',
      subtitle: 'बोल, खांस या सांस नहीं पा रहा है',
      fullDescription:
        'भोजन या किसी छोटी वस्तु से श्वास नली पूरी तरह बंद हो जाना। तुरंत 5 पीठ पर थपकी और 5 पेट पर दबाव (Heimlich) दें।',
      redFlags: [
        'व्यक्ति बोल या आवाज नहीं निकाल पा रहा है और दोनों हाथों से गला पकड़ रहा है।',
        'होंठ या चेहरा नीला पड़ रहा है।'
      ],
      steps: [
        {
          title: 'कमर से आगे झुकाएं और 5 बार पीठ पर वार करें',
          text: 'व्यक्ति को आगे की ओर झुकाएं और दोनों कंधों के बीच (पीठ के ऊपरी हिस्से) में हथेली के निचले हिस्से से 5 बार जोर से थपकी दें।'
        },
        {
          title: '5 बार पेट के ऊपरी हिस्से में अंदर-ऊपर दबाव दें',
          text: 'पीछे खड़े होकर नाभि से ठीक ऊपर मुट्ठी रखें, दूसरे हाथ से पकड़ें और अंदर व ऊपर की ओर 5 तेज़ झटके (Abdominal thrusts) दें।'
        },
        {
          title: 'वस्तु निकलने तक 5-और-5 दोहराएं',
          text: 'जब तक अटकी हुई चीज बाहर न आ जाए या व्यक्ति सांस न लेने लगे, 5 पीठ की थपकी और 5 पेट के दबाव दोहराते रहें।'
        }
      ],
      donts: [
        'बिना दिखे मुंह के अंदर उंगली डालकर निकालने की कोशिश न करें (वस्तु और गहराई में फंस सकती है)।',
        'यदि व्यक्ति जोर-जोर से खांस पा रहा है, तो उसे लगातार खांसने दें।'
      ]
    },
    amputation: {
      shortTitle: 'तीव्र रक्तस्राव और गहरा घाव (Severe Bleeding)',
      subtitle: 'सीधा दबाव · कटे अंग को सुरक्षित रखें',
      fullDescription:
        'गंभीर घाव या धमनी से तेजी से निकलता खून। साफ कपड़े से सीधा और लगातार दबाव बनाकर खून रोकें।',
      redFlags: [
        'घाव से खून फव्वारे की तरह या बहुत तेजी से बह रहा है।',
        'मरीज पीला पड़ रहा है, चक्कर आ रहे हैं या हाथ-पैर ठंडे हो रहे हैं।'
      ],
      steps: [
        {
          title: '112 पर कॉल करें और घाव पर सीधा दबाव डालें',
          text: 'साफ कपड़ा या गॉज पैड घाव पर रखें और दोनों हाथों से पूरी ताकत से लगातार दबाकर रखें।'
        },
        {
          title: 'कपड़ा भीगने पर उसे हटाएं नहीं',
          text: 'यदि खून कपड़े से बाहर आ जाए, तो पुराना कपड़ा कभी न हटाएं—उसके ऊपर नया कपड़ा रखकर दबाव बनाए रखें।'
        },
        {
          title: 'कटे हुए अंग को सुरक्षित रखें (यदि लागू हो)',
          text: 'कटे हुए हिस्से को साफ नम कपड़े में लपेटें, सीलबंद प्लास्टिक बैग में रखें और उस बैग को बर्फ के पानी वाले बर्तन में रखें।'
        }
      ],
      donts: [
        'घाव में धंसे हुए कांच या किसी नुकीली वस्तु को बाहर न खींचें।',
        'कटे हुए अंग को सीधे बर्फ के संपर्क में न रखें।'
      ]
    },
    'suspected-stroke-fast': {
      shortTitle: 'लकवा / ब्रेन स्ट्रोक (FAST Signs)',
      subtitle: 'चेहरा टेढ़ा होना · हाथ में कमजोरी · आवाज लड़खड़ाना',
      fullDescription:
        'मस्तिष्क में रक्त प्रवाह रुकने या नस फटने की आपात स्थिति। FAST परीक्षण करें और तुरंत स्ट्रोक-रेडी अस्पताल ले जाएं।',
      redFlags: [
        'मुस्कुराने पर एक तरफ का चेहरा लटकता है (Face Droop)।',
        'एक हाथ ऊपर उठाने पर नीचे गिर जाता है या बोली लड़खड़ाती है।'
      ],
      steps: [
        {
          title: 'FAST जांच करें (चेहरा, हाथ, बोली, समय)',
          text: 'मुस्कुराने को कहें, दोनों हाथ ऊपर उठाने को कहें, और एक सरल वाक्य बोलने को कहें।'
        },
        {
          title: 'लक्षण शुरू होने का सटीक समय नोट करें',
          text: '112 पर कॉल करें और डॉक्टर के लिए वह सटीक समय लिख लें जब मरीज को आखिरी बार सामान्य देखा गया था।'
        },
        {
          title: 'मरीज को करवट (Recovery Position) में लिटाएं',
          text: 'सिर और कंधों को थोड़ा सहारा देकर लिटाएं और कपड़े ढीले कर दें।'
        }
      ],
      donts: [
        'स्ट्रोक के संदिग्ध मरीज को एस्पिरिन (Aspirin), पानी या भोजन बिल्कुल न दें।',
        'लक्षण अपने आप ठीक होने का इंतजार न करें।'
      ]
    },
    'anaphylaxis-full': {
      shortTitle: 'गंभीर एलर्जी रिएक्शन (Anaphylaxis)',
      subtitle: 'गले में सूजन · सांस फूलना · एपिनेफ्रिन',
      fullDescription:
        'भोजन, दवा या कीड़े के डंक से होने वाली जानलेवा एलर्जी जिसमें श्वास नली सूज जाती है।',
      redFlags: [
        'गले या जीभ में तेजी से सूजन, आवाज बैठना या सांस लेने में घरघराहट।',
        'पूरे शरीर पर लाल चकत्ते और चक्कर आकर गिरना।'
      ],
      steps: [
        {
          title: 'तुरंत 112 पर कॉल करें',
          text: 'आपातकालीन डिस्पैच को बताएं कि मरीज को गंभीर एनाफिलेक्सिस एलर्जी अटैक हुआ है।'
        },
        {
          title: 'एपिनेफ्रिन ऑटो-इंजेक्टर (EpiPen) लगाएं',
          text: 'यदि मरीज के पास एपिनेफ्रिन इंजेक्टर है, तो उसे जांघ के बाहरी हिस्से में 90 डिग्री पर दबाकर 3–10 सेकंड तक रखें।'
        },
        {
          title: 'पैरों को ऊपर उठाकर लिटाएं',
          text: 'मरीज को पीठ के बल लिटाएं और पैर ऊपर उठाएं (यदि सांस लेने में तकलीफ हो तो आरामदायक स्थिति में बिठाएं)।'
        }
      ],
      donts: [
        'केवल एंटीहिस्टामाइन गोली के भरोसे एपिनेफ्रिन या अस्पताल में देरी न करें।',
        'चक्कर आने वाले मरीज को अचानक खड़ा न करें।'
      ]
    },
    'first-time-seizure': {
      shortTitle: 'मिर्गी या दौरा पड़ना (Seizure)',
      subtitle: 'सिर को चोट से बचाएं · मुंह में कुछ न डालें',
      fullDescription:
        'अचानक शरीर में झटके आना और बेहोशी। सिर को सुरक्षित रखें और दौरा रुकने के बाद करवट से लिटाएं।',
      redFlags: [
        'दौरा 5 मिनट से अधिक समय तक चलता रहे या एक के बाद एक दूसरा दौरा पड़े।',
        'दौरा रुकने के बाद भी सांस सामान्य न हो।'
      ],
      steps: [
        {
          title: 'आसपास से सख्त और नुकीली चीजें हटाएं',
          text: 'सिर के नीचे कोई मुड़ा हुआ कपड़ा या जैकेट रखें और चश्मा उतार दें। घड़ी में दौरे का समय देखें।'
        },
        {
          title: 'झटके रुकने पर बाईं करवट (Recovery Position) में लिटाएं',
          text: 'जब शरीर के झटके बंद हो जाएं, तो मरीज को धीरे से एक करवट पर लिटाएं ताकि लार या उल्टी सांस की नली में न जाए।'
        },
        {
          title: 'पूरा होश आने तक साथ रहें',
          text: 'मरीज के पूरी तरह सचेत होने तक शांत स्वर में आश्वस्त करते रहें।'
        }
      ],
      donts: [
        'मुंह में चम्मच, चाबी, कपड़ा या उंगली कभी न डालें और न ही हाथ में लोहे की चाबी पकड़ाएं।',
        'झटके आते समय मरीज को जबरदस्ती पकड़कर रोकने की कोशिश न करें।'
      ]
    },
    drowning: {
      shortTitle: 'डूबने की आपात स्थिति (Drowning)',
      subtitle: 'सुरक्षित बाहर निकालें · बचाव सांस और CPR',
      fullDescription:
        'पानी से निकाले गए व्यक्ति में ऑक्सीजन की कमी को तुरंत दूर करना सबसे पहली प्राथमिकता है।',
      redFlags: [
        'पानी से निकालने के बाद व्यक्ति बेहोश है या सांस नहीं ले रहा है।',
        'होंठ नीले हैं या मुंह से झाग आ रहा है।'
      ],
      steps: [
        {
          title: 'खुद को सुरक्षित रखते हुए पानी से बाहर निकालें',
          text: 'रस्सी, डंडे या तैरने वाली वस्तु की मदद से पीड़ित को बाहर निकालें और समतल जगह पर पीठ के बल लिटाएं।'
        },
        {
          title: 'सांस न चलने पर तुरंत CPR शुरू करें',
          text: '112 पर कॉल करें। सिर हल्का पीछे झुकाकर श्वास मार्ग खोलें और छाती के बीच में लगातार दबाव (30 दबाव : 2 सांस) दें।'
        },
        {
          title: 'गीले कपड़े हटाएं और शरीर गर्म रखें',
          text: 'हाइपोथर्मिया से बचाने के लिए सूखे कंबल या तौलिए से ढकें।'
        }
      ],
      donts: [
        'पेट दबाकर फेफड़ों से पानी निकालने की कोशिश में समय बर्बाद न करें—तुरंत CPR शुरू करें।'
      ]
    },
    'snake-bite': {
      shortTitle: 'सांप का काटना (Venomous Snake Bite)',
      subtitle: 'बिल्कुल स्थिर रखें · चीरा या कसकर पट्टी न बांधें',
      fullDescription:
        'भारत में किसी भी सांप के काटने को आपातकालीन मानें। मरीज को शांत और स्थिर रखकर तुरंत एंटी-स्नेक वेनम (ASV) वाले सरकारी/आपातकालीन अस्पताल पहुंचाएं।',
      redFlags: [
        'काटने की जगह पर तेज दर्द, सूजन, पलकें भारी होना, धुंधला दिखना या सांस लेने में कठिनाई।'
      ],
      steps: [
        {
          title: '112 पर कॉल करें और मरीज को बिल्कुल स्थिर रखें',
          text: 'मरीज को चलने या हिलने न दें—मांसपेशियों के हिलने से जहर शरीर में तेजी से फैलता है।'
        },
        {
          title: 'अंगूठी, घड़ी और तंग कपड़े तुरंत उतार दें',
          text: 'सूजन बढ़ने से पहले प्रभावित हाथ या पैर से सभी आभूषण और तंग कपड़े हटा दें।'
        },
        {
          title: 'अंग को लकड़ी/स्प्लिंट से सहारा देकर दिल के स्तर से नीचे रखें',
          text: 'प्रभावित हाथ या पैर को सीधा और स्थिर रखें तथा तुरंत नजदीकी ASV अस्पताल ले जाएं।'
        }
      ],
      donts: [
        'घाव पर ब्लेड से चीरा न लगाएं, मुंह से जहर न चूसें और कसकर रस्सी/टूर्निकेट बिल्कुल न बांधें।',
        'झाड़-फूंक या जड़ी-बूटी में कीमती समय नष्ट न करें।'
      ]
    }
  },

  bn: {
    'cardiac-arrest-aed': {
      shortTitle: 'হৃদস্পন্দন বন্ধ হওয়া (Cardiac Arrest & AED)',
      subtitle: 'অজ্ঞান · শ্বাস নিচ্ছে না · অবিলম্বে CPR শুরু করুন',
      fullDescription:
        'যখন কেউ হঠাৎ পড়ে যান, ডাকে সাড়া না দেন এবং স্বাভাবিকভাবে শ্বাস না নেন। প্রতিটি সেকেন্ড মূল্যবান—অবিলম্বে বুকে চাপ (CPR) শুরু করুন।',
      redFlags: [
        'কাঁধে ধাক্কা দিলে বা ডাকলে কোনো সাড়া দিচ্ছেন না।',
        'শ্বাস নিচ্ছেন না বা কেবল থেমে থেমে হাঁপাচ্ছেন।'
      ],
      steps: [
        {
          title: 'সাড়া এবং শ্বাস পরীক্ষা করুন (৫ সেকেন্ড)',
          text: 'দুই কাঁধে জোরে চাপড় দিন এবং জিজ্ঞাসা করুন "আপনি কি ঠিক আছেন?" ৫ সেকেন্ড বুকের ওঠানামা দেখুন।'
        },
        {
          title: '112-এ কল করুন এবং AED আনতে বলুন',
          text: 'স্পিকারফোনে 112 ডায়াল করুন। পাশের কাউকে দ্রুত AED ডিফিব্রিলেটর আনতে পাঠান।'
        },
        {
          title: 'বুকের মাঝখানে নিরবচ্ছিন্ন চাপ দিন (CPR)',
          text: 'বুকের ঠিক মাঝখানে এক হাতের তালুর নিচের অংশ রাখুন, অন্য হাত উপরে লক করুন। কনুই সোজা রেখে ৫–৬ সেমি গভীরে দ্রুত চাপ দিন।'
        },
        {
          title: 'AED পৌঁছানো মাত্র চালু করুন',
          text: 'AED চালু করে ছবির মতো খালি বুকে প্যাড লাগান এবং ভয়েস নির্দেশাবলী অনুসরণ করুন।'
        }
      ],
      donts: [
        'AED বিশ্লেষণ করার সময় বা শক দেওয়ার সময় রোগীকে স্পর্শ করবেন না।',
        'অজ্ঞান ব্যক্তিকে জল বা ওষুধ খাওয়ানোর চেষ্টা করবেন না।'
      ]
    },
    'child-choking': {
      shortTitle: 'গলায় কিছু আটকে যাওয়া (Choking Airway)',
      subtitle: 'কথা বলতে, কাশতে বা শ্বাস নিতে পারছে না',
      fullDescription:
        'খাবার বা ছোট বস্তুর কারণে শ্বাসনালী সম্পূর্ণ বন্ধ হয়ে যাওয়া। অবিলম্বে ৫ বার পিঠে চাপড় এবং ৫ বার পেটে চাপ দিন।',
      redFlags: [
        'রোগী কোনো শব্দ করতে পারছেন না এবং দুই হাতে গলা ধরে আছেন।',
        'ঠোঁট বা মুখ নীল হয়ে যাচ্ছে।'
      ],
      steps: [
        {
          title: 'সামনে ঝুঁকিয়ে পিঠে ৫ বার জোরে চাপড় দিন',
          text: 'রোগীকে কোমর থেকে সামনে ঝুঁকিয়ে দুই কাঁধের মাঝখানে হাতের তালুর গোড়া দিয়ে ৫ বার জোরে আঘাত করুন।'
        },
        {
          title: 'পেটের উপরিভাগে ৫ বার ভেতরে ও উপরে চাপ দিন',
          text: 'পিছনে দাঁড়িয়ে নাভির ঠিক উপরে মুষ্টি রাখুন এবং অন্য হাত দিয়ে ধরে ভেতরে ও উপরের দিকে ৫ বার জোরে টান দিন।'
        },
        {
          title: 'বস্তুটি বের না হওয়া পর্যন্ত ৫-এবং-৫ চালিয়ে যান',
          text: 'শ্বাসনালী পরিষ্কার না হওয়া পর্যন্ত পিঠে ৫ বার চাপড় ও পেটে ৫ বার চাপ পর্যায়ক্রমে চালিয়ে যান।'
        }
      ],
      donts: [
        'না দেখে মুখের ভেতরে আঙুল ঢুকিয়ে বস্তু বের করার চেষ্টা করবেন না।'
      ]
    },
    'snake-bite': {
      shortTitle: 'বিষাক্ত সাপের কামড় (Snake Bite)',
      subtitle: 'সম্পূর্ণ স্থির রাখুন · কাটবেন না বা শক্ত বাঁধন দেবেন না',
      fullDescription:
        'সাপের কামড়ের পর রোগীকে শান্ত ও সম্পূর্ণ স্থির রেখে দ্রুত নিকটস্থ অ্যান্টি-স্নেক ভেনম (ASV) হাসপাতালে নিয়ে যান।',
      redFlags: [
        'কামড়ের স্থানে তীব্র ব্যথা, ফোলা, চোখের পাতা ভারী হওয়া বা শ্বাসকষ্ট।'
      ],
      steps: [
        {
          title: '112-এ কল করুন এবং রোগীকে সম্পূর্ণ স্থির রাখুন',
          text: 'রোগীকে হাঁটতে দেবেন না—নড়াচড়া করলে বিষ দ্রুত শরীরে ছড়িয়ে পড়ে।'
        },
        {
          title: 'আংটি, ঘড়ি ও আঁটসাঁট পোশাক খুলে ফেলুন',
          text: 'ফুলে যাওয়ার আগেই আক্রান্ত হাত বা পা থেকে গয়না ও আঁটসাঁট কাপড় সরিয়ে দিন।'
        },
        {
          title: 'আক্রান্ত অঙ্গটি স্প্লিন্ট দিয়ে স্থির রেখে হাসপাতালে নিন',
          text: 'হাত বা পা হৃদপিণ্ডের স্তরের নিচে স্থির রেখে দ্রুত ASV হাসপাতালে নিয়ে যান।'
        }
      ],
      donts: [
        'ক্ষতস্থানে ব্লেড দিয়ে কাটবেন না, মুখ দিয়ে বিষ চুষবেন না বা শক্ত করে দড়ি বাঁধবেন না।',
        'ওঝা বা ঝাড়ফুঁকে সময় নষ্ট করবেন না।'
      ]
    }
  },

  ta: {
    'cardiac-arrest-aed': {
      shortTitle: 'இதயத் துடிப்பு நிற்றல் (Cardiac Arrest & AED)',
      subtitle: 'மயக்கம் · மூச்சு இல்லை · உடனே CPR தொடங்கவும்',
      fullDescription:
        'ஒருவர் திடீரென மயங்கி விழுந்து, அழைத்தும் எதிர்வினையாற்றாமல், சாதாரணமாக மூச்சு விடாமல் இருந்தால் உடனடியாக மார்பு அழுத்தம் (CPR) தொடங்கவும்.',
      redFlags: [
        'தோள்களைத் தட்டி அழைத்தும் எந்த பதிலும் இல்லை.',
        'மூச்சு விடவில்லை அல்லது திணறி மூச்சு விடுகிறார்.'
      ],
      steps: [
        {
          title: 'உணர்வு மற்றும் மூச்சைச் சரிபார்க்கவும் (5 விநாடிகள்)',
          text: 'இரு தோள்களையும் தட்டி "நீங்கள் நலமாக இருக்கிறீர்களா?" என்று சத்தமாகக் கேளுங்கள். மார்பு அசைகிறதா என்று 5 விநாடிகள் பார்க்கவும்.'
        },
        {
          title: '112 ஐ அழைத்து AED கருவியைக் கொண்டு வரச் சொல்லுங்கள்',
          text: 'ஸ்பீக்கரில் 112 ஐ அழைக்கவும். அருகில் உள்ளவரை AED கருவியை எடுத்து வரச் சொல்லுங்கள்.'
        },
        {
          title: 'மார்பின் மையத்தில் தொடர்ந்து அழுத்தவும் (CPR)',
          text: 'மார்பின் நடுவே ஒரு உள்ளங்கையை வைத்து மற்றொரு கையை கோர்த்துக்கொள்ளவும். முழங்கைகளை நேராக வைத்து 5–6 செ.மீ ஆழத்திற்கு வேகமாக அழுத்தவும்.'
        },
        {
          title: 'AED வந்தவுடன் பொருத்தி குரல் கட்டளைகளைப் பின்பற்றவும்',
          text: 'AED கருவியை இயக்கி, மார்பில் பேட்களை ஒட்டி அதன் குரல் வழிகாட்டுதலைப் பின்பற்றவும்.'
        }
      ],
      donts: [
        'AED இதயத்தை ஆய்வு செய்யும்போதும் ஷாக் கொடுக்கும்போதும் நோயாளியைத் தொடாதீர்கள்.',
        'மயக்கத்தில் உள்ளவருக்கு தண்ணீர் அல்லது உணவு கொடுக்க வேண்டாம்.'
      ]
    },
    'child-choking': {
      shortTitle: 'தொண்டையில் அடைப்பு (Choking Airway)',
      subtitle: 'பேச, இரும அல்லது மூச்சு விட முடியவில்லை',
      fullDescription:
        'உணவு அல்லது சிறிய பொருள் மூச்சுக்குழாயை அடைத்தால் உடனடியாக முதுகில் 5 தட்டுகள் மற்றும் வயிற்றில் 5 அழுத்தங்கள் கொடுக்கவும்.',
      redFlags: [
        'பேசவோ சத்தம் எழுப்பவோ முடியாமல் தொண்டையைப் பிடித்துக் கொள்கிறார்.',
        'உதடுகள் நீல நிறமாக மாறுகின்றன.'
      ],
      steps: [
        {
          title: 'முன்னால் குனிய வைத்து முதுகில் 5 முறை தட்டவும்',
          text: 'இடுப்பிலிருந்து முன்னால் குனிய வைத்து தோள்பட்டைகளுக்கு நடுவே உள்ளங்கையின் அடிப்பகுதியால் 5 முறை பலமாகத் தட்டவும்.'
        },
        {
          title: 'வயிற்றின் மேல் பகுதியில் 5 முறை உள்நோக்கி மேல்நோக்கி அழுத்தவும்',
          text: 'பின்னால் நின்று தொப்புளுக்கு சற்று மேலே கைமுட்டியை வைத்து 5 முறை வேகமாக உள்நோக்கியும் மேல்நோக்கியும் அழுத்தவும்.'
        },
        {
          title: 'அடைப்பு நீங்கும் வரை 5-மற்றும்-5 தொடரவும்',
          text: 'பொருள் வெளியேறும் வரை 5 முதுகுத் தட்டுகள் மற்றும் 5 வயிற்று அழுத்தங்களை மாறி மாறிச் செய்யவும்.'
        }
      ],
      donts: [
        'கண்ணுக்குத் தெரியாத பொருளை விரலை விட்டு எடுக்க முயற்சிக்காதீர்கள்.'
      ]
    },
    'snake-bite': {
      shortTitle: 'பாம்பு கடி (Venomous Snake Bite)',
      subtitle: 'அசையாமல் வைத்திருக்கவும் · கீறவோ இறுக்கி கட்டவோ வேண்டாம்',
      fullDescription:
        'பாம்பு கடித்தால் நோயாளியை பதற்றமின்றி அசையாமல் வைத்திருந்து உடனடியாக விஷ முறிவு மருந்து (ASV) உள்ள மருத்துவமனைக்கு அழைத்துச் செல்லவும்.',
      redFlags: [
        'கடித்த இடத்தில் வீக்கம், கண் இமைகள் துவளுதல், பார்வை மங்குதல் அல்லது மூச்சுத்திணறல்.'
      ],
      steps: [
        {
          title: '112 ஐ அழைத்து நோயாளியை அசையாமல் இருக்கச் செய்யவும்',
          text: 'நடக்க விடாதீர்கள்—உடல் அசைவு விஷத்தை வேகமாகப் பரப்பும்.'
        },
        {
          title: 'மோதிரம், கடிகாரம் மற்றும் இறுக்கமான ஆடைகளை அகற்றவும்',
          text: 'வீக்கம் ஏற்படுவதற்கு முன்பே நகைகள் மற்றும் இறுக்கமான உடைகளை கழற்றி விடவும்.'
        },
        {
          title: 'கடித்த உறுப்பை அசையாமல் தாங்கிப் பிடித்து மருத்துவமனைக்கு கொண்டு செல்லவும்',
          text: 'கை அல்லது காலை இதய மட்டத்திற்கு கீழே நேராக வைத்திருந்து உடனே ASV மருத்துவமனைக்கு கொண்டு செல்லவும்.'
        }
      ],
      donts: [
        'காயத்தை பிளேடால் கீறவோ, வாயால் விஷத்தை உறிஞ்சவோ, கயிற்றால் இறுக்கிக் கட்டவோ கூடாது.'
      ]
    }
  },

  mr: {
    'cardiac-arrest-aed': {
      shortTitle: 'हृदयस्पंदन थांबणे (Cardiac Arrest & AED)',
      subtitle: 'बेशुद्ध · श्वास बंद · ताबडतोब CPR सुरू करा',
      fullDescription:
        'जेव्हा एखादी व्यक्ती अचानक कोसळते, हाक मारूनही प्रतिसाद देत नाही आणि सामान्य श्वास घेत नाही, तेव्हा प्रत्येक सेकंद महत्त्वाचा असतो—ताबडतोब छातीवर दाब (CPR) सुरू करा.',
      redFlags: [
        'खांद्यावर थाप मारून किंवा आवाज देऊनही कोणताही प्रतिसाद नाही.',
        'श्वास पूर्णपणे बंद आहे किंवा फक्त अधूनमधून धाप लागत आहे.'
      ],
      steps: [
        {
          title: 'प्रतिसाद आणि श्वास तपासा (५ सेकंद)',
          text: 'दोन्ही खांद्यांवर जोरात थाप मारा आणि मोठा आवाज देऊन विचारा "तुम्ही ठीक आहात का?" छातीची हालचाल ५ सेकंद तपासा.'
        },
        {
          title: '112 वर कॉल करा आणि AED मागवा',
          text: 'स्पीकरफोनवर ताबडतोब 112 डायल करा. जवळच्या व्यक्तीला AED मशीन आणायला सांगा.'
        },
        {
          title: 'छातीच्या मध्यभागी सतत दाब द्या (CPR)',
          text: 'छातीच्या मध्यभागी एका हाताचा तळवा ठेवा, दुसरा हात त्यावर गुंफा. कोपरे सरळ ठेवून ५–६ सेमी खोल आणि वेगाने दाबा.'
        },
        {
          title: 'AED उपलब्ध होताच सुरू करा',
          text: 'AED मशीन चालू करा, चित्राप्रमाणे छातीवर पॅड लावा आणि आवाजाच्या सूचनांचे पालन करा.'
        }
      ],
      donts: [
        'AED हृदयाची तपासणी करत असताना किंवा शॉक देत असताना रुग्णाला स्पर्श करू नका.',
        'बेशुद्ध व्यक्तीला पाणी किंवा कोणतेही औषध पाजण्याचा प्रयत्न करू नका.'
      ]
    },
    'child-choking': {
      shortTitle: 'घशात काहीतरी अडकणे (Choking Airway)',
      subtitle: 'बोलू, खोकू किंवा श्वास घेऊ शकत नाही',
      fullDescription:
        'अन्न किंवा लहान वस्तूमुळे श्वासनलिका पूर्णपणे बंद झाल्यास ताबडतोब पाठीवर ५ थापा आणि पोटावर ५ दाब (Heimlich) द्या.',
      redFlags: [
        'रुग्ण बोलू शकत नाही आणि दोन्ही हातांनी गळा धरत आहे.',
        'ओठ किंवा चेहरा निळा पडत आहे.'
      ],
      steps: [
        {
          title: 'कमरेतून पुढे वाकवा आणि पाठीवर ५ वेळा जोरात थाप मारा',
          text: 'रुग्णाला पुढे वाकवून दोन्ही खांद्यांच्या मध्ये तळहाताच्या खालच्या भागाने ५ वेळा जोरात प्रहार करा.'
        },
        {
          title: 'पोटाच्या वरच्या भागावर आत आणि वरच्या दिशेने ५ दाब द्या',
          text: 'मागून उभे राहून बेंबीच्या थोडे वर मूठ ठेवा आणि दुसऱ्या हाताने धरून आत व वरच्या दिशेने ५ वेळा जोरात दाबा.'
        },
        {
          title: 'अडथळा निघेपर्यंत ५-आणि-५ सुरू ठेवा',
          text: 'अडकलेली वस्तू बाहेर पडेपर्यंत ५ पाठीवर थापा आणि ५ पोटावर दाब सुरू ठेवा.'
        }
      ],
      donts: [
        'दिसत नसलेली वस्तू तोंडात बोट घालून काढण्याचा प्रयत्न करू नका.'
      ]
    },
    'snake-bite': {
      shortTitle: 'विषारी सर्पदंश (Snake Bite)',
      subtitle: 'पूर्णपणे स्थिर ठेवा · कापू नका किंवा घट्ट बांधू नका',
      fullDescription:
        'कोणत्याही सर्पदंशानंतर रुग्णाला शांत आणि स्थिर ठेवून ताबडतोब अँटी-स्नेक व्हेनम (ASV) उपलब्ध असलेल्या रुग्णालयात न्या.',
      redFlags: [
        'चावलेल्या जागी तीव्र वेदना, सूज, पापण्या जड होणे किंवा श्वास घेण्यास त्रास.'
      ],
      steps: [
        {
          title: '112 वर कॉल करा आणि रुग्णाला पूर्णपणे स्थिर ठेवा',
          text: 'रुग्णाला चालू देऊ नका—हालचालीमुळे विष शरीरात वेगाने पसरते.'
        },
        {
          title: 'अंगठी, घड्याळ आणि घट्ट कपडे काढून टाका',
          text: 'सूज येण्यापूर्वी संबंधित हात किंवा पायावरील दागिने आणि घट्ट कपडे काढा.'
        },
        {
          title: 'अवयवाला आधार देऊन हृदयाच्या पातळीखाली ठेवा',
          text: 'हात किंवा पाय सरळ स्थिर ठेवून ताबडतोब जवळच्या ASV रुग्णालयात न्या.'
        }
      ],
      donts: [
        'जखमेवर ब्लेडने कापू नका, तोंडाने विष शोषू नका किंवा दोरीने घट्ट आवळून बांधू नका.',
        'मांत्रिक किंवा घरगुती उपायांमध्ये वेळ घालवू नका.'
      ]
    }
  }
};

/* ==========================================================================
 * 3. OFFLINE AI GUARDIAN PROTOCOL RESPONSES IN ALL 5 LANGUAGES
 * ========================================================================== */

export function getLocalizedOfflineProtocolMarkdown(
  protocolKey: string,
  lang: SupportedLanguageCode
): { title: string; markdown: string } | null {
  if (lang === 'en') return null;

  const dict: Record<SupportedLanguageCode, Record<string, { title: string; markdown: string }>> = {
    en: {},
    hi: {
      unconscious: {
        title: 'वयस्क CPR और बेहोशी प्रोटोकॉल (AHA 2020)',
        markdown: `- **Immediate Priority:** तुरंत प्रतिक्रिया की जांच करें, 112 पर कॉल करें और बिना रुके छाती पर दबाव (CPR) शुरू करें।

- **Immediate Action Steps:**
1. **प्रतिक्रिया और सांस जांचें:** दोनों कंधों को थपथपाएं और पूछें "क्या आप ठीक हैं?" 5 सेकंड तक छाती की सामान्य सांस देखें।
2. **112 पर कॉल करें और AED मंगाएं:** फोन को स्पीकर पर रखकर 112 मिलाएं और पास खड़े व्यक्ति को AED मशीन लाने भेजें।
3. **छाती के बीच में लगातार दबाव दें (CPR):** छाती के मध्य भाग में हथेली रखें, कोहनियां सीधी लॉक करें और 5 से 6 सेमी गहरा लगातार दबाएं।
4. **हर बार छाती को पूरा ऊपर आने दें:** दबाव के बीच छाती से हाथ का वजन हटाएं ताकि हृदय में रक्त भर सके।

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* बेहोश व्यक्ति को पानी, दवा या कोई तरल पदार्थ मुंह से बिल्कुल न दें।
* छाती दबाने में 10 सेकंड से अधिक का अंतराल न होने दें।

- **⚠️ Immediate 112 / Hospital Red Flags:**
* व्यक्ति कोई प्रतिक्रिया नहीं दे रहा है, सांस बंद है या केवल रुक-रुक कर हांफ (Agonal gasping) रहा है।`
      },
      bleeding: {
        title: 'तीव्र रक्तस्राव और घाव नियंत्रण (AIIMS Trauma)',
        markdown: `- **Immediate Priority:** साफ कपड़े से घाव पर सीधा और निरंतर दबाव बनाकर खून का बहना तुरंत रोकें।

- **Immediate Action Steps:**
1. **सीधा और मजबूत दबाव डालें:** साफ कपड़ा या गॉज सीधे घाव पर रखें और दोनों हाथों से लगातार दबाकर रखें।
2. **खून से भीगा कपड़ा कभी न हटाएं:** यदि कपड़ा खून से भीग जाए, तो उसे हटाने के बजाय उसके ऊपर दूसरा साफ कपड़ा रखकर दबाएं।
3. **सदमे (Shock) से बचाएं:** मरीज को सीधा लिटाएं और शरीर को गर्म रखने के लिए कंबल या चादर ओढ़ाएं।

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* घाव में धंसे हुए कांच, चाकू या किसी वस्तु को बाहर न खींचें।
* सांप के काटने पर कसकर रस्सी/टूर्निकेट न बांधें और न ही घाव को काटें।

- **⚠️ Immediate 112 / Hospital Red Flags:**
* खून तेजी से बह रहा है, चेहरा पीला पड़ रहा है या मरीज बेहोश हो रहा है।`
      },
      choking: {
        title: 'गले में अटकाव / दम घुटना (Choking First-Aid)',
        markdown: `- **Immediate Priority:** श्वास नली से रुकावट हटाने के लिए तुरंत 5 पीठ की थपकी और 5 पेट के दबाव दें।

- **Immediate Action Steps:**
1. **आगे झुकाकर 5 बार पीठ पर वार करें:** दोनों कंधों के बीच हथेली के निचले हिस्से से 5 बार जोर से थपकी दें।
2. **5 बार पेट के ऊपरी हिस्से में दबाव (Heimlich) दें:** नाभि के ठीक ऊपर मुट्ठी रखकर अंदर और ऊपर की ओर 5 तेज़ झटके दें।
3. **वस्तु निकलने तक दोहराएं:** जब तक वस्तु बाहर न निकले, 5 पीठ की थपकी और 5 पेट के दबाव जारी रखें।

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* बिना दिखे मुंह में उंगली डालकर वस्तु निकालने की कोशिश न करें।

- **⚠️ Immediate 112 / Hospital Red Flags:**
* व्यक्ति बोल या सांस नहीं ले पा रहा है, या होंठ नीले पड़ रहे हैं।`
      },
      burn: {
        title: 'गंभीर जलन और प्राथमिक उपचार (AHA & AIIMS)',
        markdown: `- **Immediate Priority:** जले हुए हिस्से को तुरंत 15 से 20 मिनट तक सामान्य बहते नल के पानी के नीचे ठंडा करें।

- **Immediate Action Steps:**
1. **15–20 मिनट बहता पानी डालें:** जले हुए स्थान को तुरंत धीमे बहते नल के पानी के नीचे रखें।
2. **अंगूठी, घड़ी और आभूषण उतारें:** सूजन आने से पहले जले हुए हिस्से के पास से गहने और तंग कपड़े धीरे से हटाएं।
3. **साफ पट्टी या क्लिंग फिल्म से ढकें:** छालों को फोड़े बिना साफ, न चिपकने वाली पट्टी से ढकें।

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* जले हुए घाव पर टूथपेस्ट, मक्खन, घी, हल्दी, तेल या बर्फ (Ice) कभी न लगाएं।
* त्वचा से चिपके हुए जले कपड़े को खींचकर न उखाड़ें।

- **⚠️ Immediate 112 / Hospital Red Flags:**
* चेहरे, गर्दन, हाथों या बड़े हिस्से पर जलन, या धुएं से सांस लेने में तकलीफ।`
      },
      fracture: {
        title: 'हड्डी टूटना / फ्रैक्चर स्थिरीकरण',
        markdown: `- **Immediate Priority:** चोटिल हाथ या पैर को जिस स्थिति में है उसी में स्थिर (Immobilize) रखें।

- **Immediate Action Steps:**
1. **अंग को हिलने न दें:** टूटे हुए हिस्से को दोनों तरफ से सहारा दें।
2. **स्प्लिंट या गद्देदार सहारा लगाएं:** गत्ते या लकड़ी की पट्टी को कपड़े में लपेटकर जोड़ के ऊपर और नीचे बांधें।
3. **कपड़े में लपेटकर बर्फ से सिकाई करें:** सूजन कम करने के लिए तौलिए में लपेटी बर्फ 15 मिनट लगाएं।

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* टूटी हुई या टेढ़ी हड्डी को खुद खींचकर सीधा करने की कोशिश कभी न करें।

- **⚠️ Immediate 112 / Hospital Red Flags:**
* हड्डी त्वचा से बाहर दिख रही हो, या उंगलियां नीली व सुन्न पड़ रही हों।`
      }
    },

    bn: {
      unconscious: {
        title: 'প্রাপ্তবয়স্ক CPR এবং অজ্ঞান রোগীর প্রোটोकল (AHA 2020)',
        markdown: `- **Immediate Priority:** অবিলম্বে সাড়া ও শ্বাস পরীক্ষা করুন, 112-এ কল করুন এবং বুকে চাপ (CPR) শুরু করুন।

- **Immediate Action Steps:**
1. **সাড়া ও শ্বাস পরীক্ষা করুন:** দুই কাঁধে চাপড় দিয়ে ডাকুন এবং ৫ সেকেন্ড বুকের ওঠানামা লক্ষ্য করুন।
2. **112-এ কল করুন ও AED আনতে বলুন:** স্পিকারফোনে 112-এ কল করুন এবং পাশের কাউকে AED আনতে পাঠান।
3. **বুকের মাঝখানে নিরবচ্ছিন্ন চাপ দিন (CPR):** বুকের ঠিক মাঝখানে হাতের তালু রেখে কনুই সোজা করে ৫–৬ সেমি গভীরে দ্রুত চাপ দিন।
4. **বুক পুরোপুরি উপরে উঠতে দিন:** প্রতিটি চাপের পর বুককে স্বাভাবিক অবস্থায় ফিরে আসতে দিন।

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* অজ্ঞান ব্যক্তিকে মুখে জল, খাবার বা ওষুধ দেবেন না।
* ১০ সেকেন্ডের বেশি বুকে চাপ দেওয়া বন্ধ রাখবেন না।

- **⚠️ Immediate 112 / Hospital Red Flags:**
* রোগী অজ্ঞান, শ্বাস নিচ্ছেন না বা কেবল থেমে থেমে হাঁপাচ্ছেন।`
      },
      bleeding: {
        title: 'তীব্র রক্তপাত ও ক্ষত নিয়ন্ত্রণ (AIIMS Trauma)',
        markdown: `- **Immediate Priority:** পরিষ্কার কাপড় দিয়ে ক্ষতস্থানে সরাসরি ও একটানা চাপ দিয়ে রক্তপাত বন্ধ করুন।

- **Immediate Action Steps:**
1. **সরাসরি শক্ত চাপ দিন:** পরিষ্কার কাপড় বা গজ ক্ষতস্থানে রেখে দুই হাত দিয়ে জোরে চেপে ধরুন।
2. **রক্তভেজা কাপড় সরাবেন না:** কাপড় ভিজে গেলে সেটি না তুলে তার উপরে আরেকটি কাপড় রেখে চাপ বজায় রাখুন।
3. **রোগীকে শুইয়ে উষ্ণ রাখুন:** শক প্রতিরোধে রোগীকে শুইয়ে কম্বল বা চাদর দিয়ে ঢেকে রাখুন।

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* ক্ষতস্থানে ঢুকে থাকা কাঁচ বা ধারালো বস্তু টেনে বের করবেন না।
* সাপের কামড়ে ক্ষতস্থান কাটবেন না বা শক্ত করে দড়ি বাঁধবেন না।

- **⚠️ Immediate 112 / Hospital Red Flags:**
* রক্ত ফিনকি দিয়ে বেরোলে বা রোগী ফ্যাকাশে ও নিস্তেজ হয়ে পড়লে।`
      },
      choking: {
        title: 'গলায় খাবার বা বস্তু আটকে যাওয়া (Choking)',
        markdown: `- **Immediate Priority:** শ্বাসনালী পরিষ্কার করতে অবিলম্বে ৫ বার পিঠে চাপড় এবং ৫ বার পেটে চাপ দিন।

- **Immediate Action Steps:**
1. **সামনে ঝুঁকিয়ে পিঠে ৫ বার চাপড় দিন:** দুই কাঁধের মাঝখানে হাতের তালুর গোড়া দিয়ে ৫ বার জোরে আঘাত করুন।
2. **পেটে ৫ বার ভেতরে ও উপরে চাপ দিন:** নাভির ঠিক উপরে মুষ্টি রেখে ভেতরে ও উপরের দিকে ৫ বার জোরে টান দিন।
3. **বস্তুটি বের না হওয়া পর্যন্ত চালিয়ে যান:** ৫ বার পিঠে চাপড় ও ৫ বার পেটে চাপ পর্যায়ক্রমে করুন।

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* না দেখে মুখের ভেতরে আঙুল ঢুকিয়ে বস্তু বের করার চেষ্টা করবেন না।

- **⚠️ Immediate 112 / Hospital Red Flags:**
* রোগী কথা বলতে বা শ্বাস নিতে না পারলে এবং ঠোঁট নীল হয়ে গেলে।`
      },
      burn: {
        title: 'গুরুতর পোড়া ও প্রাথমিক চিকিৎসা (AHA & AIIMS)',
        markdown: `- **Immediate Priority:** পোড়া স্থানটি অবিলম্বে ১৫ থেকে ২০ মিনিট সাধারণ কলের জলের নিচে ঠান্ডা করুন।

- **Immediate Action Steps:**
1. **১৫–২০ মিনিট কলের জল ঢালুন:** পোড়া জায়গায় মৃদু প্রবাহিত সাধারণ ঠান্ডা জল ঢালুন।
2. **আংটি ও ঘড়ি খুলে ফেলুন:** ফুলে যাওয়ার আগেই গয়না ও আঁটসাঁট কাপড় আলতো করে সরিয়ে দিন।
3. **পরিষ্কার জীবাণুমুক্ত ড্রেসিং দিয়ে ঢেকে দিন:** ফোসকা না ফাটিয়ে পরিষ্কার কাপড় বা ক্লিং ফিল্ম দিয়ে আলতো করে ঢাকুন।

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* পোড়া ঘায়ে টুথপেস্ট, মাখন, ঘি, হলুদ, তেল বা সরাসরি বরফ কখনও লাগাবেন না।

- **⚠️ Immediate 112 / Hospital Red Flags:**
* মুখ, গলা, হাত বা শরীরের বড় অংশ পুড়ে গেলে বা ধোঁয়ায় শ্বাসকষ্ট হলে।`
      },
      fracture: {
        title: 'হাড় ভাঙা / ফ্র্যাকচার স্থিরকরণ',
        markdown: `- **Immediate Priority:** আঘাতপ্রাপ্ত হাত বা পা যে অবস্থায় আছে সেভাবেই স্থির (Immobilize) রাখুন।

- **Immediate Action Steps:**
1. **অঙ্গটি নাড়াচাড়া করবেন না:** ভাঙা অংশের উপরে ও নিচে সাপোর্ট দিন।
2. **স্প্লিন্ট ব্যবহার করুন:** কাঠ বা শক্ত কার্ডবোর্ডে কাপড় জড়িয়ে আলতো করে বেঁধে দিন।
3. **কাপড়ে জড়ানো বরফ দিন:** ফোলা কমাতে তোয়ালেতে মুড়িয়ে ১৫ মিনিট বরফ দিন।

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* ভাঙা হাড় নিজে টেনে সোজা করার চেষ্টা করবেন না।

- **⚠️ Immediate 112 / Hospital Red Flags:**
* হাড় চামড়া ভেদ করে বেরিয়ে এলে বা আঙুল নীল ও অবশ হয়ে গেলে।`
      }
    },

    ta: {
      unconscious: {
        title: 'CPR மற்றும் மயக்க நிலை முதலுதவி (AHA 2020)',
        markdown: `- **Immediate Priority:** உடனடியாக உணர்வு மற்றும் மூச்சைச் சரிபார்த்து, 112 ஐ அழைத்து மார்பு அழுத்தம் (CPR) தொடங்கவும்.

- **Immediate Action Steps:**
1. **உணர்வு மற்றும் மூச்சைச் சரிபார்க்கவும்:** தோள்களைத் தட்டி அழைத்து 5 விநாடிகள் மார்பு அசைவைப் பார்க்கவும்.
2. **112 ஐ அழைத்து AED கொண்டு வரச் சொல்லவும்:** ஸ்பீக்கரில் 112 ஐ அழைத்து அருகில் உள்ளவரை AED எடுத்து வரச் சொல்லவும்.
3. **மார்பின் மையத்தில் தொடர்ந்து அழுத்தவும் (CPR):** மார்பின் நடுவே உள்ளங்கையை வைத்து முழங்கைகளை நேராகப் பூட்டி 5–6 செ.மீ ஆழத்திற்கு வேகமாக அழுத்தவும்.
4. **மார்பு முழுமையாக மேலே வர அனுமதிக்கவும்:** ஒவ்வொரு அழுத்தத்திற்குப் பிறகும் மார்பு பழைய நிலைக்கு வர விடவும்.

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* மயக்கத்தில் உள்ளவருக்கு வாய் வழியாக தண்ணீர் அல்லது மருந்து கொடுக்க வேண்டாம்.
* மார்பு அழுத்தத்தை 10 விநாடிகளுக்கு மேல் நிறுத்த வேண்டாம்.

- **⚠️ Immediate 112 / Hospital Red Flags:**
* நோயாளி சுயநினைவின்றி இருக்கிறார் அல்லது மூச்சு விடவில்லை.`
      },
      bleeding: {
        title: 'கடுமையான இரத்தப்போக்கு கட்டுப்பாடு (AIIMS Trauma)',
        markdown: `- **Immediate Priority:** சுத்தமான துணியால் காயத்தின் மீது நேரடியாகவும் தொடர்ச்சியாகவும் அழுத்தம் கொடுத்து இரத்தப்போக்கை நிறுத்தவும்.

- **Immediate Action Steps:**
1. **நேரடி அழுத்தம் கொடுக்கவும்:** சுத்தமான துணி அல்லது காஸ் பேடை காயத்தின் மீது வைத்து இரு கைகளாலும் அழுத்திப் பிடிக்கவும்.
2. **இரத்தம் நனைந்த துணியை அகற்ற வேண்டாம்:** துணி நனைந்தால் அதன் மேல் மற்றொரு புதிய துணியை வைத்து அழுத்தவும்.
3. **நோயாளியை படுக்க வைத்து கதகதப்பாக வைக்கவும்:** அதிர்ச்சியைத் (Shock) தடுக்க போர்வையால் போர்த்தவும்.

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* காயத்தில் குத்தியிருக்கும் கண்ணாடி அல்லது கூர்மையான பொருட்களை வெளியே இழுக்க வேண்டாம்.
* பாம்பு கடியில் காயத்தை கீறவோ இறுக்கிக் கட்டவோ வேண்டாம்.

- **⚠️ Immediate 112 / Hospital Red Flags:**
* இரத்தம் பீய்ச்சி அடித்தால் அல்லது நோயாளி மயக்கமடைந்தால்.`
      },
      choking: {
        title: 'தொண்டையில் அடைப்பு / மூச்சுத்திணறல் (Choking)',
        markdown: `- **Immediate Priority:** மூச்சுக்குழாய் அடைப்பை நீக்க உடனடியாக 5 முதுகுத் தட்டுகள் மற்றும் 5 வயிற்று அழுத்தங்கள் கொடுக்கவும்.

- **Immediate Action Steps:**
1. **முன்னால் குனிய வைத்து முதுகில் 5 முறை தட்டவும்:** இரு தோள்பட்டைகளுக்கு நடுவே உள்ளங்கையால் 5 முறை பலமாகத் தட்டவும்.
2. **வயிற்றின் மேல் பகுதியில் 5 முறை அழுத்தவும்:** தொப்புளுக்கு மேலே கைமுட்டியை வைத்து உள்நோக்கியும் மேல்நோக்கியும் 5 முறை அழுத்தவும்.
3. **பொருள் வெளியேறும் வரை தொடரவும்:** அடைப்பு நீங்கும் வரை 5-மற்றும்-5 முறையைத் தொடரவும்.

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* கண்ணுக்குத் தெரியாத பொருளை வாய்க்குள் விரல் விட்டு எடுக்க முயற்சிக்காதீர்கள்.

- **⚠️ Immediate 112 / Hospital Red Flags:**
* பேசவோ மூச்சு விடவோ முடியவில்லை அல்லது உதடுகள் நீல நிறமாக மாறுகின்றன.`
      },
      burn: {
        title: 'கடுமையான தீக்காயம் முதலுதவி (AHA & AIIMS)',
        markdown: `- **Immediate Priority:** தீக்காயம் பட்ட இடத்தை உடனடியாக 15 முதல் 20 நிமிடங்கள் ஓடும் சாதாரண குழாய் நீரில் குளிர்விக்கவும்.

- **Immediate Action Steps:**
1. **15–20 நிமிடங்கள் ஓடும் நீரை ஊற்றவும்:** காயத்தின் மீது மெதுவாக ஓடும் குளிர்ந்த குழாய் நீரைப் பாய்ச்சவும்.
2. **மோதிரம் மற்றும் கடிகாரத்தை அகற்றவும்:** வீக்கம் வருவதற்கு முன்பே நகைகளை மெதுவாகக் கழற்றவும்.
3. **சுத்தமான துணியால் தளர்வாக மூடவும்:** கொப்புளங்களை உடைக்காமல் சுத்தமான துணி அல்லது கிளிங் ஃபிலிமால் மூடவும்.

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* தீக்காயத்தின் மீது பற்பசை (Toothpaste), வெண்ணெய், நெய், மஞ்சள், எண்ணெய் அல்லது ஐஸ் கட்டியைத் தடவ வேண்டாம்.

- **⚠️ Immediate 112 / Hospital Red Flags:**
* முகம், கழுத்து, கைகள் அல்லது பெரிய பகுதியில் தீக்காயம் மற்றும் புகை சுவாசித்ததால் மூச்சுத்திணறல்.`
      },
      fracture: {
        title: 'எலும்பு முறிவு முதலுதவி (Fracture)',
        markdown: `- **Immediate Priority:** அடிபட்ட கை அல்லது காலை இருக்கும் நிலையிலேயே அசையாமல் (Immobilize) தாங்கிப் பிடிக்கவும்.

- **Immediate Action Steps:**
1. **உறுப்பை அசைக்க வேண்டாம்:** முறிந்த பகுதியின் இருபுறமும் தாங்கிப் பிடிக்கவும்.
2. **ஸ்பிளிண்ட் (Splint) கட்டவும்:** அட்டை அல்லது பலகையைத் துணியில் சுற்றி மெதுவாகக் கட்டவும்.
3. **துணியில் சுற்றிய ஐஸ் வைக்கவும்:** வீக்கத்தைக் குறைக்க 15 நிமிடங்கள் ஐஸ் ஒத்தடம் கொடுக்கவும்.

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* முறிந்த எலும்பை நீங்களே இழுத்து நேராக்க முயற்சிக்காதீர்கள்.

- **⚠️ Immediate 112 / Hospital Red Flags:**
* எலும்பு தோலைக் கிழித்து வெளியே தெரிந்தால் அல்லது விரல்கள் மரத்துப் போனால்.`
      }
    },

    mr: {
      unconscious: {
        title: 'प्रौढ CPR आणि बेशुद्ध अवस्था प्रोटोकॉल (AHA 2020)',
        markdown: `- **Immediate Priority:** ताबडतोब प्रतिसाद आणि श्वास तपासा, 112 वर कॉल करा आणि न थांबता छातीवर दाब (CPR) सुरू करा.

- **Immediate Action Steps:**
1. **प्रतिसाद आणि श्वास तपासा:** दोन्ही खांद्यांवर थाप मारून आवाज द्या आणि ५ सेकंद छातीची हालचाल पहा.
2. **112 वर कॉल करा आणि AED मागवा:** स्पीकरफोनवर 112 डायल करा आणि जवळच्या व्यक्तीला AED मशीन आणायला सांगा.
3. **छातीच्या मध्यभागी सतत दाब द्या (CPR):** छातीच्या मध्यभागी तळहात ठेवून कोपरे सरळ ठेवा आणि ५–६ सेमी खोल वेगाने दाबा.
4. **छाती पूर्णपणे वर येऊ द्या:** प्रत्येक दाबानंतर छातीला मूळ स्थितीत येऊ द्या.

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* बेशुद्ध व्यक्तीला तोंडाने पाणी, अन्न किंवा औषध अजिबात देऊ नका.
* छातीवर दाब देणे १० सेकंदांपेक्षा जास्त वेळ थांबवू नका.

- **⚠️ Immediate 112 / Hospital Red Flags:**
* रुग्ण प्रतिसाद देत नाही, श्वास बंद आहे किंवा फक्त अधूनमधून धाप लागत आहे.`
      },
      bleeding: {
        title: 'तीव्र रक्तस्राव आणि जखम नियंत्रण (AIIMS Trauma)',
        markdown: `- **Immediate Priority:** स्वच्छ कपड्याने जखमेवर थेट आणि सतत दाब देऊन रक्तस्राव ताबडतोब थांबवा.

- **Immediate Action Steps:**
1. **थेट आणि घट्ट दाब द्या:** स्वच्छ कपडा किंवा गॉझ जखमेवर ठेवून दोन्ही हातांनी जोरात दाबून धरा.
2. **रक्ताने भिजलेला कपडा काढू नका:** कपडा भिजल्यास तो न काढता त्याच्यावर दुसरा स्वच्छ कपडा ठेवून दाब कायम ठेवा.
3. **रुग्णाला झोपवून उबदार ठेवा:** शॉक टाळण्यासाठी रुग्णाला समांतर झोपवून पांघरूण घाला.

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* जखमेत रुतलेली काच किंवा धारदार वस्तू बाहेर ओढू नका.
* सर्पदंशामध्ये जखमेवर कापू नका किंवा घट्ट दोरी बांधू नका.

- **⚠️ Immediate 112 / Hospital Red Flags:**
* रक्त वेगाने वाहत असल्यास किंवा रुग्ण निस्तेज व बेशुद्ध पडत असल्यास.`
      },
      choking: {
        title: 'घशात अडकणे / गुदमरणे (Choking First-Aid)',
        markdown: `- **Immediate Priority:** श्वासनलिकेतील अडथळा दूर करण्यासाठी ताबडतोब पाठीवर ५ थापा आणि पोटावर ५ दाब द्या.

- **Immediate Action Steps:**
1. **पुढे वाकवून पाठीवर ५ वेळा थाप मारा:** दोन्ही खांद्यांच्या मध्ये तळहाताच्या खालच्या भागाने ५ वेळा जोरात प्रहार करा.
2. **पोटाच्या वरच्या भागावर ५ वेळा दाब द्या (Heimlich):** बेंबीच्या वर मूठ ठेवून आत आणि वरच्या दिशेने ५ वेळा जोरात झटका द्या.
3. **वस्तू बाहेर पडेपर्यंत सुरू ठेवा:** अडथळा निघेपर्यंत ५ पाठीवर थापा आणि ५ पोटावर दाब सुरू ठेवा.

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* दिसत नसलेली वस्तू तोंडात बोट घालून काढण्याचा प्रयत्न करू नका.

- **⚠️ Immediate 112 / Hospital Red Flags:**
* रुग्ण बोलू किंवा श्वास घेऊ शकत नाही किंवा ओठ निळे पडत आहेत.`
      },
      burn: {
        title: 'गंभीर भाजणे आणि प्रथमोपचार (AHA & AIIMS)',
        markdown: `- **Immediate Priority:** भाजलेला भाग ताबडतोब १५ ते २० मिनिटे वाहत्या नळाच्या साध्या पाण्याखाली थंड करा.

- **Immediate Action Steps:**
1. **१५–२० मिनिटे वाहते पाणी घाला:** भाजलेल्या जागेवर मंद वाहते साधे पाणी सोडा.
2. **अंगठी, घड्याळ आणि दागिने काढा:** सूज येण्यापूर्वी भाजलेल्या भागाजवळील दागिने आणि घट्ट कपडे हलक्या हाताने काढा.
3. **स्वच्छ निर्जंतुक पट्टीने झाका:** फोड न फोडता स्वच्छ न चिकटणाऱ्या कपड्याने किंवा क्लिंग फिल्मने झाका.

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* भाजलेल्या जखमेवर टूथपेस्ट, लोणी, तूप, हळद, तेल किंवा थेट बर्फ कधीही लावू नका.

- **⚠️ Immediate 112 / Hospital Red Flags:**
* चेहरा, मान, हात किंवा मोठ्या भागावर भाजणे किंवा धुरामुळे श्वास घेण्यास त्रास.`
      },
      fracture: {
        title: 'हाड मोडणे / फ्रॅक्चर स्थिरीकरण',
        markdown: `- **Immediate Priority:** दुखापत झालेला हात किंवा पाय ज्या स्थितीत आहे त्याच स्थितीत स्थिर (Immobilize) ठेवा.

- **Immediate Action Steps:**
1. **अवयव हलवू नका:** मोडलेल्या भागाच्या वर आणि खाली आधार द्या.
2. **स्प्लिंट किंवा पट्टी बांधा:** पुठ्ठा किंवा लाकडी पट्टी कपड्यात गुंडाळून हलक्या हाताने बांधा.
3. **कपड्यात गुंडाळलेला बर्फ लावा:** सूज कमी करण्यासाठी टॉवेलमध्ये गुंडाळलेला बर्फ १५ मिनिटे लावा.

- **CRITICAL CONTRAINDICATIONS (WHAT NOT TO DO):**
* मोडलेले किंवा वाकलेले हाड स्वतः ओढून सरळ करण्याचा प्रयत्न करू नका.

- **⚠️ Immediate 112 / Hospital Red Flags:**
* हाड त्वचेबाहेर दिसत असल्यास किंवा बोटे निळी व बधीर होत असल्यास.`
      }
    }
  };

  return dict[lang]?.[protocolKey] || null;
}

/**
 * Helper to pick the best available browser SpeechSynthesisVoice for a language code
 */
export function selectBestVoiceForLanguage(
  langCode: SupportedLanguageCode
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const meta = LANGUAGE_BY_CODE[langCode] || LANGUAGE_BY_CODE.en;
  const prefix = meta.code; // 'en' | 'hi' | 'bn' | 'ta' | 'mr'

  // 1. Exact BCP-47 match (e.g., hi-IN, bn-IN, ta-IN, mr-IN, en-IN)
  const exact = voices.find((v) => v.lang.toLowerCase() === meta.bcp47.toLowerCase());
  if (exact) return exact;

  // 2. Prefix match (e.g., bn-BD / bn_IN / ta-LK / mr_IN)
  const prefixMatch = voices.find((v) =>
    v.lang.toLowerCase().replace('_', '-').startsWith(prefix)
  );
  if (prefixMatch) return prefixMatch;

  // 3. Name match (e.g. "Google हिन्दी", "Google বাংলা", "Google தமிழ்", "Google मराठी")
  const nameMatch = voices.find(
    (v) =>
      v.name.toLowerCase().includes(meta.englishName.toLowerCase()) ||
      v.name.includes(meta.nativeName)
  );
  if (nameMatch) return nameMatch;

  // 4. Fallback to Indian English or Hindi voice so Indian phonetics work smoothly
  const indFallback = voices.find(
    (v) => v.lang.includes('hi-IN') || v.lang.includes('en-IN')
  );
  return indFallback || null;
}

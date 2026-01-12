import { DialectOption, VoiceOption } from './types';

export const VOICES: VoiceOption[] = [
  { 
    id: 'Fenrir', 
    label: 'الحكيم', 
    gender: 'male', 
    emoji: '🧔‍♂️',
    description: 'صوت عميق، رزين، وموثوق (للعلوم والتاريخ)' 
  },
  { 
    id: 'Puck', 
    label: 'المرح', 
    gender: 'male', 
    emoji: '🧑‍🎤',
    description: 'صوت حيوي، ودود، وسريع (للأطفال والقصص)' 
  },
  { 
    id: 'Charon', 
    label: 'الراوي', 
    gender: 'male', 
    emoji: '🎙️',
    description: 'صوت وثائقي، هادئ، وعميق (للأدب والغموض)' 
  },
  { 
    id: 'Kore', 
    label: 'الملهمة', 
    gender: 'female', 
    emoji: '👩‍🏫',
    description: 'صوت دافئ، مشجع، وواضح (للتعليم العام)' 
  },
  { 
    id: 'Zephyr', 
    label: 'الهادئة', 
    gender: 'female', 
    emoji: '🧘‍♀️',
    description: 'صوت ناعم، متزن، ومريح (للتأمل والخواطر)' 
  },
];

export const DIALECTS: DialectOption[] = [
  // --- North Africa ---
  {
    id: 'egypt',
    name: 'مصر',
    emoji: '🇪🇬',
    description: 'اللهجة المصرية العامية',
    promptInstruction: 'Explain this in the Egyptian colloquial dialect (Masri). Use Egyptian slang and humor.',
    category: 'arab'
  },
  {
    id: 'morocco',
    name: 'المغرب',
    emoji: '🇲🇦',
    description: 'الدارجة المغربية',
    promptInstruction: 'Explain this in the Moroccan Darija dialect.',
    category: 'arab'
  },
  {
    id: 'algeria',
    name: 'الجزائر',
    emoji: '🇩🇿',
    description: 'اللهجة الجزائرية',
    promptInstruction: 'Explain this in the Algerian dialect (Darja).',
    category: 'arab'
  },
  {
    id: 'tunisia',
    name: 'تونس',
    emoji: '🇹🇳',
    description: 'اللهجة التونسية',
    promptInstruction: 'Explain this in the Tunisian dialect.',
    category: 'arab'
  },
  {
    id: 'libya',
    name: 'ليبيا',
    emoji: '🇱🇾',
    description: 'اللهجة الليبية',
    promptInstruction: 'Explain this in the Libyan dialect.',
    category: 'arab'
  },
  {
    id: 'mauritania',
    name: 'موريتانيا',
    emoji: '🇲🇷',
    description: 'اللهجة الحسانية',
    promptInstruction: 'Explain this in the Hassaniya Arabic dialect of Mauritania.',
    category: 'arab'
  },
  {
    id: 'sudan',
    name: 'السودان',
    emoji: '🇸🇩',
    description: 'اللهجة السودانية',
    promptInstruction: 'Explain this in the Sudanese colloquial dialect.',
    category: 'arab'
  },
  {
    id: 'somalia',
    name: 'الصومال',
    emoji: '🇸🇴',
    description: 'عربي بلهجة صومالية',
    promptInstruction: 'Explain this in Arabic with a Somali influence/accent, or standard Arabic as spoken in Somalia.',
    category: 'arab'
  },
  {
    id: 'djibouti',
    name: 'جيبوتي',
    emoji: '🇩🇯',
    description: 'عربي جيبوتي',
    promptInstruction: 'Explain this in the Arabic dialect spoken in Djibouti.',
    category: 'arab'
  },
  {
    id: 'comoros',
    name: 'جزر القمر',
    emoji: '🇰🇲',
    description: 'عربي قمري',
    promptInstruction: 'Explain this in simple Arabic as understood in Comoros.',
    category: 'arab'
  },

  // --- Levant & Iraq ---
  {
    id: 'syria',
    name: 'سوريا',
    emoji: '🇸🇾',
    description: 'اللهجة الشامية السورية',
    promptInstruction: 'Explain this in the Syrian Levantine dialect.',
    category: 'arab'
  },
  {
    id: 'lebanon',
    name: 'لبنان',
    emoji: '🇱🇧',
    description: 'اللهجة اللبنانية',
    promptInstruction: 'Explain this in the Lebanese Levantine dialect.',
    category: 'arab'
  },
  {
    id: 'jordan',
    name: 'الأردن',
    emoji: '🇯🇴',
    description: 'اللهجة الأردنية',
    promptInstruction: 'Explain this in the Jordanian dialect.',
    category: 'arab'
  },
  {
    id: 'palestine',
    name: 'فلسطين',
    emoji: '🇵🇸',
    description: 'اللهجة الفلسطينية',
    promptInstruction: 'Explain this in the Palestinian dialect.',
    category: 'arab'
  },
  {
    id: 'iraq',
    name: 'العراق',
    emoji: '🇮🇶',
    description: 'اللهجة العراقية (المصلاوية/البغدادية)',
    promptInstruction: 'Explain this in the Iraqi dialect.',
    category: 'arab'
  },

  // --- Gulf & Peninsula ---
  {
    id: 'saudi',
    name: 'السعودية',
    emoji: '🇸🇦',
    description: 'اللهجة السعودية',
    promptInstruction: 'Explain this in the Saudi dialect (Najdi or Hejazi).',
    category: 'arab'
  },
  {
    id: 'kuwait',
    name: 'الكويت',
    emoji: '🇰🇼',
    description: 'اللهجة الكويتية',
    promptInstruction: 'Explain this in the Kuwaiti dialect.',
    category: 'arab'
  },
  {
    id: 'uae',
    name: 'الإمارات',
    emoji: '🇦🇪',
    description: 'اللهجة الإماراتية',
    promptInstruction: 'Explain this in the Emirati dialect.',
    category: 'arab'
  },
  {
    id: 'qatar',
    name: 'قطر',
    emoji: '🇶🇦',
    description: 'اللهجة القطرية',
    promptInstruction: 'Explain this in the Qatari dialect.',
    category: 'arab'
  },
  {
    id: 'bahrain',
    name: 'البحرين',
    emoji: '🇧🇭',
    description: 'اللهجة البحرينية',
    promptInstruction: 'Explain this in the Bahraini dialect.',
    category: 'arab'
  },
  {
    id: 'oman',
    name: 'عُمان',
    emoji: '🇴🇲',
    description: 'اللهجة العمانية',
    promptInstruction: 'Explain this in the Omani dialect.',
    category: 'arab'
  },
  {
    id: 'yemen',
    name: 'اليمن',
    emoji: '🇾🇪',
    description: 'اللهجة اليمنية',
    promptInstruction: 'Explain this in the Yemeni dialect.',
    category: 'arab'
  },
  {
    id: 'msa',
    name: 'الفصحى',
    emoji: '📚',
    description: 'اللغة العربية الفصحى',
    promptInstruction: 'Explain this in Modern Standard Arabic (Fusha). Clear and educational.',
    category: 'arab'
  },

  // --- World Languages ---
  {
    id: 'english',
    name: 'English',
    emoji: '🇺🇸',
    description: 'English Language',
    promptInstruction: 'Explain this in English. Clear and engaging.',
    category: 'world'
  },
  {
    id: 'french',
    name: 'Français',
    emoji: '🇫🇷',
    description: 'Langue Française',
    promptInstruction: 'Explain this in French.',
    category: 'world'
  },
  {
    id: 'spanish',
    name: 'Español',
    emoji: '🇪🇸',
    description: 'Idioma Español',
    promptInstruction: 'Explain this in Spanish.',
    category: 'world'
  },
  {
    id: 'german',
    name: 'Deutsch',
    emoji: '🇩🇪',
    description: 'Deutsche Sprache',
    promptInstruction: 'Explain this in German.',
    category: 'world'
  },
  {
    id: 'italian',
    name: 'Italiano',
    emoji: '🇮🇹',
    description: 'Lingua Italiana',
    promptInstruction: 'Explain this in Italian.',
    category: 'world'
  },
  {
    id: 'turkish',
    name: 'Türkçe',
    emoji: '🇹🇷',
    description: 'Türk Dili',
    promptInstruction: 'Explain this in Turkish.',
    category: 'world'
  },
  {
    id: 'russian',
    name: 'Русский',
    emoji: '🇷🇺',
    description: 'Russian Language',
    promptInstruction: 'Explain this in Russian.',
    category: 'world'
  },
  {
    id: 'chinese',
    name: '中文',
    emoji: '🇨🇳',
    description: 'Mandarin Chinese',
    promptInstruction: 'Explain this in Mandarin Chinese.',
    category: 'world'
  },
  {
    id: 'japanese',
    name: '日本語',
    emoji: '🇯🇵',
    description: 'Japanese Language',
    promptInstruction: 'Explain this in Japanese.',
    category: 'world'
  },
  {
    id: 'hindi',
    name: 'हिन्दी',
    emoji: '🇮🇳',
    description: 'Hindi Language',
    promptInstruction: 'Explain this in Hindi.',
    category: 'world'
  },
];
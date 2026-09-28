import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LanguageCode = 'en' | 'te' | 'hi';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
}

const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    home: 'Home',
    protect: 'Protect',
    money: 'Money',
    invest: 'Invest',
    alerts: 'Alerts',
    protected: "YOU'RE PROTECTED",
    attention: 'SOMETHING NEEDS ATTENTION',
    scan_qr: 'Scan QR',
    check_link: 'Check a Link',
    check_payment: 'Check a Payment',
    check_invest: 'Check an Investment',
    is_this_safe: 'Is this safe?',
    protect_subtitle: 'Check something before you send money or invest.',
    looks_ok: 'LOOKS OK',
    be_careful: 'BE CAREFUL',
    high_risk: 'HIGH RISK',
    not_enough_info: 'NOT ENOUGH INFORMATION',
  },
  te: {
    home: 'హోమ్',
    protect: 'రక్షణ',
    money: 'డబ్బు',
    invest: 'పెట్టుబడులు',
    alerts: 'హెచ్చరికలు',
    protected: 'మీరు సురక్షితంగా ఉన్నారు',
    attention: 'గమనించవలసిన అంశం ఉంది',
    scan_qr: 'QR స్కాన్ చేయండి',
    check_link: 'లింక్ తనిఖీ చేయండి',
    check_payment: 'చెల్లింపును తనిఖీ చేయండి',
    check_invest: 'పెట్టుబడిని తనిఖీ చేయండి',
    is_this_safe: 'ఇది సురక్షితమేనా?',
    protect_subtitle: 'డబ్బు పంపే ముందు లేదా పెట్టుబడి పెట్టే ముందు పరిశీలించండి.',
    looks_ok: 'సురక్షితంగా కనిపిస్తోంది',
    be_careful: 'జాగ్రత్తగా ఉండండి',
    high_risk: 'అధిక ప్రమాదం',
    not_enough_info: 'తగినంత సమాచారం లేదు',
  },
  hi: {
    home: 'होम',
    protect: 'सुरक्षा',
    money: 'पैसा',
    invest: 'निवेश',
    alerts: 'अलर्ट',
    protected: 'आप सुरक्षित हैं',
    attention: 'कुछ ध्यान देने योग्य है',
    scan_qr: 'QR स्कैन करें',
    check_link: 'लिंक जांचें',
    check_payment: 'भुगतान जांचें',
    check_invest: 'निवेश जांचें',
    is_this_safe: 'क्या यह सुरक्षित है?',
    protect_subtitle: 'पैसे भेजने या निवेश करने से पहले जांच लें।',
    looks_ok: 'सब ठीक लग रहा है',
    be_careful: 'सावधान रहें',
    high_risk: 'उच्च जोखिम',
    not_enough_info: 'पर्याप्त जानकारी नहीं',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (k, f) => f || k,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[language]?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

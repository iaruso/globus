import React, { forwardRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const TranslateDropdown = forwardRef(({ setOpenTranslateDropdown }, ref) => {
  const { t, i18n } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState(i18n.language);
  
  useEffect(() => {
    setActiveLanguage(i18n.language);
  }, [i18n.language]);

  const languages = {
    'en': 'en-EN',
    'ru': 'ru-RU',
    'pt': 'pt-PT',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'ja': 'ja-JA'
  };

  const handleLanguageChange = (languageCode) => {
    console.log(languageCode);
    i18n.changeLanguage(languageCode);
    setActiveLanguage(languageCode);
  };

  return (
    <div ref={ref} className='translate-dropdown'>
      <ul>
        {Object.entries(languages).map(([languageCode, fullLanguageCode]) => (
          <li key={languageCode} className={`translate-dropdown-item ${activeLanguage === fullLanguageCode ? 'active' : ''}`}
            onClick={() => handleLanguageChange(fullLanguageCode)}
          >
            {t(`navbar.translate.${languageCode}`)}
          </li>
        ))}
      </ul>
    </div>
  );
});

export default TranslateDropdown;

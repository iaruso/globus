import React, { forwardRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const TranslateDropdown = forwardRef(({ setOpenTranslateDropdown }, ref) => {
  const { t, i18n } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState(i18n.language);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [initialRender, setInitialRender] = useState(true);

  useEffect(() => {
    setActiveLanguage(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if (initialRender) {
      const index = Object.values(languages).findIndex(language => language === activeLanguage);
      setSelectedOptionIndex(index);
      setInitialRender(false);
    }
  }, [activeLanguage, initialRender]);

  const languages = {
    'en': 'en',
    'ru': 'ru',
    'pt': 'pt',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'ja': 'ja'
  };

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setActiveLanguage(languageCode);
    setOpenTranslateDropdown(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowUp') {
      setSelectedOptionIndex(prevIndex => {
        const newIndex = prevIndex === 0 ? Object.keys(languages).length - 1 : prevIndex - 1;
        return newIndex !== selectedOptionIndex ? newIndex : prevIndex;
      });
      event.preventDefault();
    } else if (event.key === 'ArrowDown') {
      setSelectedOptionIndex(prevIndex => {
        const newIndex = prevIndex === Object.keys(languages).length - 1 ? 0 : prevIndex + 1;
        return newIndex !== selectedOptionIndex ? newIndex : prevIndex;
      });
      event.preventDefault();
    } else if (event.key === 'Enter') {
      const languageCode = Object.values(languages)[selectedOptionIndex];
      handleLanguageChange(languageCode);
      setOpenTranslateDropdown(false);
      event.preventDefault();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedOptionIndex]);

  const handleMouseEnter = (index) => {
    setSelectedOptionIndex(index);
  };

  const handleMouseLeave = () => {
    // Do nothing when mouse leaves the dropdown
  };

  return (
    <>
      <div ref={ref} className='translate-dropdown' onMouseLeave={handleMouseLeave}>
        <ul>
          {Object.entries(languages).map(([languageCode, fullLanguageCode], index) => (
            <li 
              key={languageCode} 
              className={`translate-dropdown-item ${activeLanguage === fullLanguageCode ? 'active' : ''} ${selectedOptionIndex === index ? 'selected' : ''}`}
              onClick={() => handleLanguageChange(fullLanguageCode)}
              onMouseEnter={() => handleMouseEnter(index)}
            >
              {t(`navbar.translate.${languageCode}`)}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
});

export default TranslateDropdown;

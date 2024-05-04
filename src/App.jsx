import './App.css';
import React, { useState, useEffect, Suspense, createContext } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Info from './components/Info';

const Globe = React.lazy(() => import('./components/Globe'));
export const GlobeContext = createContext();

function App() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searching, setSearching] = useState(false);
  const [closed, setClosed] = useState(false);
  const [contextIndicatorData, setContextIndicatorData] = useState(null);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  useEffect(() => {
    setSelectedInfo(selectedCountry);
  }, [selectedCountry]);

  useEffect(() => {
    setTimeout(() => {
      setClosed(false);
    }, 500);
  }, [closed]);

  return (
    <>
      <HelmetProvider>
        <Helmet>
          <html lang={localStorage.getItem('i18nextLng').split('-')[0]} />
          <title>{t('app')}</title>
          <meta name="theme-color" content={theme == 'light' ? '#FCFDFE' : '#1A1A1A'}/>
        </Helmet>
      </HelmetProvider>
      <GlobeContext.Provider value={{ contextIndicatorData, setContextIndicatorData }}>
        <div className="container">
          <div className={`globe-container${searching ? ' disabled' : ''}`}>
            <Suspense fallback={<div>Loading...</div>}>
              {
                <Globe
                  theme={theme}
                  toggleTheme={toggleTheme}
                  onCountrySelect={setSelectedCountry}
                  selectedInfo={selectedInfo}
                  onSearching={setSearching}
                />
              }
            </Suspense>
          </div>
        </div>
        <Info selectedInfo={selectedInfo} onSearching={setSearching} onClose={setClosed} searching={searching}/>
      </GlobeContext.Provider>
      <Navbar
        toggleTheme={toggleTheme}
        theme={theme}
        selectedCountry={selectedCountry}
        onSelectedInfo={setSelectedInfo}
        searching={searching}
        closed={closed}
      />
      <div className='opacity-box'></div> 
    </>
  );
}

export default App;

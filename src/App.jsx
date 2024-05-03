import './App.css';
import React, { useState, Suspense, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
const Globe = React.lazy(() => import('./components/Globe'));
import Info from './components/Info';

function App() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  useEffect(() => {
    setSelectedInfo(selectedCountry);
  }, [selectedCountry]);
  
  useEffect(() => {
    console.log('a');
  }, [selectedInfo]);

  return (
    <>
      <HelmetProvider>
        <Helmet>
          <html lang={localStorage.getItem('i18nextLng').split('-')[0]} />
          <title>{t('app')}</title>
        </Helmet>
      </HelmetProvider>
      <div className="container"> 
        <Suspense fallback={<div>Loading...</div>}>
          <Globe theme={theme} toggleTheme={toggleTheme} onCountrySelect={setSelectedCountry} />
        </Suspense>
      </div>
      <Navbar toggleTheme={toggleTheme} theme={theme} selectedCountry={selectedCountry} onSelectedInfo={setSelectedInfo} />
      <Info selectedInfo={selectedInfo} />
    </>
  );
}

export default App;
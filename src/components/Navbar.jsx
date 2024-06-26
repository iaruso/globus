import React, { useRef, useState, useEffect } from 'react';
import Select from 'react-dropdown-select';
import { useTranslation } from 'react-i18next';
import countriesDataJSON from '../assets/countries.json';
import indicatorsDataJSON from '../assets/indicators.json';
import TranslateDropdown from './TranslateDropdown';
import gsap from 'gsap';
import Logo from './icons/Logo';
import Light from './icons/Light';
import Dark from './icons/Dark';
import Language from './icons/Language';
import Info from './icons/Info';
import Clear from './icons/Clear';

const Navbar = ({ toggleTheme, theme, selectedCountry, onSelectedInfo, searching, closed }) => {
  const { t, i18n } = useTranslation();
  const selectRef = useRef(null);
  const [allOptionsData, setAllOptions] = useState([]);
  const [selectKey, setSelectKey] = useState(0);
  const [selectedValue, setSelectedValue] = useState([]);
  const [selectFlag, setSelectFlag] = useState(false);
  const [fromEffect, setFromEffect] = useState(false);

  const translateButtonRef = useRef(null);
  const translateDropdownRef = useRef(null);
  const [openTranslateDropdown, setOpenTranslateDropdown] = useState(false);

  const [openInfoContainer, setOpenInfoContainer] = useState(false);
  const infoButtonRef = useRef(null);
  const infoContentRef = useRef(null);

  useEffect(() => {
    const countriesData = Object.entries(countriesDataJSON.countriesCollection).map(([iso3, countryData]) => ({
      value: iso3.toLowerCase(),
      label: t(countryData.name)
    }));

    const indicatorsData = Object.entries(indicatorsDataJSON.indicatorsCollection).map(([indicator, indicatorData]) => {
      const value = indicator.replace(/_/g, '.');
      return {
        value,
        label: t(indicatorData)
      };
    });

    const allOptionsData = [...indicatorsData, ...countriesData,];

    setAllOptions(allOptionsData);
  }, [t]);

  useEffect(() => {
    document.getElementById('root').classList = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        translateDropdownRef.current &&
        !translateDropdownRef.current.contains(event.target) &&
        !translateButtonRef.current.contains(event.target)
      ) {
        setOpenTranslateDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [translateDropdownRef, translateButtonRef]);

  useEffect(() => {
    function handleClickOutside(event) {
      const isLinkInsideInfoContainer = event.target.closest('.info-container a');
      if (
        (infoContentRef.current && !infoContentRef.current.contains(event.target)) &&
        (infoButtonRef.current && !infoButtonRef.current.contains(event.target))
      ) {
        setOpenInfoContainer(false);
      }
      if (isLinkInsideInfoContainer) {
        setTimeout(() => {
          setOpenInfoContainer(false);
        }, 500);
      }
    }
  
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [infoContentRef, infoButtonRef]);

  useEffect(() => {
    setSelectKey(prevKey => prevKey + 1);
  }, [i18n.language]);

  useEffect(() => {
    if (selectedCountry) {
      setFromEffect(true);
      setSelectedValue([{ value: selectedCountry.toLowerCase(), label: t(countriesDataJSON.countriesCollection[selectedCountry.toUpperCase()].name) }]);
    } else {
      setSelectedValue([]);
    }
  }, [selectedCountry, t]);

  useEffect(() => {
    if (fromEffect) {
      setFromEffect(false);
    }
  }, [selectedValue, fromEffect]);

  const handleChange = (value) => {
    if (!fromEffect) {
      setSelectedValue(value);
      onSelectedInfo(value);
      setSelectFlag(true);
      setTimeout(() => {
        setSelectFlag(false);
      }, 100);
    }
  };

  const clearAll = () => {
    setSelectedValue([]);
    onSelectedInfo([]);
    setFromEffect(true);
  };

  useEffect(() => {
    closed && clearAll();
  }, [closed]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        const input = document.querySelector('.react-dropdown-select-input');
        const select = document.querySelector('.react-dropdown-select');
        const navButtons = document.querySelectorAll('nav button');
        const isNavButtonFocused = Array.from(navButtons).some(button => button === document.activeElement);
        const isButtonFocused = document.activeElement.tagName.toLowerCase() === 'button';
        
        if (input && !isNavButtonFocused && !isButtonFocused && document.activeElement !== input && select && !selectFlag) {
          select.click();
          input.focus();
          event.preventDefault();
        }
      }
    };    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectFlag]);

  useEffect(() => {
    gsap.fromTo('.opacity-box', { opacity: 2}, { opacity: 0, duration: 1 }); /* Lags a bit, so opacity must be over 1 */
  }, [i18n.language, theme]);

  return (
    <nav>
      <div className='logo-area'>
        <Logo className={'globus-logo'} />
        <h1 className='logo'>{t('app')}</h1>
      </div>
      <div className='search-area'>
        <Select
          disabled={searching}
          ref={selectRef}
          key={selectKey}
          options={allOptionsData}
          labelField='label'
          valueField='value'
          placeholder={t('navbar.placeholder')}
          onChange={handleChange}
          clearable
          searchable
          dropdownPosition='top'
          clearOnBlur
          clearOnSelect
          clearRenderer={() => <button className={`clear-select${selectedValue.length > 0 ? '' : ' hidden'}`} onClick={clearAll}><Clear/></button>}
          noDataRenderer={() => <span className='no-data'>{t('navbar.noData')}</span>}
          values={selectedValue}
        />
        {selectedValue.length == 0 && 
          <div className='select-enter'>
            <span>↵</span>
          </div>
        }
      </div>
      <button onClick={toggleTheme} aria-label={t('navbar.buttons.toggleTheme')}>
        {theme === 'dark' ? <Dark /> : <Light />}
      </button>
      <div className='custom-button'>
        <button className='translate' ref={translateButtonRef} onClick={(e) => { setOpenTranslateDropdown((prev) => !prev); e.stopPropagation(); }} aria-label={t('navbar.buttons.translate')}>
          <Language />
        </button>
        {openTranslateDropdown && <TranslateDropdown setOpenTranslateDropdown={setOpenTranslateDropdown}  ref={translateDropdownRef} />}
      </div>
      <div className='custom-button'>
        <button className='info' ref={infoButtonRef} onClick={(e) => { setOpenInfoContainer((prev) => !prev); e.stopPropagation();}} aria-label={t('navbar.buttons.info')}>
          <Info />
        </button>
        {openInfoContainer && <div ref={infoContentRef} className='info-box'>
          <p>{t('navbar.info.description')}</p>
          <a href='https://github.com/iaruso/globus' target='_blank'>{t('navbar.info.sourceCode')}</a>
        </div>}
      </div>
    </nav>
  );
};

export default Navbar;

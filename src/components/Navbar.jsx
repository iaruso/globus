import React, { useRef, useState, useEffect } from 'react';
import Select from 'react-dropdown-select';
import { useTranslation } from 'react-i18next';
import countriesDataJSON from '../assets/countries.json';
import categoriesDataJSON from '../assets/categories.json';
import TranslateDropdown from './TranslateDropdown';
import Logo from './icons/Logo';
import Light from './icons/Light';
import Dark from './icons/Dark';
import Language from './icons/Language';
import Info from './icons/Info';

const Navbar = ({ toggleTheme, theme, selectedCountry }) => {
  const { t, i18n } = useTranslation();
  const translateButtonRef = useRef(null);
  const translateDropdownRef = useRef(null);
  const selectRef = useRef(null);
  const [openTranslateDropdown, setOpenTranslateDropdown] = useState(false);
  const [allOptionsData, setAllOptions] = useState([]);
  const [selectKey, setSelectKey] = useState(0);
  const [selectedValue, setSelectedValue] = useState(undefined);

  useEffect(() => {
    const countriesData = Object.entries(countriesDataJSON.countriesCollection).map(([iso3, countryData]) => ({
      value: iso3.toLowerCase(),
      label: t(countryData.name)
    }));

    const categoriesData = Object.entries(categoriesDataJSON.categoriesCollection).map(([category, categoryData]) => {
      const value = category.replace(/_/g, '.');
      return {
        value,
        label: t(categoryData)
      };
    });

    const allOptionsData = [...countriesData, ...categoriesData];

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
    setSelectKey(prevKey => prevKey + 1);
  }, [i18n.language]);

  useEffect(() => {
    if (selectedCountry) {
      setSelectedValue([{ value: selectedCountry.toLowerCase(), label: t(countriesDataJSON.countriesCollection[selectedCountry.toUpperCase()].name) }]);
    } else {
      setSelectedValue(undefined);
    }
  }, [selectedCountry, t]);

  const handleChange = (selectedOptions) => {
    setSelectedValue(selectedOptions);
  };

  return (
    <nav>
      <div className='logo-area'>
        <Logo className={'globus-logo'} />
        <h1 className='logo'>{t('app')}</h1>
      </div>
      <div className='search-area'>
        <Select
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
          noDataRenderer={() => <span className="no-data">{t('navbar.noData')}</span>}
          values={selectedValue}
        />
      </div>
      <button onClick={toggleTheme}>
        {theme === 'dark' ? <Dark /> : <Light />}
      </button>
      <div className='button' ref={translateButtonRef} onClick={(e) => { setOpenTranslateDropdown((prev) => !prev); e.stopPropagation(); }}>
        <Language />
        {openTranslateDropdown && <TranslateDropdown setOpenTranslateDropdown={setOpenTranslateDropdown} ref={translateDropdownRef} />}
      </div>
      <button>
        <Info />
      </button>
    </nav>
  );
};

export default Navbar;

import React, { useEffect, useState, useContext } from 'react';
import { GlobeContext } from '../App';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import countriesDataJSON from '../assets/countries.json';
import indicatorDataJSON from '../assets/indicators.json';
import Collapse from './icons/Collapse';
import Clear from './icons/Clear';
import Sort from './icons/Sort';

let sortOrderByNameInitial = 'desc';
let sortOrderByValueInitial = null;

const Info = ({ selectedInfo, onSearching, onClose, searching }) => {
  const [infoValue, setInfoValue] = useState(null);
  const [countryData, setCountryData] = useState([]);
  const [indicatorData, setIndicatorData] = useState([]);
  const [countryInfo, setCountryInfo] = useState(null);
  const [closed, setClosed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [infoType, setInfoType] = useState(null);
  const [orderFlag, setOrderFlag] = useState(false);
  const [sortOrderByName, setSortOrderByName] = useState(sortOrderByNameInitial);
  const [sortOrderByValue, setSortOrderByValue] = useState(sortOrderByValueInitial);
  const { t, i18n } = useTranslation();
  const { setContextIndicatorData } = useContext(GlobeContext);

  const currentYear = new Date().getFullYear() - 1;

  const sortIndicatorDataByName = (value, ignore = false) => {
    const sortedData = [...indicatorData].sort((a, b) => {
      const nameA = getCountryName(a.countryiso3code).toUpperCase();
      const nameB = getCountryName(b.countryiso3code).toUpperCase();
      return ignore ? value === 'desc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA) : value === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
    setIndicatorData(sortedData);
    if (ignore) {
      return;
    }
    const newSortOrder = sortOrderByName === 'asc' ? 'desc' : 'asc';
    setSortOrderByName(newSortOrder);
    setSortOrderByValue(null);
  };
  
  const sortIndicatorDataByValue = () => {
    const sortedData = [...indicatorData].sort((a, b) => {
      const valueA = a.value !== null ? a.value : -Infinity;
      const valueB = b.value !== null ? b.value : -Infinity;
      return sortOrderByValue === 'desc' || null ? valueA - valueB : valueB - valueA;
    });
    setIndicatorData(sortedData);
    setSortOrderByValue(sortOrderByValue === 'desc' || null ? 'asc' : 'desc');
    setSortOrderByName(null);
  };

  const setDefaultOrder = (val = true) => {
    setSortOrderByValue(null);
    sortIndicatorDataByName(sortOrderByName === 'desc' ? 'asc' : 'desc', !val);
  };

  useEffect(() => {
    if (indicatorData.length > 0 || orderFlag) {
      setDefaultOrder(orderFlag);
      setOrderFlag(false);
    }
  }, [i18n.language, orderFlag]);

  useEffect(() => {
    if (selectedInfo) {
      setClosed(false);
      setCollapsed(false);
      setCountryData([]);
      setIndicatorData([]);
      setCountryInfo(null);
      setLoading(false);
      setInfoType(null);
      setContextIndicatorData([]);
      selectedInfo.length === 0 ? null : onSearching(true);
      if (typeof selectedInfo === 'string') {
        setInfoValue(selectedInfo);
        fetchData(selectedInfo);
        extractCountryInfo(selectedInfo);
        setLoading(true);
        setInfoType('country');
      } else if (typeof selectedInfo === 'object') {
        if (selectedInfo[0]?.value.length === 3) {
          const iso3Code = selectedInfo[0]?.value.toUpperCase();
          setInfoValue(iso3Code);
          fetchData(iso3Code);
          extractCountryInfo(iso3Code);
          setLoading(true);
          setInfoType('country');
        } else if (selectedInfo.length === 0){
          setInfoValue(null);
        } else {
          const indicatorValue = selectedInfo[0]?.value;
          setInfoValue(indicatorValue);
          fetchIndicatorData(indicatorValue);
          setLoading(true);
          setInfoType('indicator');
        }
      } else {
        setInfoValue(null);
      }
    }
  }, [selectedInfo]);

  const fetchData = async (value, year = currentYear, nullIndicators = []) => {
    try {
      const locale = i18n.language.split('-')[0];
      const indicatorString = nullIndicators.length > 0 ? nullIndicators.join(';') : 'AG.SRF.TOTL.K2;SP.POP.TOTL;SP.POP.GROW;EN.POP.DNST;NY.GDP.MKTP.CD;NY.GDP.MKTP.KD.ZG;NY.GDP.PCAP.CD;NE.GDI.TOTL.ZS;GC.TAX.TOTL.GD.ZS;SL.UEM.TOTL.NE.ZS;SI.POV.NAHC;SP.DYN.LE00.IN;SE.ADT.LITR.ZS;SH.STA.BRTC.ZS;SH.DYN.MORT;SP.DYN.CONU.ZS;SP.DYN.TFRT.IN;SE.PRM.CMPT.ZS;SE.ENR.PRSC.FM.ZS;EG.USE.PCAP.KG.OE;EN.ATM.CO2E.PC;AG.LND.FRST.K2;ER.PTD.TOTL.ZS;NE.EXP.GNFS.ZS;NE.IMP.GNFS.ZS;TG.VAL.TOTL.GD.ZS;NE.TRD.GNFS.ZS;SH.H2O.BASW.ZS;SH.STA.BASS.ZS;EG.USE.ELEC.KH.PC;IT.CEL.SETS.P2;SP.URB.GROW';
      const response = await axios.get(`http://api.worldbank.org/v2/${locale}/country/${value}/indicator/${indicatorString}?source=2&format=json&page=1&date=${year}`);
      const newData = response.data[1];
      const newNullIndicators = newData.filter(item => item.value === null).map(item => item.indicator.id);
      if (newNullIndicators.length > 0 && year > currentYear - 10) {
        const recursiveData = await fetchData(value, year - 1, newNullIndicators);
        return [...newData, ...recursiveData];
      } else {
        return newData;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  };

  const fetchIndicatorData = async (indicator, year = currentYear, nullIndicators = []) => {
    try {
      const locale = i18n.language.split('-')[0];
      const iso2Codes = Object.values(countriesDataJSON.countriesCollection).map(country => country.iso2);
      const iso2String = nullIndicators.length > 0 ? nullIndicators.join(';') : iso2Codes.join(';');
      let allData = [];
      let currentPage = 1;
      while (true) {
        const response = await axios.get(`http://api.worldbank.org/v2/${locale}/country/${iso2String}/indicator/${indicator}?format=json&dataformat=list&date=${year}&page=${currentPage}`);
        const newData = response.data[1];
        allData.push(...newData);
        if (newData.length < 50) {
          break;
        }
        currentPage++;
      }

      const newNullIndicators = allData.filter(item => item.value === null).map(item => item.country.id);
      if (newNullIndicators.length > 0 && year > currentYear - 10) {
        const recursiveData = await fetchIndicatorData(indicator, year - 1, newNullIndicators);
        return [...allData, ...recursiveData];
      } else {
        return allData;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  };

  useEffect(() => {
    const updateData = async () => {
      if (infoValue) {
        if (infoValue.length === 3) {
          const data = await fetchData(infoValue);
          updateCountryData(data);
        } else if (infoValue.length > 3) {
          const data = await fetchIndicatorData(infoValue);
          updateIndicatorData(data);
        }
      }
    };

    updateData();
  }, [infoValue]);

  const updateCountryData = (newData) => {
    const updatedData = [...countryData];
    newData.forEach(newItem => {
      const existingItemIndex = updatedData.findIndex(item => item.indicator.id === newItem.indicator.id);
      if (existingItemIndex !== -1) {
        updatedData[existingItemIndex] = newItem;
      } else {
        updatedData.push(newItem);
      }
    });
    setCountryData(updatedData);
    setLoading(false);
  };

  const updateIndicatorData = (newData) => {
    const updatedData = [...indicatorData];
    newData.forEach(newItem => {
      const existingItemIndex = updatedData.findIndex(item => item.country.id === newItem.country.id);
      if (existingItemIndex !== -1) {
        updatedData[existingItemIndex] = newItem;
      } else {
        updatedData.push(newItem);
      }
    });
    setIndicatorData(updatedData);
    setContextIndicatorData(updatedData);
    setLoading(false);
    setOrderFlag(true);
  };

  const extractCountryInfo = (iso3Code) => {
    const iso2Code = countriesDataJSON.countriesCollection[iso3Code.toUpperCase()].iso2;
    const countryName = countriesDataJSON.countriesCollection[iso3Code.toUpperCase()].name;
    const capital = countriesDataJSON.countriesCollection[iso3Code.toUpperCase()].capital;
    setCountryInfo({ iso2Code, countryName, capital });
  };

  const getCountryName = (country) => {
    const countryInfo = countriesDataJSON.countriesCollection[country.toUpperCase()];
    return countryInfo ? t(countryInfo.name) : iso3Code;
  };

  const getIndicatorName = (indicator) => {
    const indicatorKey = indicator.replace(/\./g, '_');
    const indicatorInfo = indicatorDataJSON.indicatorsCollection[indicatorKey];
    return indicatorInfo ? t(indicatorInfo) : indicator;
  };

  function formatValue(value) {
    if (value < 1000000) {
      return value.toLocaleString(i18n.language, {minimumFractionDigits: 0, maximumFractionDigits: 2});
    } else if (value < 1000000000) {
      return (value / 1000000).toLocaleString(i18n.language, {minimumFractionDigits: 0, maximumFractionDigits: 2}) + ' ' + t('info.million');
    } else if (value < 1000000000000) {
      return (value / 1000000000).toLocaleString(i18n.language, {minimumFractionDigits: 0, maximumFractionDigits: 2}) + ' ' + t('info.billion');
    } else {
      return (value / 1000000000000).toLocaleString(i18n.language, {minimumFractionDigits: 0, maximumFractionDigits: 2}) + ' ' + t('info.trillion');
    }
  }

  return (
    <>
      {(selectedInfo !== null && selectedInfo.length !== 0) && 
        (
          <div className={`info-container${collapsed ? ' collapsed' : ''} ${loading ? ' loading' : ''}`}>
            {countryInfo && countryData.length > 0 && !closed && !searching && !loading &&
              <>
                <div className='indicator-container-header'>
                  <div className='country-info'>
                    <img
                      src={`https://flagsapi.com/${countryInfo.iso2Code}/flat/64.png`}
                      alt={`${countryInfo.countryName} flag`}
                      onError={(e) => { e.target.classList.add('hidden'); }}
                    />
                    <div className='country-details'>
                      <h1>{t(countryInfo.countryName)}</h1>
                      <h2>{t(countryInfo.capital)}</h2>
                    </div>
                  </div>
                  <div className='indicator-container-buttons'>
                    <button className='button-collapse' onClick={(e) => {setCollapsed(!collapsed); e.preventDefault();}}><Collapse/></button>
                    <button onClick={(e) => {onClose(true); setClosed(true); e.preventDefault();}}><Clear/></button>
                  </div>
                </div>
                <div className='table table-country'>
                  <div className='table-header'>
                    <div>{t('info.indicator')}</div>
                    <div>{t('info.value')}<span className='indicator-info-date'>({currentYear})</span></div>
                  </div>
                  <div className='table-body'>
                    {countryData.map((item, index) => (
                      <div className='table-row' key={index}>
                        <div className='table-cell'>{getIndicatorName(item.indicator.id)}</div>
                        <div className='table-cell' title={item.value != null && item.value >= 1000000 ? item.value.toLocaleString(i18n.language, {minimumFractionDigits: 0, maximumFractionDigits: 2}) : item.value == null ? '' : ''}>
                          {item.value !== null ? formatValue(item.value) : '-'} {item.value !== null && item.date !== null && item.date !== currentYear ? `(${item.date})` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            }
            {indicatorData.length > 0 && !closed && !searching && !loading &&
              <>
                <div className='indicator-container-header'>
                  <div className='indicator-info'>
                    <h1>{getIndicatorName(infoValue)}<span className='indicator-info-date'>({currentYear})</span></h1>
                  </div>
                  <div className='indicator-container-buttons'>
                    <button className='button-collapse' onClick={(e) => {setCollapsed(!collapsed); e.preventDefault();}}><Collapse/></button>
                    <button onClick={(e) => {onClose(true); setClosed(true); e.preventDefault();}}><Clear/></button>
                  </div>
                </div>
                <div className='table table-indicator'>
                  <div className='table-header'>
                    <div onClick={() => { const newValue = sortOrderByName === null ? 'asc' : sortOrderByName === 'asc' ? 'desc' : 'asc'; sortIndicatorDataByName(newValue);}} className={sortOrderByName}><span>{t('info.country')}</span><Sort/></div>
                    <div onClick={sortIndicatorDataByValue} className={sortOrderByValue}><span>{t('info.value')}</span><Sort/></div>
                  </div>
                  <div className='table-body'>
                    {indicatorData.map((item, index) => (
                      <div className='table-row' key={index}>
                        <div className='table-cell'>{getCountryName(item.countryiso3code)}</div>
                        <div className='table-cell' title={item.value != null && item.value >= 1000000 ? item.value.toLocaleString(i18n.language, {minimumFractionDigits: 0, maximumFractionDigits: 2}) : item.value == null ? '' : ''}>
                          {item.value !== null ? formatValue(item.value) : '-'} {item.value !== null && item.date !== null && item.date !== currentYear ? `(${item.date})` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            }
            {loading &&
              <>
                { infoType === 'country' ?
                  <div className='loading-country'>
                    <div className='loading-country-header'>
                      <div className='flag placeholder'>
                        <div className='animated-background'></div>
                      </div>
                      <div className='loading-country-details'>
                        <div className='h1 placeholder'>
                          <div className='animated-background'></div>
                        </div>
                        <div className='h2 placeholder'>
                          <div className='animated-background'></div>
                        </div>
                      </div>
                    </div>
                    <div className='loading-table'>
                      <div className='table-placeholder placeholder'>
                        <div className='animated-background'></div>
                      </div>
                      <div className='table-placeholder placeholder'>
                        <div className='animated-background'></div>
                      </div>
                      <div className='table-placeholder placeholder'>
                        <div className='animated-background'></div>
                      </div>
                      <div className='table-placeholder placeholder'>
                        <div className='animated-background'></div>
                      </div>
                    </div>
                  </div>
                  :
                  <div className='loading-indicator'>
                    <div className='loading-indicator-header'>
                      <div className='h1 placeholder'>
                        <div className='animated-background'></div>
                      </div>
                    </div>
                    <div className='loading-table'>
                      <div className='table-placeholder placeholder'>
                        <div className='animated-background'></div>
                      </div>
                      <div className='table-placeholder placeholder'>
                        <div className='animated-background'></div>
                      </div>
                      <div className='table-placeholder placeholder'>
                        <div className='animated-background'></div>
                      </div>
                      <div className='table-placeholder placeholder'>
                        <div className='animated-background'></div>
                      </div>
                    </div>
                  </div>
                }
              </>
            }
          </div>
        )
      }
    </>
  );
};

export default Info;
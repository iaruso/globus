import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import countriesDataJSON from '../assets/countries.json';
import indicatorDataJSON from '../assets/categories.json';

const Info = ({ selectedInfo }) => {
  const [infoValue, setInfoValue] = useState(null);
  const [countryData, setCountryData] = useState([]);
  const [indicatorData, setIndicatorData] = useState([]);
  const [countryInfo, setCountryInfo] = useState(null);
  const [searchFlag, setSearchFlag] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (selectedInfo && !searchFlag) {
      setCountryData([]);
      setIndicatorData([]);
      setSearchFlag(true);
      if (typeof selectedInfo === 'string') {
        setInfoValue(selectedInfo);
        fetchData(selectedInfo);
        extractCountryInfo(selectedInfo);
      } else if (typeof selectedInfo === 'object') {
        if (selectedInfo[0]?.value.length === 3) {
          const iso3Code = selectedInfo[0]?.value.toUpperCase();
          setInfoValue(iso3Code);
          fetchData(iso3Code);
          extractCountryInfo(iso3Code);
        } else if (selectedInfo.length === 0){
          setInfoValue(null);
        } else {
          const indicatorValue = selectedInfo[0]?.value;
          setInfoValue(indicatorValue);
          fetchIndicatorData(indicatorValue);
        }
      } else {
        setInfoValue(null);
      }
    }
  }, [selectedInfo]);

  const fetchData = async (value, year = 2023, nullIndicators = []) => {
    try {
      const locale = i18n.language.split('-')[0];
      
        const indicatorString = nullIndicators.length > 0 ? nullIndicators.join(';') : 'AG.SRF.TOTL.K2;SP.POP.TOTL;SP.POP.GROW;EN.POP.DNST;NY.GDP.MKTP.CD;NY.GDP.MKTP.KD.ZG;NY.GDP.PCAP.CD;NE.GDI.TOTL.ZS;GC.TAX.TOTL.GD.ZS;SL.UEM.TOTL.NE.ZS;SI.POV.NAHC;SP.DYN.LE00.IN;SE.ADT.LITR.ZS;SH.STA.BRTC.ZS;SH.DYN.MORT;SP.DYN.CONU.ZS;SP.DYN.TFRT.IN;SE.PRM.CMPT.ZS;SE.ENR.PRSC.FM.ZS;EG.USE.PCAP.KG.OE;EN.ATM.CO2E.PC;AG.LND.FRST.K2;ER.PTD.TOTL.ZS;NE.EXP.GNFS.ZS;NE.IMP.GNFS.ZS;TG.VAL.TOTL.GD.ZS;NE.TRD.GNFS.ZS;SH.H2O.BASW.ZS;SH.STA.BASS.ZS;EG.USE.ELEC.KH.PC;IT.CEL.SETS.P2;SP.URB.GROW';
        const response = await axios.get(`http://api.worldbank.org/v2/${locale}/country/${value}/indicator/${indicatorString}?source=2&format=json&page=1&date=${year}`);
        const newData = response.data[1];
        const newNullIndicators = newData.filter(item => item.value === null).map(item => item.indicator.id);
        if (newNullIndicators.length > 0 && year > 2013) { // Limit to 10 years of recursion
          const recursiveData = await fetchData(value, year - 1, newNullIndicators);
          return [...newData, ...recursiveData];
        } else {
          console.log('newData:', newData);
          setSearchFlag(false);
          return newData;
        }
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  };

  const fetchIndicatorData = async (indicator, year = 2023, nullIndicators = []) => {
    try {
      const locale = i18n.language.split('-')[0];
      const iso2Codes = Object.values(countriesDataJSON.countriesCollection).map(country => country.iso2);
      const iso2String = nullIndicators.length > 0 ? nullIndicators.join(';') : iso2Codes.join(';');
      let allData = [];

      // Fetch data from each page until all data is retrieved
      let currentPage = 1;
      while (true) {
        const response = await axios.get(`http://api.worldbank.org/v2/${locale}/country/${iso2String}/indicator/${indicator}?format=json&dataformat=list&date=${year}&page=${currentPage}`);
        const newData = response.data[1];
        allData.push(...newData);

        // Check if there are more pages
        if (newData.length < 50) {
          break; // Break the loop if there are no more pages
        }

        currentPage++; // Move to the next page
      }

      const newNullIndicators = allData.filter(item => item.value === null).map(item => item.country.id);
      if (newNullIndicators.length > 0 && year > 2013) { // Limit to 10 years of recursion
        const recursiveData = await fetchIndicatorData(indicator, year - 1, newNullIndicators);
        return [...allData, ...recursiveData];
      } else {
        setSearchFlag(false);
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
    // Combine new data with existing data
    const updatedData = [...countryData];
    newData.forEach(newItem => {
      const existingItemIndex = updatedData.findIndex(item => item.indicator.id === newItem.indicator.id);
      if (existingItemIndex !== -1) {
        // If indicator already exists, replace it  
        updatedData[existingItemIndex] = newItem;
      } else {
        // If indicator doesn't exist, add it
        updatedData.push(newItem);
      }
    });
    // Update the state with the combined data
    setCountryData(updatedData);
  };

  const updateIndicatorData = (newData) => {
    // Combine new data with existing data
    const updatedData = [...indicatorData];
    newData.forEach(newItem => {
      const existingItemIndex = updatedData.findIndex(item => item.country.id === newItem.country.id);
      if (existingItemIndex !== -1) {
        // If country already exists, replace it
        updatedData[existingItemIndex] = newItem;
      } else {
        // If country doesn't exist, add it
        updatedData.push(newItem);
      }
    });
    // Update the state with the combined data
    setIndicatorData(updatedData);
  };

  const formatValue = (value) => {
    return typeof value === 'number' ? value.toFixed(2) : value;
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
    const indicatorInfo = indicatorDataJSON.categoriesCollection[indicatorKey];
    return indicatorInfo ? t(indicatorInfo) : indicator;
  };

  return (
    <>
      {countryInfo && countryData.length > 0 && 
        <div className='info-container'>
          <div className='country-info'>
            <img src={`https://flagsapi.com/${countryInfo.iso2Code}/flat/64.png`} alt={`${countryInfo.countryName} flag`} />
            <div className='country-details'>
              <h1>{t(countryInfo.countryName)}</h1>
              <h2>{t(countryInfo.capital)}</h2>
            </div>
          </div>
          <div className='table'>
            <div className='table-header'>
              <div>Indicator</div>
              <div>Value</div>
            </div>
            <div className='table-body'>
              {countryData.map((item, index) => (
                <div className='table-row' key={index}>
                  <div className="table-cell">{getIndicatorName(item.indicator.id)}</div>
                  <div className="table-cell">{item.value !== null ? formatValue(item.value) : "No data"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      {indicatorData.length > 0 &&
        <div className='info-container'>
          <div className='indicator-info'>
            <h1>{getIndicatorName(infoValue)}</h1>
          </div>
          <div className="table">
            <div className="table-header">
              <div>Country</div>
              <div>Value</div>
            </div>
            <div className="table-body">
              {indicatorData.map((item, index) => (
                <div className="table-row" key={index}>
                  <div className="table-cell">{getCountryName(item.countryiso3code)}</div>
                  <div className="table-cell">{item.value !== null ? formatValue(item.value) : "No data"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    </>
  );
};

export default Info;
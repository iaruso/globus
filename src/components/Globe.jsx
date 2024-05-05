import React, { useEffect, useRef, useContext } from 'react';
import { WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight, Color, MeshBasicMaterial } from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; 
import ThreeGlobe from 'three-globe';
import { useTranslation } from 'react-i18next';
import globeData from '../assets/globe-data.json';
import countries from '../assets/countries.json';
import { GlobeContext } from '../App';

const Globe = ({ theme, onCountrySelect, selectedInfo, onSearching }) => {
  const containerRef = useRef(null);
  const { t, i18n } = useTranslation();

  let renderers, camera, scene, controls;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  let mouseX = 0;
  let mouseY = 0;

  const { contextIndicatorData } = useContext(GlobeContext);

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

  const initializeGlobe = () => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    let savedTheme = localStorage.getItem('theme');

    if (!savedTheme) {
      savedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
    }    
    let atmosphereLevel;
    let bgColor, globeColor, atmosphereColor, polygonColor, ambientLightColor, emissionLightColor;

    if (savedTheme === 'dark') {
      bgColor = '#212121';
      globeColor = '#2B2B2B';
      atmosphereColor = '#2B2B2B';
      polygonColor = 'rgba(173,181,189,0.8)';
      ambientLightColor = '#1A1A1A';
      emissionLightColor = '#FFFFFF';
      atmosphereLevel = 0.04;
    } else {
      bgColor = '#FCFDFE';
      globeColor = '#F8F9FA';
      atmosphereColor = '#EBEEF0';
      polygonColor = 'rgba(200,200,200,0.6)';
      ambientLightColor = '#EBEEF0';
      emissionLightColor = '#8566CC';
      atmosphereLevel = 0.02;
    }

    const getCategory = (indicatorId) => {
      const indicatorCategoryMapping = {
        'AG.SRF.TOTL.K2': 'Basic Country Information',
        'SP.POP.TOTL': 'Basic Country Information',
        'SP.POP.GROW': 'Basic Country Information',
        'EN.POP.DNST': 'Basic Country Information',
        'NY.GDP.MKTP.CD': 'Economic Indicators',
        'NY.GDP.MKTP.KD.ZG': 'Economic Indicators',
        'NY.GDP.PCAP.CD': 'Economic Indicators',
        'NE.GDI.TOTL.ZS': 'Economic Indicators',
        'GC.TAX.TOTL.GD.ZS': 'Economic Indicators',
        'Inflation Rate': 'Economic Indicators',
        'SL.UEM.TOTL.NE.ZS': 'Economic Indicators',
        'SI.POV.NAHC': 'Economic Indicators',
        'SP.DYN.LE00.IN': 'Social Indicators',
        'SE.ADT.LITR.ZS': 'Social Indicators',
        'SH.STA.BRTC.ZS': 'Social Indicators',
        'SH.DYN.MORT': 'Social Indicators',
        'SP.DYN.CONU.ZS': 'Social Indicators',
        'SP.DYN.TFRT.IN': 'Social Indicators',
        'SE.PRM.CMPT.ZS': 'Social Indicators',
        'SE.ENR.PRSC.FM.ZS': 'Social Indicators',
        'EG.USE.PCAP.KG.OE': 'Environmental Indicators',
        'EN.ATM.CO2E.PC': 'Environmental Indicators',
        'AG.LND.FRST.K2': 'Environmental Indicators',
        'ER.PTD.TOTL.ZS': 'Environmental Indicators',
        'NE.EXP.GNFS.ZS': 'Trade',
        'NE.IMP.GNFS.ZS': 'Trade',
        'TG.VAL.TOTL.GD.ZS': 'Trade',
        'NE.TRD.GNFS.ZS': 'Trade',
        'SH.H2O.BASW.ZS': 'Development Indicators',
        'SH.STA.BASS.ZS': 'Development Indicators',
        'EG.USE.ELEC.KH.PC': 'Development Indicators',
        'IT.CEL.SETS.P2': 'Development Indicators',
        'SP.URB.GROW': 'Development Indicators'
      };
      return indicatorCategoryMapping[indicatorId] || 'Other';
    };

    let selectedCountry, selectedIndicator, selectedCategory;
    if(selectedInfo) {
      if (typeof selectedInfo === 'string') {
        selectedCountry = selectedInfo.toUpperCase();
      } else if (typeof selectedInfo === 'object') {
        if (selectedInfo[0]?.value.length === 3) {
          selectedCountry = selectedInfo[0]?.value.toUpperCase();
        } else if (selectedInfo.length === 0) {
          selectedCountry = null;
        } else {
          selectedIndicator = true;
          selectedCategory = getCategory(selectedInfo[0].value);
        }
      }
    }

    const getColorIntervals = (category, theme) => {
      if (theme === 'dark') {
        switch (category) {
          case 'Basic Country Information':
            return {
              min: [213, 219, 226],
              max: [104, 123, 132]
            };
          case 'Economic Indicators':
            return {
              min: [255, 203, 162],
              max: [140, 78, 0]
            };
          case 'Social Indicators':
            return {
              min: [178, 200, 255],
              max: [51, 73, 170]
            };
          case 'Environmental Indicators':
            return {
              min: [201, 231, 193],
              max: [62, 138, 55]
            };
          case 'Trade':
            return {
              min: [251, 241, 178],
              max: [165, 148, 0]
            };
          case 'Development Indicators':
            return {
              min: [169, 227, 221],
              max: [21, 110, 96]
            };
          default:
            return {
              min: [173, 181, 189],
              max: [61, 65, 69]
            };
        }
      } else {
        // Light theme
        switch (category) {
          case 'Basic Country Information':
            return {
              min: [193, 201, 209],
              max: [81, 85, 89]
            };
          case 'Economic Indicators':
            return {
              min: [251, 223, 176],
              max: [163, 82, 7]
            };
          case 'Social Indicators':
            return {
              min: [205, 225, 255],
              max: [46, 104, 231]
            };
          case 'Environmental Indicators':
            return {
              min: [228, 241, 220],
              max: [38, 149, 44]
            };
          case 'Trade':
            return {
              min: [249, 241, 175],
              max: [199, 179, 4]
            };
          case 'Development Indicators':
            return {
              min: [212, 244, 241],
              max: [30, 152, 131]
            };
          default:
            return {
              min: [173, 181, 189],
              max: [61, 65, 69]
            };
        }
      }
    };

    renderers = [new WebGLRenderer(), new CSS2DRenderer()];
    renderers.forEach((r, idx) => {
      r.setSize(window.innerWidth, window.innerHeight);
      if (idx > 0) {
        r.domElement.style.position = 'absolute';
        r.domElement.style.top = '0px';
        r.domElement.style.pointerEvents = 'none';
      }
      container.appendChild(r.domElement);
    });

    renderers[0].setPixelRatio(window.devicePixelRatio);

    scene = new Scene();

    let globe;
    if (contextIndicatorData && selectedIndicator) {
      const colorIntervals = getColorIntervals(selectedCategory, savedTheme);

      const minColor = colorIntervals.min;
      const maxColor = colorIntervals.max;

      const generateColorLevels = (minColor, maxColor, levels) => {
        const colorLevels = [];
        for (let i = 0; i < levels; i++) {
          const ratio = i / (levels - 1);
          const color = minColor.map((channel, index) => {
            const minChannelValue = minColor[index];
            const maxChannelValue = maxColor[index];
            return Math.round(minChannelValue + ratio * (maxChannelValue - minChannelValue));
          });
          colorLevels.push(color);
        }
        return colorLevels;
      };

      let colorLevels = generateColorLevels(minColor, maxColor, 10);

      const minMaxValues = contextIndicatorData.reduce(
        (acc, curr) => {
          if (curr.value !== null) {
            acc.min = Math.min(acc.min, curr.value);
            acc.max = Math.max(acc.max, curr.value);
          }
          return acc;
        },
        { min: Infinity, max: -Infinity }
      );

      const iso3ToColor = {};
      contextIndicatorData.forEach(item => {
        if (item.value !== null) {
          const colorIndex = Math.floor(((item.value - minMaxValues.min) / (minMaxValues.max - minMaxValues.min)) * 10);
          iso3ToColor[item.countryiso3code] = colorLevels[colorIndex];
        }
      });

      globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: true })
        .hexPolygonsData(globeData.features)
        .hexPolygonResolution(4)
        .hexPolygonMargin(0.55)
        .hexPolygonUseDots(true)
        .showAtmosphere(true)
        .atmosphereColor(atmosphereColor)
        .atmosphereAltitude(atmosphereLevel)
        .hexPolygonColor((e) => {
          const color = iso3ToColor[e.properties.ISO_A3];
          return color ? `rgba(${color.join(',')},1)` : polygonColor;
        });

      globe.htmlElementsData(contextIndicatorData)
        .htmlLat((d) => parseFloat(countries.countriesCollection[d.countryiso3code].coordinates[0]))
        .htmlLng((d) => parseFloat(countries.countriesCollection[d.countryiso3code].coordinates[1]))
        .htmlAltitude(0.02)
        .htmlElement((d) => {
          const el = document.createElement('button');
          const countryName = countries.countriesCollection[d.countryiso3code].name;
          const value = d.value == null ? '-' : formatValue(d.value);
          el.innerHTML = `${value} <span>${t(countryName)}</span>`;
          el.classList.add('country-button-indicator');
          return el;
        });
    } else {
      globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: true })
        .hexPolygonsData(globeData.features)
        .hexPolygonResolution(4)
        .hexPolygonMargin(0.55)
        .hexPolygonUseDots(true)
        .showAtmosphere(true)
        .atmosphereColor(atmosphereColor)
        .atmosphereAltitude(atmosphereLevel)
        .hexPolygonColor((e) => {
          if ([selectedCountry].includes(e.properties.ISO_A3)) {
            return theme == 'dark' ? 'rgba(222,222,222,1)' : 'rgba(111, 111, 111, 1)';
          } else return polygonColor;
        });

      globe.htmlElementsData(Object.entries(countries.countriesCollection))
        .htmlLat(([, d]) => parseFloat(d.coordinates[0]))
        .htmlLng(([, d]) => parseFloat(d.coordinates[1]))
        .htmlAltitude(0.02)
        .htmlElement(([iso3, d]) => {
          const el = document.createElement('button');
          el.innerHTML = t(d.name);
          el.classList.add('country-button');
          el.dataset.iso3 = iso3.toLowerCase();
          if (iso3.toUpperCase() === selectedCountry) {
            el.classList.add('disabled');
          }

          el.addEventListener('mousedown', (event) => {
            event.preventDefault();
            const iso3 = el.dataset.iso3;
            onCountrySelect(iso3);
          });        
          return el;
        });
    }

    const globeMaterial = new MeshBasicMaterial({
      color: new Color(globeColor)
    });
    globe.position.y = 0;
    globe.globeMaterial(globeMaterial);

    scene.add(globe);
    scene.add(new AmbientLight(new Color(ambientLightColor), 1));
    scene.background = new Color(bgColor);

    camera = new PerspectiveCamera();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    const dLight1 = new DirectionalLight(new Color(emissionLightColor), 2);
    dLight1.shadow.normalBias = 2;
    dLight1.position.set(-200, -100, 200);
    dLight1.castShadow = false;
    camera.add(dLight1);
    camera.position.z = 400;
    camera.position.y = 200;
    if (selectedCountry) {
      const country = countries.countriesCollection[selectedCountry.toUpperCase()];
      const latitude = country.coordinates[0];
      const longitude = country.coordinates[1];
      const altitude = camera.position.z / globe.getGlobeRadius();
      const { x, y, z } = globe.getCoords(latitude, longitude, altitude);
      camera.position.z = z;
      camera.position.x = x;
      camera.position.y = y;
    }

    scene.add(camera);

    controls = new OrbitControls(camera, renderers[0].domElement);
    controls.enableDamping = true;
    controls.dynamicDampingFactor = 0.01;
    controls.enablePan = false;
    controls.minDistance = 150;
    controls.maxDistance = 300;
    controls.rotateSpeed = 0.4;
    controls.zoomSpeed = 1;
    controls.autoRotate = true;
    controls.autoRotateSpeed = -0.05;
    globe.setPointOfView(camera.position, globe.position);
    controls.addEventListener('change', () => globe.setPointOfView(camera.position, globe.position));

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove);

    animate();
  
    onSearching(false);
  };

  useEffect(() => {
    
    if (selectedInfo !== null) {
      if (typeof selectedInfo === 'object') {
        if (!(selectedInfo[0]?.value.length === 3) && selectedInfo.length > 0 && (!contextIndicatorData || contextIndicatorData.length === 0)) {
          return;
        }
      }
    }
    const timerId = setTimeout(initializeGlobe(), 100);

    return () => clearTimeout(timerId);
  }, [theme, onCountrySelect, selectedInfo, i18n.language, contextIndicatorData]);

  useEffect(() => {
    controls && controls.update();
  });

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    windowHalfX = window.innerWidth / 1.5;
    windowHalfY = window.innerHeight / 1.5;
    renderers.forEach((r) => r.setSize(window.innerWidth, window.innerHeight));
  };

  const animate = () => {
    camera && camera.lookAt(scene.position);
    controls && controls.update();
    renderers.forEach((r) => {
      r.render(scene, camera);
    });
    requestAnimationFrame(animate);
  };

  const onMouseMove = (event) => {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
  };

  return (
    <>
      <div ref={containerRef} id='globe-visualizer'></div>
    </>
  )
};

export default Globe;

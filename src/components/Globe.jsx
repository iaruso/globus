import React, { useState, useEffect } from 'react';
import { WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight, Color, Fog, MeshBasicMaterial } from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; 
import ThreeGlobe from 'three-globe';
import { useTranslation } from 'react-i18next';
import globeData from '../assets/globe-data.json';
import countries from '../assets/countries.json';

const Globe = ({ theme, onCountrySelect}) => {
  const containerRef = React.useRef(null);
  const { t, i18n } = useTranslation();

  let renderers, camera, scene, controls;
  let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    let mouseX = 0;
    let mouseY = 0;
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    let savedTheme = localStorage.getItem('theme');
    let atmosphereLevel;
    let bgColor, globeColor, atmosphereColor, polygonColor, ambientLightColor, emissionLightColor;

    if (savedTheme === 'dark') {
      bgColor = '#1A1A1A';
      globeColor = '#222222';
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
    
    let globe;

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
    globe = new ThreeGlobe({ waitForGlobeReady: true, animateIn: true })
      .hexPolygonsData(globeData.features)
      .hexPolygonResolution(4)
      .hexPolygonMargin(0.55)
      .hexPolygonUseDots(true)
      .showAtmosphere(true)
      .atmosphereColor(atmosphereColor)
      .atmosphereAltitude(atmosphereLevel)
      .hexPolygonColor((e) => {
        if (
          [''].includes(
            e.properties.ISO_A3
          )
        ) {
          return 'rgba(131, 255, 105, 1)';
        } else return polygonColor;
      });

      globe.htmlElementsData(Object.entries(countries.countriesCollection))
    .htmlLat(([, d]) => parseFloat(d.coordinates[0]))
    .htmlLng(([, d]) => parseFloat(d.coordinates[1]))
    .htmlAltitude(0.02)
    .htmlElement(([iso3, d]) => {
      const el = document.createElement('a');
      el.innerHTML = t(d.name);
      el.classList.add('country-button');
      el.dataset.iso3 = iso3.toLowerCase();
      el.addEventListener('click', (event) => {
        event.preventDefault();
        const iso3 = el.dataset.iso3;
        onCountrySelect(iso3);
      });
      return el;
    });

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

    return () => {
      window.removeEventListener('resize', onWindowResize);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [theme, i18n.language]);


  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    windowHalfX = window.innerWidth / 1.5;
    windowHalfY = window.innerHeight / 1.5;
    renderers.forEach((r) => r.setSize(window.innerWidth, window.innerHeight));
  };

  const animate = () => {
    camera.lookAt(scene.position);
    controls.update();
    renderers.forEach((r) => {
      r.render(scene, camera);
    });
    requestAnimationFrame(animate);
  };
  

  const onMouseMove = (event) => {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
  };

  return <div ref={containerRef} id='globe-visualizer'></div>;
};

export default Globe;

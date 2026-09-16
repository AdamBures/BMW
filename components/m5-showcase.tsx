'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls, useGLTF, Html, Center } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Mesh, MeshPhysicalMaterial, MeshStandardMaterial } from 'three'
import { Color } from 'three'
import * as THREE from 'three'
import {
  RotateCcw,
  Search,
  Zap,
  Rotate3D,
  Gauge,
  Activity,
  Box,
  Settings2,
  CarFront,
  Ruler,
  BatteryCharging,
  ChevronDown
} from 'lucide-react'

const VEHICLE_MODEL_URL = '/bmw_m5_cs_f90.glb'

function CountUp({ value, duration = 1000, decimals = 0 }: { value: number, duration?: number, decimals?: number }) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  
  useEffect(() => {
    let startValue = countRef.current
    if (startValue === value) return
    
    let currentValue = startValue
    const stepTime = 16 // roughly 60fps
    const steps = duration / stepTime
    const increment = (value - startValue) / steps
    
    const timer = setInterval(() => {
      currentValue += increment
      
      if ((increment > 0 && currentValue >= value) || (increment < 0 && currentValue <= value)) {
        setCount(value)
        countRef.current = value
        clearInterval(timer)
      } else {
        setCount(currentValue)
        countRef.current = currentValue
      }
    }, stepTime)
    
    return () => clearInterval(timer)
  }, [value, duration])
  
  return <span>{count.toFixed(decimals)}</span>
}

function LoadedVehicle({ paint }: { paint: string }) {
  const { scene } = useGLTF(VEHICLE_MODEL_URL)
  const model = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    const meshes: Mesh[] = []
    model.traverse((object: any) => {
      if (!object.isMesh) return
      const mesh = object as Mesh
      meshes.push(mesh)
      mesh.castShadow = true
      mesh.receiveShadow = true
    })

    const bodyMeshes = meshes.filter((mesh) => {
      const name = `${mesh.name} ${mesh.material instanceof Array ? mesh.material.map((material: any) => material.name).join(' ') : (mesh.material as any).name}`.toLowerCase()
      return ['body', 'bonnet', 'boot', 'door'].some(part => name.includes(part))
    })
    const paintTargets = bodyMeshes.length > 0 ? bodyMeshes : meshes.slice(0, 5)

    paintTargets.forEach((mesh) => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((material: any) => {
        const coloredMaterial = material as MeshPhysicalMaterial | MeshStandardMaterial
        if ('color' in coloredMaterial) {
          coloredMaterial.color = new Color(paint)
          coloredMaterial.metalness = 0.6
          coloredMaterial.roughness = 0.3
        }
      })
    })
  }, [model, paint])

  return <primitive object={model} />
}

function VehicleLoading() {
  return <Html center><div style={{ color: 'white' }}>Loading 3D Model...</div></Html>
}

useGLTF.preload(VEHICLE_MODEL_URL)

const ENGINES = {
  'M5_HYBRID': {
    name: '4.4L V8 M HYBRID',
    desc: 'PHEV M Hybrid system combining V8 with electric propulsion.',
    power: 727,
    torque: 1000,
    zeroToHundred: 3.5,
    topSpeed: 305
  },
  'M5_COMPETITION': {
    name: '4.4L V8 M COMPETITION',
    desc: 'High-revving tuned V8 with track-optimized hybrid delivery.',
    power: 748,
    torque: 1050,
    zeroToHundred: 3.3,
    topSpeed: 315
  },
  '550e_PHEV': {
    name: '3.0L INLINE-6 PHEV',
    desc: 'Efficient inline-6 combined with eDrive technology.',
    power: 489,
    torque: 700,
    zeroToHundred: 4.3,
    topSpeed: 250
  }
}

const TRANSMISSIONS = {
  'M_STEPTRONIC': {
    name: '8-SPEED M STEPTRONIC',
    desc: 'Enhanced gear shifts for maximum performance.'
  },
  'SPORT_AUTO': {
    name: '8-SPEED SPORT AUTO',
    desc: 'Smooth and rapid gear changes for everyday driving.'
  },
  'M_DCT': {
    name: '7-SPEED M DCT',
    desc: 'Dual-clutch transmission for track-focused shifting.'
  }
}

function CameraZoomController({ isZoomed }: { isZoomed: boolean }) {
  useFrame((state) => {
    // Zoom in means lower FOV
    const targetFov = isZoomed ? 25 : 65
    // @ts-ignore - fov exists on PerspectiveCamera
    if (state.camera.fov !== undefined) {
      // @ts-ignore
      state.camera.fov += (targetFov - state.camera.fov) * 0.1
      state.camera.updateProjectionMatrix()
    }
  })
  return null
}

export function M5Showcase() {
  const [paint, setPaint] = useState('#56616b')
  const [activeTab, setActiveTab] = useState('Interactive 3D')
  const [driveMode, setDriveMode] = useState('4WD')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [engineKey, setEngineKey] = useState<keyof typeof ENGINES>('M5_HYBRID')
  const [transKey, setTransKey] = useState<keyof typeof TRANSMISSIONS>('M_STEPTRONIC')
  const [isAutoRotate, setIsAutoRotate] = useState(true)
  const [isZoomed, setIsZoomed] = useState(false)
  const [wheels, setWheels] = useState('Style 951')
  const [interior, setInterior] = useState('Black Merino Leather')

  const cycleEngine = () => {
    const keys = Object.keys(ENGINES) as (keyof typeof ENGINES)[]
    setEngineKey(keys[(keys.indexOf(engineKey) + 1) % keys.length])
  }

  const cycleTransmission = () => {
    const keys = Object.keys(TRANSMISSIONS) as (keyof typeof TRANSMISSIONS)[]
    setTransKey(keys[(keys.indexOf(transKey) + 1) % keys.length])
  }

  const currentEngine = ENGINES[engineKey]
  const currentTrans = TRANSMISSIONS[transKey]
  const zthAdjusted = driveMode === '2WD' ? currentEngine.zeroToHundred + 0.3 : currentEngine.zeroToHundred

  const tabs = ['Overview', 'Specifications', 'Interactive 3D', 'Configuration']

  const handleTabChange = (tab: string) => {
    if (tab === activeTab || isTransitioning) return
    setIsTransitioning(true)
    
    setTimeout(() => {
      setActiveTab(tab)
    }, 500)

    setTimeout(() => {
      setIsTransitioning(false)
    }, 600)
  }

  return (
    <main className="m5-page" style={{ overflowY: 'auto' }}>
      <AnimatePresence>
        {isTransitioning && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#080c10', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', inset: -100, display: 'flex', transform: 'skewX(-25deg)' }}>
               <div style={{ flex: 1, background: '#0082d7' }}></div>
               <div style={{ flex: 1, background: '#1a225e' }}></div>
               <div style={{ flex: 1, background: '#db001b' }}></div>
            </div>
            
            <motion.div 
               initial={{ scale: 0, rotate: -180 }}
               animate={{ scale: 1, rotate: 0 }}
               exit={{ scale: 0, rotate: 180 }}
               transition={{ duration: 0.5, delay: 0.1 }}
               style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 140, height: 140, borderRadius: '50%', background: 'transparent', boxShadow: '0 0 60px rgba(0,0,0,0.5)' }}
            >
               <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg" alt="BMW Logo" style={{ width: '100%', height: '100%' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="m5-nav" style={{ position: 'relative', zIndex: 50 }}>
        <a className="brand" href="#" aria-label="BMW M5 home">
          <span className="brand-roundel">BMW</span>
          <span className="brand-model">BMW M5</span>
          <span className="brand-m">M</span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          {tabs.map(tab => (
            <a 
              key={tab} 
              href="#" 
              className={activeTab === tab ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); handleTabChange(tab) }}
            >
              {tab}
            </a>
          ))}
        </nav>
      </header>

      {activeTab === 'Interactive 3D' && (
        <motion.div 
          className="main-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="left-section">
            <div className="canvas-container">
              <Canvas shadows camera={{ position: [10.0, 4.5, 11.0], fov: 65 }}>
                <CameraZoomController isZoomed={isZoomed} />
                <ambientLight intensity={1.5} />
                <spotLight position={[5, 10, 5]} intensity={150} angle={0.4} penumbra={1} castShadow />
                <spotLight position={[-5, 5, -5]} intensity={80} angle={0.5} penumbra={1} />
                <Suspense fallback={<VehicleLoading />}>
                  <Center position={[0, -0.5, 0]}>
                    <LoadedVehicle paint={paint} />
                  </Center>
                </Suspense>
                <ContactShadows position={[0, -1.0, 0]} opacity={0.8} scale={15} blur={2.5} far={4} />
                <Environment preset="studio" />
                <OrbitControls enablePan={false} minDistance={3} maxDistance={18} maxPolarAngle={Math.PI / 2 - 0.05} target={[0, 0, 0]} autoRotate={isAutoRotate} autoRotateSpeed={1.0} />
              </Canvas>
            </div>
            <div className="canvas-controls">
              <button 
                onClick={() => setIsAutoRotate(!isAutoRotate)} 
                style={{ color: isAutoRotate ? 'white' : '#a0aab2' }}
              >
                <RotateCcw size={14} /> ROTATE
              </button>
              <button 
                onClick={() => setIsZoomed(!isZoomed)}
                style={{ color: isZoomed ? 'white' : '#a0aab2' }}
              >
                <Search size={14} /> ZOOM
              </button>
              <button 
                onClick={() => handleTabChange('Configuration')}
                style={{ color: 'white' }}
              >
                <span style={{display:'inline-block', width:12, height:12, borderRadius:'50%', background:paint, marginRight:4}}></span> COLOR: SELECTED
              </button>
            </div>
            <motion.div 
              className="gallery-container"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="gallery-title">GALERIE</div>
              <motion.div 
                className="gallery-grid"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.7 } }
                }}
              >
                {[
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQK2ZobdH-HUZiVaMT4k9CPGpi2Rov093oKDHRNEUdZXQ&s=10",
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqmlAZqDDraqV0xmeAbeACKPcwrTuDSSCGnXVotx0Z0g&s=10",
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT16_RKJfBqe3UeV8kk2M7k6uMeepYu7D0CRRv8gNsKog&s=10",
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuE_17YfpyCy0NtxGUZtEK44XYkULbUJV7bO4onlxirISNHTohORmj4OCr&s=10"
                ].map((url, i) => (
                  <motion.div 
                    key={i}
                    className="gallery-item"
                    variants={{
                      hidden: { opacity: 0, scale: 0.8 },
                      visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                    }}
                    whileHover={{ y: -5, scale: 1.05, cursor: 'pointer' }}
                  >
                    <img src={url} alt={`Gallery view ${i + 1}`} />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          <div className="right-section">
            <div className="section-title">PERFORMANCE DATA & SPECIFICATIONS</div>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header"><Zap size={14} /> POWER</div>
                <div className="metric-value"><CountUp value={currentEngine.power} /> HP</div>
                <div className="metric-sub">(combined)</div>
                <div className="metric-visual">
                  <div className="bar-chart">
                    <motion.div initial={{ height: 0 }} animate={{ height: '30%' }} transition={{ duration: 0.8, delay: 0.1 }}></motion.div>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${Math.min(currentEngine.power / 10, 100)}%` }} transition={{ duration: 0.8, delay: 0.2 }} style={{ background: 'linear-gradient(to top, #3a5c78, #4f8dc0)' }}></motion.div>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${Math.min(currentEngine.power / 8, 100)}%` }} transition={{ duration: 0.8, delay: 0.3 }} style={{ background: 'linear-gradient(to top, #7b3345, #e34c67)' }}></motion.div>
                  </div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-header"><Rotate3D size={14} /> TORQUE</div>
                <div className="metric-value"><CountUp value={currentEngine.torque} /> Nm</div>
                <div className="metric-visual" style={{width: '100%'}}>
                   <svg viewBox="0 0 100 40" className="line-chart">
                     <motion.path d="M0,35 C20,35 30,10 50,10 C70,10 80,15 100,30" className="blue" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
                     <motion.path d="M0,40 C15,40 25,5 50,5 C75,5 85,25 100,35" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.2 }} />
                   </svg>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-header"><Activity size={14} /> 0-100 KM/H</div>
                <div className="metric-value"><CountUp value={zthAdjusted} decimals={1} /> sec</div>
                <div className="metric-visual" style={{flexDirection: 'column', width: '100%', alignItems: 'stretch', justifyContent: 'flex-end'}}>
                   <div className="metric-value" style={{textAlign: 'center', fontSize: '12px'}}>
                     <CountUp value={zthAdjusted} decimals={1} /> sec
                   </div>
                   <div className="progress-bar">
                     <motion.div 
                       className="progress-fill" 
                       initial={{ width: 0 }} 
                       animate={{ width: `${zthAdjusted * 10}%` }} 
                       transition={{ duration: 0.8 }}
                     ></motion.div>
                   </div>
                   <div className="progress-labels">
                     <span>0</span><span>305</span><span>500</span>
                   </div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-header"><Gauge size={14} /> TOP SPEED</div>
                <div className="metric-value"><CountUp value={currentEngine.topSpeed} /> KM/H</div>
                <div className="metric-sub">(M Driver's Package)</div>
                <div className="metric-visual">
                  <div className="gauge-container">
                    <motion.div 
                      className="gauge-arc"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: (currentEngine.topSpeed - 200) / 150 * 180 - 90, opacity: 1 }}
                      transition={{ duration: 1, type: "spring" }}
                    ></motion.div>
                  </div>
                </div>
              </div>
              <motion.div className="engine-details" whileHover={{ scale: 1.02 }} style={{ cursor: 'pointer' }} onClick={cycleEngine}>
                <Box size={24} />
                <div>
                  <div className="metric-header" style={{padding:0, margin:0}}>ENGINE (CLICK TO CYCLE)</div>
                  <div className="metric-value" style={{fontSize: '14px', marginTop: 4}}>{currentEngine.name}</div>
                  <div className="metric-sub">{currentEngine.desc}</div>
                </div>
              </motion.div>
              <motion.div className="transmission-details" whileHover={{ scale: 1.02 }} style={{ cursor: 'pointer' }} onClick={cycleTransmission}>
                <Settings2 size={24} />
                <div>
                  <div className="metric-header" style={{padding:0, margin:0}}>TRANSMISSION (CLICK TO CYCLE)</div>
                  <div className="metric-value" style={{fontSize: '14px', marginTop: 4}}>{currentTrans.name}</div>
                  <div className="metric-sub">{currentTrans.desc}</div>
                </div>
              </motion.div>
              <div className="xdrive-card">
                <div className="xdrive-left">
                  <Box size={16} color="#a0aab2"/>
                  <div>
                    <div style={{fontWeight:'bold', fontSize:'12px'}}>M xDRIVE</div>
                    <div style={{fontSize:'10px', color: '#a0aab2'}}>ALL-WHEEL DRIVE</div>
                  </div>
                </div>
                <div className="toggle-switch" onClick={() => setDriveMode(driveMode === '4WD' ? '2WD' : '4WD')} style={{ cursor: 'pointer' }}>
                  <span style={{ color: driveMode === '2WD' ? 'white' : '#a0aab2' }}>2WD</span>
                  <div className="toggle-track">
                    <motion.div 
                      className="toggle-thumb"
                      animate={{ right: driveMode === '4WD' ? '2px' : '18px' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    ></motion.div>
                  </div>
                  <span style={{ color: driveMode === '4WD' ? 'white' : '#a0aab2' }}>4WD</span>
                </div>
              </div>
            </div>
            
            <div className="section-title" style={{marginTop: '16px'}}>INTERACTIVE HOTSPOTS</div>
            <div className="hotspots-container">
              <motion.div className="hotspot-card" whileHover={{ y: -5, cursor: 'pointer' }}>
                <div className="title">EXPLORE ENGINE</div>
                <div className="hotspot-img"><img src="https://hips.hearstapps.com/hmg-prod/amv-prod-cad-assets/images/media/51/2018-bmw-m5-inline4-photo-697612-s-original.jpg" alt="Engine"/></div>
              </motion.div>
              <motion.div className="hotspot-card" whileHover={{ y: -5, cursor: 'pointer' }}>
                <div className="title">VIEW INTERIOR</div>
                <div className="hotspot-img"><img src="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop" alt="Interior"/></div>
              </motion.div>
              <motion.div className="hotspot-card" whileHover={{ y: -5, cursor: 'pointer' }}>
                <div className="title">M CARBON BRAKES</div>
                <div className="hotspot-img"><img src="https://cargym.com/cdn/shop/files/Genuine_BMW_M_Performance_Retrofit_Carbon_Ceramic_Brake_Kit_for_BMW_F90_F90_LCI_M5_M5_Competition_M5_CS_640x.jpg?v=1788294760" alt="Brakes"/></div>
              </motion.div>
            </div>
            <motion.button 
              className="start-config-btn" 
              onClick={() => handleTabChange('Configuration')}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.98 }}
            >
              START CONFIGURATION
            </motion.button>
          </div>
        </motion.div>
      )}

      {activeTab === 'Overview' && (
        <motion.div 
          className="hide-scrollbar"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5 }} 
          style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', zIndex: 10, background: '#171b21', scrollBehavior: 'smooth' }}
        >
          <div style={{ height: '70vh', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 80px' }}>
            <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: '#000' }}>
              <img src="https://bmw.scene7.com/is/image/BMW/Stage-td-sun-protection:16to7?fmt=webp&wid=2560&fit=wrap%2C+1" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.7 }} alt="BMW M5 Background" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(23,27,33,1) 100%)' }} />
            </div>
            
            <div 
              onClick={() => {
                 document.getElementById('overview-content')?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.8 }}
            >
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                 <ChevronDown size={32} />
              </motion.div>
            </div>
          </div>

          <div id="overview-content" style={{ padding: '80px 24px', marginTop: '40vh', maxWidth: '900px', margin: '40vh auto 0 auto', color: '#fff' }}>
            <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>The All-New BMW M5 (G90)</h1>
            <p style={{ fontSize: '18px', color: '#a0aab2', marginBottom: '40px' }}>
              The seventh generation of the high-performance sedan introduces electrified drive for the first time. The M HYBRID system delivers a combined output of 535 kW (727 hp) and a system torque of 1,000 Nm.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="metric-card">
                <BatteryCharging size={24} color="#54a9e8" />
                <h3 style={{ marginTop: '16px', fontSize: '20px' }}>M HYBRID System</h3>
                <p style={{ color: '#a0aab2', marginTop: '8px' }}>
                  Combines a high-revving 4.4-liter V8 engine with M TwinPower Turbo technology and a deeply integrated electric motor. The electric motor alone produces 145 kW (197 hp) and 280 Nm of torque.
                </p>
              </div>
              <div className="metric-card">
                <Zap size={24} color="#54a9e8" />
                <h3 style={{ marginTop: '16px', fontSize: '20px' }}>Electric Range</h3>
                <p style={{ color: '#a0aab2', marginTop: '8px' }}>
                  The high-voltage battery offers 18.6 kWh of usable energy, enabling an electric range of 67 - 69 kilometers (WLTP) in purely electric mode, with electric speeds up to 140 km/h.
                </p>
              </div>
              <div className="metric-card">
                <CarFront size={24} color="#54a9e8" />
                <h3 style={{ marginTop: '16px', fontSize: '20px' }}>Design</h3>
                <p style={{ color: '#a0aab2', marginTop: '8px' }}>
                  Prominent wheel arches, heavily sculpted front apron, and model-specific C-pillar surfacing give the new BMW M5 an athletic and monolithic appearance.
                </p>
              </div>
              <div className="metric-card">
                <Ruler size={24} color="#54a9e8" />
                <h3 style={{ marginTop: '16px', fontSize: '20px' }}>Weight & Dynamics</h3>
                <p style={{ color: '#a0aab2', marginTop: '8px' }}>
                  Despite a higher curb weight of 2,435 kg due to the hybrid system, standard Integral Active Steering (rear-wheel steering) and Adaptive M suspension ensure supreme agility.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'Specifications' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
          <h1 style={{ fontSize: '40px', marginBottom: '40px' }}>Technical Specifications</h1>
          
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', borderBottom: '1px solid #333', paddingBottom: '12px', marginBottom: '16px' }}>Engine & Powertrain</h2>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>Combustion Engine</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>4.4-liter V8 TwinPower Turbo</td></tr>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>Electric Motor Output</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>197 hp (145 kW) / 280 Nm</td></tr>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>Combined System Power</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>727 hp (535 kW)</td></tr>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>Combined Torque</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>1,000 Nm (738 lb-ft)</td></tr>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>Transmission</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>8-speed M Steptronic</td></tr>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>Drivetrain</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>M xDrive (AWD with 2WD mode)</td></tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', borderBottom: '1px solid #333', paddingBottom: '12px', marginBottom: '16px' }}>Performance</h2>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2', width: '50%' }}>0-100 km/h (0-62 mph)</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>3.5 seconds</td></tr>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>0-200 km/h (0-124 mph)</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>10.9 seconds</td></tr>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>Top Speed (Limited)</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>250 km/h (155 mph)</td></tr>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>Top Speed (M Driver's Package)</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>305 km/h (189 mph)</td></tr>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>Top Speed (Electric only)</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>140 km/h (87 mph)</td></tr>
              </tbody>
            </table>
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', borderBottom: '1px solid #333', paddingBottom: '12px', marginBottom: '16px' }}>Dimensions & Weight</h2>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2', width: '50%' }}>Curb Weight (DIN)</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>2,435 kg (5,368 lbs)</td></tr>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>Length / Width / Height</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>5,096 mm / 1,970 mm / 1,510 mm</td></tr>
                <tr><td style={{ padding: '12px 0', borderBottom: '1px solid #222', color: '#a0aab2' }}>Luggage Capacity</td><td style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>466 Liters</td></tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === 'Configuration' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
          <h1 style={{ fontSize: '40px', marginBottom: '24px' }}>Build Your M5</h1>
          <p style={{ color: '#a0aab2', marginBottom: '40px' }}>Select the exterior paint to update the 3D model.</p>
          
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Exterior Paint</h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
            {[
              { name: 'Frozen Deep Grey', color: '#56616b' },
              { name: 'Isle of Man Green', color: '#244b3f' },
              { name: 'Marina Bay Blue', color: '#1d4770' },
              { name: 'Alpine White', color: '#d8dadd' },
              { name: 'Black Sapphire', color: '#050505' }
            ].map(p => (
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                key={p.name}
                onClick={() => { setPaint(p.color); handleTabChange('Interactive 3D') }}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: `2px solid ${paint === p.color ? '#fff' : 'transparent'}`,
                  borderRadius: '8px', 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '12px',
                  cursor: 'pointer',
                  width: '140px'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: p.color, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}></div>
                <span style={{ fontSize: '12px', textAlign: 'center' }}>{p.name}</span>
              </motion.button>
            ))}
          </div>
          
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Wheels</h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <motion.div 
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
              whileTap={{ scale: 0.98 }}
              className="metric-card" 
              style={{ width: '250px', cursor: 'pointer', border: `2px solid ${wheels === 'Style 951' ? '#fff' : 'transparent'}` }}
              onClick={() => { setWheels('Style 951'); handleTabChange('Interactive 3D'); }}
            >
              <div style={{ height: '120px', backgroundColor: '#fff', backgroundImage: 'url(https://cdn.werksraeder24.de/media/catalog/product/cache/155fae5fd1190a27f3181091d878ad92/2/0/2024_12_17_9999_55.jpg)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', borderRadius: '4px', marginBottom: '12px' }}></div>
              <h3 style={{ fontSize: '14px' }}>20"/21" M Light Alloy Wheels</h3>
              <p style={{ color: '#a0aab2', fontSize: '12px', marginTop: '4px' }}>Double-spoke style 951 M Bicolor</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
              whileTap={{ scale: 0.98 }}
              className="metric-card" 
              style={{ width: '250px', cursor: 'pointer', border: `2px solid ${wheels === 'Style 952' ? '#fff' : 'transparent'}` }}
              onClick={() => { setWheels('Style 952'); handleTabChange('Interactive 3D'); }}
            >
              <div style={{ height: '120px', backgroundColor: '#fff', backgroundImage: 'url(https://www.motechperformanceshop.co.uk/cdn/shop/files/MW4-SatinBlack_205c2aba-168a-4e1a-9283-9895392414c8.png?v=1739888731&width=2523)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', borderRadius: '4px', marginBottom: '12px' }}></div>
              <h3 style={{ fontSize: '14px' }}>20"/21" M Light Alloy Wheels</h3>
              <p style={{ color: '#a0aab2', fontSize: '12px', marginTop: '4px' }}>Double-spoke style 952 M Black</p>
            </motion.div>
          </div>

          <h2 style={{ fontSize: '20px', marginBottom: '16px', marginTop: '48px' }}>Interior Upholstery</h2>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
            {[
              { name: 'Black Merino Leather', color: '#111111' },
              { name: 'Silverstone / Black', color: '#dcdcdc' },
              { name: 'Kyalami Orange / Black', color: '#b95738' }
            ].map(u => (
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                key={u.name}
                onClick={() => { setInterior(u.name); handleTabChange('Interactive 3D'); }}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: `2px solid ${interior === u.name ? '#fff' : 'transparent'}`,
                  borderRadius: '8px', 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '12px',
                  cursor: 'pointer',
                  width: '140px'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: u.color, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}></div>
                <span style={{ fontSize: '12px', textAlign: 'center' }}>{u.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}


    </main>
  )
}

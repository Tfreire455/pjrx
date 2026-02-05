import React, { useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, Float, Stars, Sphere, Sparkles as ThreeSparkles } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.esm";
import * as THREE from "three";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ArrowRight, Zap, BellRing, ShieldCheck, Cpu, LayoutGrid, Globe, Workflow } from "lucide-react";
import { Button } from "../components/ui/button";

// --- NOVOS COMPONENTES DE BACKGROUND (CSS/SVG) ---

function RetroGrid() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Grade Principal */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
        style={{ transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)' }} 
      />
    </div>
  );
}

function AmbientLightOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Orb Violeta (Topo Esquerda) */}
      <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-violet-900/20 blur-[120px] animate-pulse-slow mix-blend-screen" />
      
      {/* Orb Indigo (Baixo Direita) */}
      <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-900/20 blur-[120px] animate-pulse-slow delay-1000 mix-blend-screen" />
      
      {/* Orb Central (Destaque) */}
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[40vw] h-[40vw] rounded-full bg-fuchsia-900/10 blur-[100px] mix-blend-screen" />
    </div>
  );
}

function NoiseOverlay() {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// --- 3D ENGINE (Mantido e Ajustado) ---

function CameraRig() {
  const { camera, mouse } = useThree();
  useFrame((state, delta) => {
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * delta * 2;
    camera.position.y += (-mouse.y * 0.5 - camera.position.y) * delta * 2;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function NeuralCore(props) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group ref={ref} {...props}>
      <Sphere args={[1.5, 32, 32]}>
        <meshBasicMaterial color="#7c3aed" wireframe transparent opacity={0.15} />
      </Sphere>
      <Points positions={useMemo(() => random.inSphere(new Float32Array(3000), { radius: 1.6 }), [])} stride={3}>
        <PointMaterial transparent color="#a78bfa" size={0.005} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
      </Points>
      <Points positions={useMemo(() => random.inSphere(new Float32Array(1500), { radius: 3 }), [])} stride={3}>
        <PointMaterial transparent color="#fff" size={0.002} sizeAttenuation={true} depthWrite={false} opacity={0.5} />
      </Points>
    </group>
  );
}

function Scene3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <fog attach="fog" args={['#030014', 5, 20]} /> {/* Fog ajustado para cor do bg */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <NeuralCore />
        </Float>
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <ThreeSparkles count={80} scale={6} size={2} speed={0.4} opacity={0.5} color="#c4b5fd" />
        <CameraRig />
      </Canvas>
    </div>
  );
}

// --- UI COMPONENTS (Mantidos) ---

function SpotlightCard({ children, className = "" }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`group relative border border-white/10 bg-black/40 overflow-hidden rounded-3xl ${className}`} // Fundo do card mais transparente
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(139, 92, 246, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }) {
  return (
    <SpotlightCard className="p-8 backdrop-blur-md hover:bg-white/5 transition-colors">
      <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-violet-400 group-hover:text-violet-300 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
    </SpotlightCard>
  );
}

// --- PAGE PRINCIPAL ---

export function Landing() {
  return (
    <div className="min-h-screen bg-[#030014] text-zinc-100 font-sans selection:bg-violet-500/30 relative overflow-x-hidden">
      
      {/* === CAMADAS DE FUNDO (A Ordem Importa!) === */}
      
      {/* 1. Orbs de Luz Ambiente (Cores suaves) */}
      <AmbientLightOrbs />
      
      {/* 2. Grade Retrô Futurista (Profundidade) */}
      <RetroGrid />
      
      {/* 3. Three.js Scene (Elementos 3D Flutuantes) */}
      <Scene3D />

      {/* 4. Texture Noise (Granulação estilo filme) */}
      <NoiseOverlay />

      {/* === CONTEÚDO UI === */}
      
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6"
      >
        <div className="flex items-center gap-2 backdrop-blur-md bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-lg shadow-violet-900/10">
          <Globe size={16} className="text-violet-400" />
          <span className="text-sm font-bold tracking-wide text-white">PRJX OS</span>
        </div>

        <nav className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link to="/register">
            <Button size="sm" className="rounded-full bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              Acesso Antecipado
            </Button>
          </Link>
        </nav>
      </motion.header>

      <main className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 text-xs font-semibold text-violet-300 uppercase tracking-widest shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)] backdrop-blur-md"
        >
          <Zap size={12} className="fill-current" />
          Nova Engine Preditiva v2.0
        </motion.div>

        <div className="text-center max-w-5xl mx-auto space-y-6">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 drop-shadow-2xl"
          >
            Orquestre Projetos<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-[size:200%] animate-gradient-x pb-2">
              Sem o Caos.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-300 leading-relaxed font-light"
          >
            A fusão definitiva entre <b>Kanban Inteligente</b> e <b>Notificações WhatsApp</b>. 
            O PRJX prevê atrasos antes que eles aconteçam.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] flex items-center justify-center gap-2">
                Começar Workspace <ArrowRight size={20} />
              </button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-10 py-4 rounded-full border border-white/10 bg-white/5 text-white font-medium hover:bg-white/10 backdrop-blur-lg transition-colors">
                Entrar na Conta
              </button>
            </Link>
          </motion.div>
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 1 }}
            className="mt-40 w-full"
        >
          <div className="flex items-center gap-4 mb-10">
            <span className="h-px w-12 bg-violet-500/50" />
            <span className="text-violet-400 font-mono text-sm tracking-widest uppercase">System Capabilities</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureItem
              icon={Cpu}
              title="IA Preditiva"
              desc="Não apenas gerencie. Nossa IA analisa padrões de commit e velocity para prever datas de entrega com 98% de precisão."
            />
            <div className="md:col-span-2">
               <SpotlightCard className="h-full p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 backdrop-blur-md hover:bg-white/5 transition-colors">
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="inline-flex h-12 w-12 rounded-xl bg-green-500/10 border border-green-500/20 items-center justify-center text-green-400">
                      <BellRing size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">WhatsApp Sentinel</h3>
                    <p className="text-zinc-400 leading-relaxed">
                      Esqueça e-mails que ninguém lê. O PRJX envia briefings diários e alertas de risco crítico diretamente no WhatsApp da equipe. Configurável, silencioso e preciso.
                    </p>
                  </div>
                  <div className="w-full md:w-64 h-32 md:h-full rounded-2xl bg-[#0a0a0a]/50 border border-white/5 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-800/80 border border-white/5 backdrop-blur shadow-xl">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <div className="space-y-1">
                        <div className="h-1.5 w-24 bg-zinc-600 rounded-full" />
                        <div className="h-1.5 w-16 bg-zinc-700 rounded-full" />
                      </div>
                    </div>
                  </div>
               </SpotlightCard>
            </div>
            <FeatureItem icon={Workflow} title="Kanban Fluido" desc="Drag-and-drop a 120fps. Swimlanes automáticas, limites de WIP e integração nativa com GitHub Issues e Jira." />
             <FeatureItem icon={ShieldCheck} title="Enterprise Ready" desc="SSO, Logs de auditoria, criptografia AES-256 e conformidade com SOC2. Seus dados, sua fortaleza." />
             <FeatureItem icon={LayoutGrid} title="Workflow Custom" desc="Crie automações complexas com nosso motor 'If-This-Then-That'. Se o sprint atrasar -> Avise o CTO." />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
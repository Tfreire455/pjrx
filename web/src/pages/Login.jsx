import React, { useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Sphere, Points, PointMaterial, Float } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.esm";
import * as THREE from "three";
import { Mail, Lock, Loader2, ArrowLeft, Globe, Zap, Quote } from "lucide-react";

// Importações funcionais do seu projeto
import { apiFetch } from "../lib/api";
import { setAccessToken } from "../lib/auth";

// --- BACKGROUND & 3D COMPONENTS ---

function NeuralCoreMini(props) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 5;
      ref.current.rotation.y -= delta / 10;
    }
  });

  return (
    <group ref={ref} {...props}>
      <Sphere args={[1, 32, 32]}>
        <meshBasicMaterial color="#7c3aed" wireframe transparent opacity={0.2} />
      </Sphere>
      <Points positions={useMemo(() => random.inSphere(new Float32Array(1500), { radius: 1.2 }), [])} stride={3}>
        <PointMaterial transparent color="#a78bfa" size={0.01} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
      </Points>
    </group>
  );
}

function WarpBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#030014]">
      {/* Luzes de Fundo */}
      <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-violet-900/30 blur-[150px] mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-indigo-900/30 blur-[150px] mix-blend-screen" />
      
      {/* Cena 3D: Estrelas em Warp */}
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars radius={50} depth={50} count={5000} factor={4} saturation={9} fade speed={2} />
      </Canvas>

      {/* Textura de Ruído e Vinheta */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030014_100%)]" />
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
}

// --- UI COMPONENTS ---

function InputField({ label, icon: Icon, error, register, name, type = "text", placeholder }) {
  return (
    <div className="space-y-2 relative">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Icon size={18} className={`transition-all duration-300 ${error ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-300 group-focus-within:scale-110"}`} />
        </div>
        <input
          type={type}
          placeholder={placeholder}
          {...register(name)}
          className={`w-full bg-zinc-900/40 border backdrop-blur-xl text-zinc-100 text-sm rounded-xl py-3.5 pl-12 pr-4 outline-none transition-all duration-300
            ${error 
              ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
              : "border-white/10 hover:border-white/30 focus:border-violet-500 focus:ring-2 focus:ring-violet-600/20 focus:bg-zinc-900/60"
            }
            placeholder:text-zinc-600 shadow-inner`}
        />
         <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-violet-500 opacity-0 group-focus-within:opacity-100 blur-[4px] transition-opacity duration-500 rounded-full"></div>
      </div>
      {error && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="text-xs text-red-400 ml-1 block font-medium"
        >
          {error}
        </motion.span>
      )}
    </div>
  );
}

// --- LÓGICA & VALIDAÇÃO ---

const Schema = z.object({
  email: z.string().email("Informe um email válido."),
  password: z.string().min(6, "Mínimo 6 caracteres.")
});

export function Login() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    resolver: zodResolver(Schema)
  });

  // Funcionalidade Original Preservada
  async function onSubmit(values) {
    try {
      const res = await apiFetch("/auth/login", { method: "POST", body: values });
      
      // Validação do Token conforme snippet original
      const token = res?.data?.tokens?.accessToken;
      if (!token) throw new Error("Token ausente na resposta do login.");
      
      setAccessToken(token);
      toast.success("Bem-vindo de volta!");
      nav("/app", { replace: true });
    } catch (e) {
      // Exibe mensagem da API ou fallback genérico
      toast.error(e.message || "Falha ao realizar login. Verifique suas credenciais.");
    }
  }

  // Variantes de Animação (Stagger)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 120, damping: 20 } }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative p-4 md:p-8 font-sans text-zinc-100 selection:bg-violet-500/30 overflow-hidden">
      <WarpBackground />

      {/* Botão Voltar */}
      <Link to="/" className="absolute top-8 left-8 text-zinc-400 hover:text-white transition-all flex items-center gap-3 group z-20">
        <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-violet-400/50 group-hover:bg-violet-500/10 transition-all">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        </div>
        <span className="text-sm font-medium tracking-wide">Voltar</span>
      </Link>

      {/* CARD PRINCIPAL (WIDE SPLIT) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[1000px] relative z-10"
      >
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(0,0,0,0.7)] grid grid-cols-1 md:grid-cols-5 min-h-[600px]">
           {/* Linha de brilho superior */}
           <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent opacity-70" />

          {/* --- COLUNA ESQUERDA (Branding & Visual) --- */}
          <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-violet-900/20 via-[#0a0a0a]/50 to-indigo-900/20 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5">
            {/* Elemento 3D Miniatura */}
            <div className="absolute inset-0 pointer-events-none opacity-80">
                <Canvas camera={{ position: [0, 0, 3] }} gl={{ alpha: true }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} color="#8b5cf6" />
                    <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
                        <NeuralCoreMini scale={0.8} />
                    </Float>
                </Canvas>
            </div>
            
            <motion.div variants={itemVariants} className="relative z-10">
              <div className="flex items-center gap-2 text-white mb-8">
                <Globe size={20} className="text-violet-400" />
                <span className="font-bold text-lg tracking-wide">PRJX OS</span>
              </div>
               <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 border border-violet-500/30 px-3 py-1 text-xs font-semibold text-violet-200 uppercase tracking-widest mb-6">
                <Zap size={11} className="fill-current" /> Secure Login
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                Acesse seu workspace.
              </h1>
            </motion.div>
            
            <motion.div variants={itemVariants} className="relative z-10 hidden md:block mt-12">
               <Quote className="text-violet-500/40 mb-4 h-8 w-8 -scale-x-100" />
               <p className="text-lg text-zinc-300 font-medium leading-relaxed">
                "Gestão de projetos redefinida. Menos ruído, mais entrega."
               </p>
            </motion.div>
          </div>

          {/* --- COLUNA DIREITA (Formulário Funcional) --- */}
          <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center bg-white/[0.01]">
             <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Login</h2>
                <p className="text-zinc-400">Entre com seu email para continuar.</p>
            </motion.div>
            
            {/* Google Button Visual (Simulado) */}
            <motion.button 
              variants={itemVariants}
              type="button"
              onClick={() => toast.info("Funcionalidade Google Login ainda não implementada no backend.")}
              className="w-full h-12 rounded-xl bg-white text-[#0a0a0a] font-semibold text-sm flex items-center justify-center gap-3 hover:bg-zinc-100 hover:scale-[1.01] active:scale-[0.99] transition-all mb-8 shadow-xl shadow-white/5 group"
            >
              <svg className="h-5 w-5 group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Entrar com Google
            </motion.button>

            <motion.div variants={itemVariants} className="relative mb-8 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative bg-[#0c0c12] px-4 text-xs uppercase text-zinc-500 font-medium tracking-wider">Ou via email</div>
            </motion.div>

            {/* FORMULÁRIO PRINCIPAL */}
            <motion.form variants={containerVariants} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <motion.div variants={itemVariants}>
                 <InputField 
                    label="Email" 
                    name="email" 
                    register={register} 
                    error={errors.email?.message} 
                    icon={Mail} 
                    placeholder="demo@prjx.app" 
                 />
              </motion.div>
              
              <motion.div variants={itemVariants} className="space-y-2">
                <InputField 
                    label="Senha" 
                    name="password" 
                    type="password" 
                    register={register} 
                    error={errors.password?.message} 
                    icon={Lock} 
                    placeholder="••••••••" 
                />
                {/* Link de recuperação de senha (apenas visual por enquanto) */}
                <div className="flex justify-end">
                  <Link to="#" className="text-xs font-medium text-zinc-400 hover:text-violet-400 transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
              </motion.div>

              <motion.button
                variants={itemVariants}
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold tracking-wide text-sm hover:shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4 relative overflow-hidden group"
              >
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out pointer-events-none" />
                {isSubmitting ? ( 
                    <>
                        <Loader2 size={20} className="animate-spin" /> 
                        Entrando...
                    </>
                ) : (
                    "Acessar Conta"
                )}
              </motion.button>
            </motion.form>

             <motion.div variants={itemVariants} className="mt-8 text-center">
                <p className="text-zinc-400 text-sm">
                Não tem conta?{" "}
                <Link to="/register" className="text-violet-400 font-semibold hover:text-violet-300 hover:underline underline-offset-4 transition-all">
                    Criar agora
                </Link>
                </p>
            </motion.div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
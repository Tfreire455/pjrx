import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { setAccessToken } from "../lib/auth";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { GoogleButton } from "../components/auth/GoogleButton";
import { OrDivider } from "../components/auth/OrDivider";
import { Button } from "../components/ui/button";

const Schema = z.object({
  email: z.string().email("Informe um email válido."),
  password: z.string().min(6, "Mínimo 6 caracteres.")
});

export function Login() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    resolver: zodResolver(Schema)
  });

  async function onSubmit(values) {
    try {
      const res = await apiFetch("/auth/login", { method: "POST", body: values });
      const token = res?.data?.tokens?.accessToken;
      if (!token) throw new Error("Token ausente no login.");
      setAccessToken(token);
      toast.success("Bem-vindo!");
      nav("/app", { replace: true });
    } catch (e) {
      toast.error(e.message || "Falha no login");
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse seu workspace e continue seus projetos."
      footer={
        <>
          Não tem conta? <Link className="text-primary underline underline-offset-4" to="/register">Criar agora</Link>
        </>
      }
    >
      <GoogleButton />
      <OrDivider />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <AuthInput label="Email" placeholder="demo@prjx.app" {...register("email")} error={errors.email?.message} />
        <AuthInput label="Senha" type="password" placeholder="••••••••" {...register("password")} error={errors.password?.message} />
        <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Entrando..." : "Entrar"}</Button>
      </form>
    </AuthLayout>
  );
}
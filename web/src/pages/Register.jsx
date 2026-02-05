import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { GoogleButton } from "../components/auth/GoogleButton";
import { OrDivider } from "../components/auth/OrDivider";
import { Button } from "../components/ui/button";

const Schema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("Informe um email válido."),
  password: z.string().min(6, "Mínimo 6 caracteres.")
});

export function Register() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    resolver: zodResolver(Schema)
  });

  async function onSubmit(values) {
    try {
      await apiFetch("/auth/register", { method: "POST", body: values });
      toast.success("Conta criada! Faça login.");
      nav("/login", { replace: true });
    } catch (e) {
      toast.error(e.message || "Falha no cadastro");
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Crie seu acesso e comece seu Project OS."
      footer={<>Já tem conta? <Link className="text-primary underline underline-offset-4" to="/login">Entrar</Link></>}
    >
      <GoogleButton label="Criar com Google" />
      <OrDivider />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <AuthInput label="Nome" placeholder="Seu nome" {...register("name")} error={errors.name?.message} />
        <AuthInput label="Email" placeholder="seu@email.com" {...register("email")} error={errors.email?.message} />
        <AuthInput label="Senha" type="password" placeholder="Crie uma senha" {...register("password")} error={errors.password?.message} />
        <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Criando..." : "Criar conta"}</Button>
      </form>
    </AuthLayout>
  );
}
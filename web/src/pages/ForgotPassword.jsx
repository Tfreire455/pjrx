import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { Button } from "../components/ui/button";

export function ForgotPassword() {
  function onSubmit(e) {
    e.preventDefault();
    toast.message("Em breve: recuperação de senha.");
  }

  return (
    <AuthLayout
      title="Recuperar acesso"
      subtitle="Vamos te enviar um link quando essa funcionalidade estiver habilitada."
      footer={
        <>
          Lembrou?{" "}
          <Link className="text-primary underline underline-offset-4" to="/login">
            Voltar pro login
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <AuthInput label="Email" placeholder="seu@email.com" />
        <Button className="w-full">Enviar link</Button>
      </form>
    </AuthLayout>
  );
}
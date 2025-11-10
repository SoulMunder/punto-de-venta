"use client"

import type React from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"
import Image from "next/image"
import { PasswordInput } from "@/components/ui/password-input"

function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl,
      })

      if (!result?.ok) {
        setError("Credenciales inválidas")
        return
      }

      if (result.url) {
        router.push(result.url)
      } else {
        router.push(callbackUrl)
      }
      router.refresh()
    } catch (error) {
      console.error("Error during login:", error)
      setError("Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-linear-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="flex flex-col items-center gap-4 mb-2">
              <Image
                src="/images/masicsa-logo.png"
                alt="MASICSA Logo"
                width={120}
                height={120}
                className="object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-primary">MASICSA</h1>
                <CardTitle className="text-xl font-semibold mt-2">Punto de Venta</CardTitle>
              </div>
            </div>
            <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="username">Nombre de usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Mi_usuario"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-linear-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <div className="flex flex-col items-center gap-4 mb-2">
                <Image
                  src="/images/masicsa-logo.png"
                  alt="MASICSA Logo"
                  width={120}
                  height={120}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-3xl font-bold text-primary">MASICSA</h1>
                  <CardTitle className="text-xl font-semibold mt-2">Punto de Venta</CardTitle>
                </div>
              </div>
              <CardDescription>Cargando...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

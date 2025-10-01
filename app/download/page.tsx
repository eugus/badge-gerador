"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  Award,
  Key,
  Download,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Home,
  Copy,
  Building2,
  MoreVertical,
  FileText,
  Sparkles,
  Shield,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface BadgeInfo {
  badgeName: string
  badgeDescription: string
  badgeCategory: string
  badgeImagePath: string
  issuer: string
  issuerImagePath: string
  studentName: string
  achievementReason: string
  assignedAt: string
  downloadCount: number
  tokenExpiresAt: string
  assignmentId: number
}

interface ValidationResponse {
  valid: boolean
  message: string
  badgeInfo?: BadgeInfo
}

export default function DownloadPage() {
  const [token, setToken] = useState("")
  const [badgeInfo, setBadgeInfo] = useState<BadgeInfo | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)

  const { toast } = useToast()
  const notify = (title: string, description: string, variant: "default" | "destructive" = "default") =>
    toast({ title, description, variant })

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const isTokenExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  const buildUrl = (path: string | undefined, type: "badges" | "issuers") => {
    if (!path) return null
    if (path.startsWith("http")) return path
    const filename = path.split("/").pop()
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${type}/${filename}`
  }

  const validateToken = async () => {
    if (!token.trim()) return notify("Erro", "Por favor, insira um código de download válido", "destructive")

    setIsValidating(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/badges/validate-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data: ValidationResponse = await res.json()

      if (data.valid && data.badgeInfo) {
        setBadgeInfo(data.badgeInfo)
        setIsValidToken(true)
        notify("✅ Código Válido!", "Agora você pode baixar seu badge.")
      } else {
        setBadgeInfo(null)
        setIsValidToken(false)
        notify("❌ Código Inválido", data.message, "destructive")
      }
    } catch {
      notify("Erro de Conexão", "Não foi possível conectar ao servidor", "destructive")
    } finally {
      setIsValidating(false)
    }
  }

  const downloadBadge = async () => {
    if (!isValidToken || !token.trim()) return
    setIsDownloading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/badges/download-by-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      })

      if (!res.ok) return notify("Erro no Download", await res.text(), "destructive")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `badge.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      notify("🎉 Download Concluído!", `Badge "${badgeInfo ? badgeInfo.badgeName : ""}" baixado!`)

      validateToken()
    } catch {
      notify("Erro", "Falha ao baixar o badge", "destructive")
    } finally {
      setIsDownloading(false)
    }
  }

  const exportToJson = () => {
    if (!badgeInfo) {
      notify("Erro", "Nenhum badge validado para exportar", "destructive")
      return
    }

    const json = {
      badge: {
        name: badgeInfo.badgeName,
        description: badgeInfo.badgeDescription,
        category: badgeInfo.badgeCategory,
        imageUrl: buildUrl(badgeInfo.badgeImagePath, "badges"),
      },
      issuer: {
        name: badgeInfo.issuer,
        imageUrl: buildUrl(badgeInfo.issuerImagePath, "issuers"),
      },
      recipient: {
        name: badgeInfo.studentName,
        achievementReason: badgeInfo.achievementReason,
      },
      metadata: {
        assignedAt: badgeInfo.assignedAt,
        downloadCount: badgeInfo.downloadCount,
        tokenExpiresAt: badgeInfo.tokenExpiresAt,
        assignmentId: badgeInfo.assignmentId,
        exportedAt: new Date().toISOString(),
      },
    }

    const jsonString = JSON.stringify(json, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url

    const sanitizedName = badgeInfo.badgeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    a.download = `badge-${sanitizedName}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    notify("📄 JSON Exportado!", `Dados do badge "${badgeInfo.badgeName}" exportados com sucesso!`)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token)
    notify("Copiado!", "Código copiado para a área de transferência")
  }

  const resetForm = () => {
    setToken("")
    setBadgeInfo(null)
    setIsValidToken(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-900/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gray-800/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <div className="relative bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-xl transform transition-transform hover:scale-105 hover:shadow-2xl">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Download de Badge</h1>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Insira seu código para validar e baixar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl border-2 hover:border-gray-900 hover:bg-gray-100 transition-all bg-transparent"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={exportToJson} disabled={!badgeInfo} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/">
                <Button className="bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl rounded-xl px-6 transform transition-all hover:-translate-y-0.5">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar ao Sistema
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Form Card */}
          <Card className="shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-sm transform transition-all hover:shadow-3xl">
            <CardHeader className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="relative">
                <CardTitle className="flex items-center gap-3 text-3xl font-bold mb-2">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                    <Key className="h-7 w-7" />
                  </div>
                  Validar Código
                </CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  Digite o código único que você recebeu por email
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <Label htmlFor="token" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Código de Download
                </Label>
                <div className="relative group">
                  <Input
                    id="token"
                    type="text"
                    placeholder="550e8400-e29b-41d4-a716-446655440000"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && validateToken()}
                    className="font-mono text-base h-14 pr-14 border-2 border-gray-300 focus:border-black rounded-xl focus:ring-4 focus:ring-gray-200 transition-all"
                  />
                  {token && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-10 w-10 rounded-lg hover:bg-gray-100 transition-all"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-5 w-5" />
                    </Button>
                  )}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-gray-900 to-black rounded-xl opacity-0 group-hover:opacity-10 blur transition-opacity" />
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Cole o código UUID de 36 caracteres recebido por email
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={validateToken}
                  disabled={isValidating || !token.trim()}
                  className="flex-1 h-14 text-lg font-semibold bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-0.5 rounded-xl"
                >
                  {isValidating ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Validar Código
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={isValidating}
                  className="h-14 px-6 border-2 border-gray-300 hover:border-black rounded-xl hover:bg-gray-50 bg-transparent transition-all"
                >
                  Limpar
                </Button>
              </div>

              {/* Success indicator */}
              {isValidToken && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl animate-in slide-in-from-top">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Código válido!</p>
                    <p className="text-sm text-green-700">Você pode baixar seu badge agora</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Badge Info Card */}
          <Card className="shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-sm">
            <CardHeader className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 border-b-2 border-gray-200">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                <div className="p-2 bg-yellow-100 rounded-xl shadow-md">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                Informações do Badge
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                {badgeInfo ? "Detalhes da sua conquista" : "Valide o código para visualizar"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              {!badgeInfo ? (
                <div className="text-center py-24 space-y-6">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-lg">
                      <AlertCircle className="h-16 w-16 text-gray-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-lg">
                      <Key className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Aguardando validação</h3>
                    <p className="text-gray-500">Insira e valide seu código para ver as informações do badge</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Badge Main Info */}
                  <div className="relative p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-100 overflow-hidden group shadow-lg">
                    {badgeInfo.badgeImagePath && (
                      <img
                        src={buildUrl(badgeInfo.badgeImagePath, "badges") ?? "/placeholder.svg"}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-5 group-hover:opacity-10 transition-opacity"
                      />
                    )}
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <h3 className="text-3xl font-bold text-gray-900">{badgeInfo.badgeName}</h3>
                          {badgeInfo.badgeCategory && (
                            <Badge className="text-base px-4 py-1.5 bg-black hover:bg-gray-900 text-white shadow-md">
                              {badgeInfo.badgeCategory}
                            </Badge>
                          )}
                        </div>
                        <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-yellow-200">
                          <Award className="h-8 w-8 text-yellow-600" />
                        </div>
                      </div>
                      <p className="text-gray-700 text-base leading-relaxed">{badgeInfo.badgeDescription}</p>

                      {isValidToken && (
                        <div className="pt-4 space-y-3">
                          <Button
                            onClick={downloadBadge}
                            disabled={isDownloading}
                            size="lg"
                            className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transform transition-all hover:-translate-y-1 rounded-xl"
                          >
                            {isDownloading ? (
                              <>
                                <Clock className="h-6 w-6 mr-3 animate-spin" />
                                Baixando...
                              </>
                            ) : (
                              <>
                                <Download className="h-6 w-6 mr-3" />
                                Baixar Badge Agora
                              </>
                            )}
                          </Button>

                          <Link href={`/badge/${badgeInfo.assignmentId}`} target="_blank">
                            <Button
                              variant="outline"
                              size="lg"
                              className="w-full h-14 text-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl bg-transparent"
                            >
                              <ExternalLink className="h-5 w-5 mr-2" />
                              Ver Página Pública do Badge
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Issuer Info */}
                  {badgeInfo.issuer && (
                    <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200 shadow-md">
                      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-600">
                        <Building2 className="h-5 w-5 text-black" />
                        Emitido por
                      </div>
                      <div className="flex items-center gap-4">
                        <img
                          src={buildUrl(badgeInfo.issuerImagePath, "issuers") ?? "/placeholder.svg"}
                          alt={badgeInfo.issuer}
                          className="w-20 h-20 object-cover rounded-xl shadow-lg border-2 border-white"
                        />
                        <a
                          href="https://incode-tech-school.com.br/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xl font-bold text-gray-900 hover:text-black transition-colors hover:underline"
                        >
                          {badgeInfo.issuer}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid gap-4">
                    <DetailCard
                      icon={<User className="h-5 w-5" />}
                      label="Conquistado por"
                      value={badgeInfo.studentName}
                      gradient="from-gray-800 to-black"
                    />
                    <DetailCard
                      icon={<Calendar className="h-5 w-5" />}
                      label="Data de emissão"
                      value={formatDate(badgeInfo.assignedAt)}
                      gradient="from-gray-700 to-gray-900"
                    />
                    <DetailCard
                      icon={<Download className="h-5 w-5" />}
                      label="Total de downloads"
                      value={`${badgeInfo.downloadCount} vez(es)`}
                      gradient="from-gray-600 to-gray-800"
                    />
                  </div>

                  {/* Token Status */}
                  <div
                    className={`p-5 rounded-2xl border-2 shadow-md ${
                      isTokenExpired(badgeInfo.tokenExpiresAt)
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          isTokenExpired(badgeInfo.tokenExpiresAt) ? "bg-red-100" : "bg-green-100"
                        }`}
                      >
                        <Shield
                          className={`h-5 w-5 ${isTokenExpired(badgeInfo.tokenExpiresAt) ? "text-red-600" : "text-green-600"}`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Validade do Token</p>
                        <p
                          className={`text-sm ${isTokenExpired(badgeInfo.tokenExpiresAt) ? "text-red-700" : "text-green-700"}`}
                        >
                          {isTokenExpired(badgeInfo.tokenExpiresAt) ? "Expirado em: " : "Válido até: "}
                          {formatDate(badgeInfo.tokenExpiresAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function DetailCard({
  icon,
  label,
  value,
  gradient,
}: {
  icon: React.ReactNode
  label: string
  value: string
  gradient: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg">
      <div className="flex items-center gap-4 p-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`}
      />
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Award, Key, Download, User, Calendar, AlertCircle, CheckCircle,
  Clock, Home, Copy, Building2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  const [recipientEmail, setRecipientEmail] = useState("")
  const [isValidatingBadge, setIsValidatingBadge] = useState(false)
  const [manualAssignmentId, setManualAssignmentId] = useState<string>("")
  const { toast } = useToast()

  const notify = (title: string, description: string, variant: "default" | "destructive" = "default") =>
    toast({ title, description, variant })

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    })

  const isTokenExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  const buildUrl = (path: string | undefined, type: "badges" | "issuers") => {
    if (!path) return null
    if (path.startsWith("http")) return path
    const filename = path.split("/").pop()
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${type}/${filename}`
  }

  const validateToken = async () => {
    if (!token.trim()) return notify("Erro", "Por favor, insira um código de download", "destructive")

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

      if (!res.ok) {
        return notify("Erro no Download", await res.text(), "destructive")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      const contentDisposition = res.headers.get("Content-Disposition")
      a.download = contentDisposition?.match(/filename="(.+)"/)?.[1] ?? "badge.png"

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      notify("🎉 Download Concluído!", `Badge "${badgeInfo?.badgeName}" baixado com sucesso!`)
      validateToken() // atualiza contador
    } catch {
      notify("Erro", "Falha ao baixar o badge", "destructive")
    } finally {
      setIsDownloading(false)
    }
  }

  const resetForm = () => { setToken(""); setBadgeInfo(null); setIsValidToken(false) }
  const copyToClipboard = () => {
    navigator.clipboard.writeText(token)
    notify("Copiado!", "Código copiado para a área de transferência")
  }

  const getAssignmentIdFromBadgeInfo = (info: any): string | number | null => {
    if (!info || typeof info !== "object") return null
    return (
      info.assignmentId ??
      info.assignmentID ??
      info.assignment_id ??
      info.assignment?.id ??
      info.badgeAssignmentId ??
      info.id ??
      null
    )
  }

  const validateBadge = async () => {
    if (!isValidToken || !badgeInfo) {
      return notify("Atenção", "Valide o código primeiro", "destructive")
    }
    if (!recipientEmail.trim()) {
      return notify("Erro", "Informe o email do destinatário", "destructive")
    }

    setIsValidatingBadge(true)
    try {
      const assignmentId = manualAssignmentId.trim() || getAssignmentIdFromBadgeInfo(badgeInfo)
      if (!assignmentId) {
        console.error("assignmentId ausente em badgeInfo:", badgeInfo)
        throw new Error("Não foi possível identificar o assignmentId do badge")
      }

      // 1) Buscar JSON do Open Badge a partir do assignmentId
      const resOpenBadge = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/assertions/${assignmentId}/open-badge`)
      if (!resOpenBadge.ok) {
        const txt = await resOpenBadge.text()
        throw new Error(txt || "Falha ao buscar JSON do badge")
      }
      const openBadgeJson = await resOpenBadge.json()

      // 2) Enviar para a rota de validação
      const resValidate = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/badges/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeJson: openBadgeJson, recipient: recipientEmail.trim() })
      })

      const data = await resValidate.json().catch(() => null)

      if (!resValidate.ok) {
        return notify("Validação falhou", (data?.message || data?.error || "Erro ao validar o badge"), "destructive")
      }

      notify("✅ Badge validado!", data?.message || "Badge válido para o destinatário informado.")
    } catch (err: any) {
      notify("Erro", err.message || "Falha ao validar o badge", "destructive")
    } finally {
      setIsValidatingBadge(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Download de Badge</h1>
              <p className="text-sm text-gray-600">Insira seu código para baixar</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm"><Home className="h-4 w-4 mr-2" />Voltar ao Sistema</Button>
          </Link>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-8 max-w-4xl grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Inserir Código</CardTitle>
            <CardDescription className="text-blue-100">Digite o código que você recebeu por email</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Código de Download</Label>
              <div className="relative">
                <Input id="token" type="text" placeholder="550e8400-e29b..." value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && validateToken()}
                  className="font-mono text-sm pr-10"
                />
                {token && (
                  <Button variant="ghost" size="sm" className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
                )}
              </div>
              <p className="text-xs text-gray-500">Cole o código UUID que você recebeu por email</p>
            </div>

            <div className="flex gap-3">
              <Button onClick={validateToken} disabled={isValidating || !token.trim()} className="flex-1">
                {isValidating ? <><Clock className="h-4 w-4 mr-2 animate-spin" />Validando...</> :
                  <><CheckCircle className="h-4 w-4 mr-2" />Validar Código</>}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={isValidating}>Limpar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Badge Info */}
        <Card className="shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-yellow-500" /> Informações</CardTitle>
            <CardDescription>{badgeInfo ? "Detalhes do badge" : "Valide o código para ver as informações"}</CardDescription>
          </CardHeader>
          <CardContent>
            {!badgeInfo ? (
              <div className="text-center py-12 text-gray-400">
                <AlertCircle className="h-16 w-16 mx-auto mb-4" />
                <p>Nenhum código validado</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Nome/descrição */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl border relative overflow-hidden">
                  {badgeInfo.badgeImagePath && (
                    <img src={buildUrl(badgeInfo.badgeImagePath, "badges") ?? "/placeholder.svg"}
                      alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
                  )}
                  <div className="relative z-10">
                    <h3 className="font-bold text-2xl mb-3">{badgeInfo.badgeName}</h3>
                    {badgeInfo.badgeCategory && <Badge variant="secondary">{badgeInfo.badgeCategory}</Badge>}
                    <p className="text-gray-700">{badgeInfo.badgeDescription}</p>
                    {isValidToken && (
                      <div className="flex justify-center mt-4">
                        <Button onClick={downloadBadge} disabled={isDownloading} size="lg"
                          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                          {isDownloading ? <><Clock className="h-5 w-5 mr-2 animate-spin" />Baixando...</> :
                            <><Download className="h-5 w-5 mr-2" />Baixar Badge</>}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {isValidToken && (
                  <div className="p-6 bg-white rounded-xl border space-y-3">
                    <Label htmlFor="recipientEmail">Email do destinatário para validar</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="nome@exemplo.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                    <Label htmlFor="assignmentId" className="pt-2">ID do assignment (opcional)</Label>
                    <Input
                      id="assignmentId"
                      type="text"
                      placeholder="Será detectado automaticamente após validar o código"
                      value={manualAssignmentId}
                      onChange={(e) => setManualAssignmentId(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button onClick={validateBadge} disabled={isValidatingBadge || !recipientEmail.trim()}>
                        {isValidatingBadge ? <><Clock className="h-4 w-4 mr-2 animate-spin" />Validando...</> :
                          <>Validar Badge</>}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Emissor */}
                {badgeInfo.issuer && (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border">
                    <div className="flex items-center gap-2 mb-2"><Building2 className="h-5 w-5 text-blue-600" />Emitido por</div>
                    <div className="flex items-center gap-4">
                      <img src={buildUrl(badgeInfo.issuerImagePath, "issuers") ?? "/placeholder.svg"}
                        alt={badgeInfo.issuer} className="w-26 h-16 object-cover rounded-xl" />
                      <h4 className="text-blue-800 font-bold">
  <a href="https://incode-tech-school.com.br/" target="_blank" rel="noopener noreferrer" className="hover:underline">
    {badgeInfo.issuer}
  </a>
</h4>
                    </div>
                  </div>
                )}

                {/* Outros detalhes */}
                <div className="space-y-3">
                  <Detail icon={<User />} label="Conquistado por" value={badgeInfo.studentName} />
                  <Detail icon={<Calendar />} label="Data" value={formatDate(badgeInfo.assignedAt)} />
                  <Detail icon={<Download />} label="Downloads" value={`${badgeInfo.downloadCount}`} />
                </div>

                {/* Status */}
                <div className={`p-4 rounded-xl border ${isTokenExpired(badgeInfo.tokenExpiresAt) ? "bg-red-50" : "bg-green-50"}`}>
                  <p><strong>Válido até:</strong> {formatDate(badgeInfo.tokenExpiresAt)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="text-gray-500">{icon}</div>
      <div><p className="font-medium">{label}</p><p className="text-gray-900">{value}</p></div>
    </div>
  )
}

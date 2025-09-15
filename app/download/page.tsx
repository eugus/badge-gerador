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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { SetStateAction } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu"

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
  const [openJsonModal, setOpenJsonModal] = useState(false)
  const [jsonPreview, setJsonPreview] = useState("")

  const { toast } = useToast();
  const notify = (title: string, description: string, variant: "default" | "destructive" = "default") =>
    toast({ title, description, variant });

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

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

       if (!res.ok) return notify("Erro no Download", await res.text(), "destructive");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `badge.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      notify(
        "🎉 Download Concluído!",
        `Badge "${badgeInfo ? badgeInfo.badgeName : ""}" baixado!`
      );
    } catch {
      notify("Erro", "Falha ao baixar o badge", "destructive");
    } finally {
      setIsDownloading(false);
    }
  };

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
    };

   setJsonPreview(JSON.stringify(json, null, 2));
    setOpenJsonModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token);
    notify("Copiado!", "Código copiado para a área de transferência");
  };

  const resetForm = () => {
    setToken("");
    setBadgeInfo(null);
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Download de Badge</h1>
              <p className="text-sm text-gray-600">Insira seu código para baixar</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
           
            <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      className="bg-white border border-gray-300 shadow-sm w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
    >
      <MoreVertical className="h-4 w-4 text-gray-700" />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
  align="center"        
  side="top"
  sideOffset={10}    
  className="bg-white border border-gray-100 rounded-md shadow-md p-0 overflow-visible" 
>
  <DropdownMenuArrow
    className="fill-white stroke-gray-300"  
    offset={0}  // 
  />

    <DropdownMenuItem
      onClick={exportToJson}
      disabled={!badgeInfo}
      className="px-4 py-2 text-sm text-gray-700 cursor-pointer data-[highlighted]:text-white"
    >
      Export JSON
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>



            <Link href="/">
  <Button className="bg-black text-white hover:bg-gray-900 size-sm">
    <Home className="h-4 w-4 mr-2" />
    Voltar ao Sistema
  </Button>
</Link>

          </div>
        </div>
      </div>

<div className="flex flex-col lg:flex-row gap-8 lg:gap-10 px-4 sm:px-8 py-12">

  {/* Form - metade esquerda no desktop */}
  <Card className="w-full lg:w-1/2 min-h-[600px] shadow-lg">
    <CardHeader className="bg-black text-white rounded-t-lg p-8 sm:p-12">
      <CardTitle className="flex items-center gap-5 text-2xl sm:text-3xl">
        <Key className="h-6 w-6 sm:h-8 sm:w-8" /> Inserir Código
      </CardTitle>
      <CardDescription className="text-blue-100 text-base sm:text-lg">
        Digite o código que você recebeu por email
      </CardDescription>
    </CardHeader>
    <CardContent className="p-8 sm:p-12 space-y-6 sm:space-y-8">
      <div className="space-y-4 sm:space-y-5">
        <Label htmlFor="token" className="text-base sm:text-lg font-medium">
          Código de Download
        </Label>
        <div className="relative">
          <Input
            id="token"
            type="text"
            placeholder="550e8400-e29b..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && validateToken()}
            className="font-mono text-lg sm:text-xl pr-14 sm:pr-16"
          />
          {token && (
           <Button
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1 h-8 w-8 sm:h-8 sm:w-8 p-0 bg-white border border-gray-200 hover:bg-gray-100"
              onClick={copyToClipboard}
            >
              <Copy className="h-6 w-6 sm:h-7 sm:w-7 " />
           </Button>

          )}
        </div>
        <p className="text-sm sm:text-base text-gray-500">
          Cole o código UUID que você recebeu por email
        </p>
      </div>
      <div className="flex gap-4 sm:gap-6">
        <Button
          onClick={validateToken}
          disabled={isValidating || !token.trim()}
          className="flex-1 py-4 sm:py-5 text-lg sm:text-xl
          bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
        >
          {isValidating ? (
            <>
              <Clock className="h-6 w-6 sm:h-7 sm:w-7 mr-4 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 mr-4" />
              Validar Código
            </>
          )}
        </Button>
        <Button variant="outline" onClick={resetForm} disabled={isValidating} className="py-4 sm:py-5 text-lg sm:text-xl ">
          Limpar
        </Button>
      </div>
    </CardContent>
  </Card>

  {/* Badge Info - metade direita no desktop */}
  <Card className="w-full lg:w-1/2 min-h-[600px] shadow-lg">
    <CardHeader className="p-6 sm:p-8">
      <CardTitle className="flex items-center gap-4 text-xl sm:text-2xl">
        <Award className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-500" /> Informações
      </CardTitle>
      <CardDescription className="text-gray-700 text-base sm:text-lg">
        {badgeInfo ? "Detalhes do badge" : "Valide o código para ver as informações"}
      </CardDescription>
    </CardHeader>
    <CardContent className="p-8 sm:p-10">
      {!badgeInfo ? (
        <div className="text-center py-16 sm:py-20 text-gray-400">
          <AlertCircle className="h-20 w-20 sm:h-24 sm:w-24 mx-auto mb-6" />
          <p className="text-lg sm:text-xl">Nenhum código validado</p>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <div className="p-8 sm:p-10 bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl border relative overflow-hidden">
            {badgeInfo.badgeImagePath && (
              <img
                src={buildUrl(badgeInfo.badgeImagePath, "badges") ?? "/placeholder.svg"}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-10"
              />
            )}
            <div className="relative z-10">
              <h3 className="font-bold text-3xl sm:text-4xl mb-4 sm:mb-5">{badgeInfo.badgeName}</h3>
              {badgeInfo.badgeCategory && (
                <Badge variant="secondary" className="text-lg sm:text-xl">{badgeInfo.badgeCategory}</Badge>
              )}
              <p className="text-gray-700 text-lg sm:text-lg">{badgeInfo.badgeDescription}</p>
              {isValidToken && (
                <div className="flex justify-center mt-6 sm:mt-8">
                  <Button
                    onClick={downloadBadge}
                    disabled={isDownloading}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-5 sm:py-6 px-8 sm:px-10 text-xl sm:text-2xl"
                  >
                    {isDownloading ? (
                      <>
                        <Clock className="h-7 w-7 sm:h-8 sm:w-8 mr-4 animate-spin" />
                        Baixando...
                      </>
                    ) : (
                      <>
                        <Download className="h-7 w-7 sm:h-8 sm:w-8 mr-4" />
                        Baixar Badge
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

                {/* Emissor */}
                {badgeInfo.issuer && (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Emitido por
                    </div>
                    <div className="flex items-center gap-4">
                      <img
                        src={buildUrl(badgeInfo.issuerImagePath, "issuers") ?? "/placeholder.svg"}
                        alt={badgeInfo.issuer}
                        className="w-26 h-16 object-cover rounded-xl"
                      />
                      <h4 className="text-blue-800 font-bold">
                        <a
                          href="https://incode-tech-school.com.br/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
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
                <div
                  className={`p-4 rounded-xl border ${isTokenExpired(badgeInfo.tokenExpiresAt) ? "bg-red-50" : "bg-green-50"}`}
                >
                  <p>
                    <strong>Válido até:</strong> {formatDate(badgeInfo.tokenExpiresAt)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div className="text-gray-500">{icon}</div>
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-gray-900">{value}</p>
      </div>
    </div>
  )
}
function setJsonPreview(jsonString: string) {
  throw new Error("Function not implemented.sacana")
}

function setOpenJsonModal(arg0: boolean) {
  throw new Error("Function not implemented.")
}



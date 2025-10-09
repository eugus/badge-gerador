"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Award, Download, Share2, ChevronRight, Calendar, User, CheckCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface BadgeData {
  id: number
  badgeName: string
  badgeDescription: string
  badgeCategory: string
  badgeImagePath: string
  issuer: string
  issuerImagePath: string
  issuerUrl: string
  studentName: string
  studentEmail: string
  achievementReason: string
  assignedAt: string
  criteria: string[]
}

export default function PublicBadgePage() {
  const params = useParams()
  const assignmentId = params.assignmentId as string
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchBadgeData()
  }, [assignmentId])

  const fetchBadgeData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/badges/${assignmentId}`)
      if (!res.ok) throw new Error("Badge não encontrado")
      const data = await res.json()
      setBadgeData(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do badge",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
  if (!assignmentId) return;

  try {
    const response = await fetch(`http://localhost:8080/api/badges/download/${assignmentId}`);
    if (!response.ok) throw new Error("Erro ao baixar");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Pega o filename do Content-Disposition do backend
    const disposition = response.headers.get("Content-Disposition");
    let filename = "badge.png";
    if (disposition && disposition.includes("filename=")) {
      filename = disposition.split("filename=")[1].replace(/"/g, "");
    }

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
  }
};

const buildUrl = (id: number | string | undefined, type: "badges" | "issuers") => {
  if (!id) return "/placeholder.svg" // fallback
  console.log("Building URL for", type, id)
  return `${process.env.NEXT_PUBLIC_API_URL}/api/public/assertions/${type}/${id}/image`
}

const buildIssuerUrl = (path: string | undefined) => {
  if (!path) return "/placeholder.svg" // fallback
  if (path.startsWith("http")) return path // se já for URL completa
  return `${process.env.NEXT_PUBLIC_API_URL}/api/public/assertions/issuers/${path}/image`
}

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: badgeData?.badgeName,
          text: `Confira meu badge: ${badgeData?.badgeName}`,
          url: shareUrl,
        })
        .catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Carregando badge...</p>
        </div>
      </div>
    )
  }

  if (!badgeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Award className="h-24 w-24 text-gray-300 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-700">Badge não encontrado</h2>
          <p className="text-gray-500">Este badge pode ter sido removido ou o link está incorreto</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 ">
      {/* Header */}
      <header className="relative bg-white/90 backdrop-blur-md shadow-lg  border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto  py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/"  className=" flex items-center text-xl  hover:text-blue-600 transition-colors">
              Backpack
              <ChevronRight className="h-4 w-4 mt-[4px] ml-1" />
            </Link>
            
            <span className="text-gray-900 font-medium">{badgeData.badgeName}</span>
          </nav>
        </div>
      </header>
<main className="max-w-5xl mx-auto   sm: bg-white/90 rounded-2xl shadow-xl mt-4 mb-6 overflow-hidden"
  style={{ height: "85vh" }}
>
  {/* Title and Actions */}
  <div className="  pt-3 flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4 bg-gray-950 text-white rounded-t-2xl p-4" style={{ width: "200vh" }}>
    <div className="flex-1">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-100 mb-1">
        {badgeData.badgeName}
      </h1>
      <p className="text-sm sm:text-base font-semibold text-gray-200 mb-2">
        Awarded to {badgeData.studentEmail}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/profile/${assignmentId}`}
          target="_blank"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-600 font-medium text-sm"
        >
          View public page
          <ExternalLink className="h-4 w-4" />
        </Link>
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          Public
        </Badge>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 pt-1 md:pt-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-gray-50 bg-gray-900 w-full sm:w-auto text-xs"
      >
        <Download className="h-4 w-4" />
        Download
      </Button>
      <Button
        onClick={handleShare}
        size="sm"
        className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-xs"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  </div>

  {/* Main Grid */}
  <div className="px-10 grid grid-cols-1 lg:grid-cols-3 gap-4 px-3 sm:px-5 pb-4"
    style={{ height: "calc(90vh - 130px)", overflow: "hidden" }}
  >
    {/* Left Column - Badge Image */}
    <div className="lg:col-span-1 flex items-center justify-center">
      <Card className="overflow-hidden shadow-md border w-full max-w-xs mx-auto">
        <CardContent className="p-0">
          <div className="aspect-square bg-gradient-to-br from-blue-50 flex items-center justify-center">
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/api/public/assertions/badges/${badgeData.id}/image`}
              alt={badgeData.badgeImagePath}
              className="w-full h-full object-contain p-6 sm:p-8"
            />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Right Column - Information */}
    <div className="lg:col-span-2 space-y-3 overflow-y-auto pr-1"
      style={{ maxHeight: "calc(90vh - 140px)" }}
    >
      {/* Offered By */}
      <Card className="shadow-sm border">
        <CardContent className="p-4">
          <h2 className="text-base font-bold text-gray-900 mb-2">Offered by</h2>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
            <img
              src={buildUrl(1, "issuers")}
              alt="INCODE TECH SCHOOL"
              className="w-12 h-12 object-contain rounded-lg border"
            />
            <a
              href={badgeData.issuerUrl || "https://incode-tech-school.com.br/"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-2 hover:underline"
            >
              {badgeData.issuer}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Issued On */}
      <Card className="shadow-sm border">
        <CardContent className="p-4">
          <h2 className="text-base font-bold text-gray-900 mb-1">Issued on</h2>
          <p className="text-gray-900 text-sm">{formatDate(badgeData.assignedAt)}</p>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="shadow-sm border">
        <CardContent className="p-4">
          <h2 className="text-base font-bold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-700 text-sm leading-relaxed">{badgeData.badgeDescription}</p>
          {badgeData.achievementReason && (
            <>
              <Separator className="my-3" />
              <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded">
                <p className="text-sm font-medium text-blue-900 mb-1">Achievement Reason</p>
                <p className="text-blue-800 text-sm">{badgeData.achievementReason}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Earning Criteria */}
      {badgeData.criteria && badgeData.criteria.length > 0 && (
        <Card className="shadow-sm border">
          <CardContent className="p-4">
            <h2 className="text-base font-bold text-gray-700 mb-2">Earning criteria</h2>
            <div className="space-y-1">
              {badgeData.criteria.map((criterion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                  <p className="text-gray-700 text-sm flex-1">{criterion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recipient Info */}
      <Card className="shadow-sm border bg-gradient-to-br from-slate-50 to-blue-50">
        <CardContent className="p-4">
          <h2 className="text-base font-semibold text-gray-700 mb-2">
            Badge Recipient
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-start gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Name</p>
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  Mãe de Gustavo
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Awarded on</p>
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  {formatDate(badgeData.assignedAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</main>

      {/* Footer */}

    </div>
  )
}

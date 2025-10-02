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
      <header className="relative bg-white/90 backdrop-blur-md shadow-lg pr-[500px] border-b border-gray-200/50">
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto mt-10  pb-6 bg-white/90 rounded-lg shadow-2xl">
        {/* Title and Actions */}
        <div className="h-36 pt-6 flex flex-col px-7 rounded-t-lg bg-gray-950 md:flex-row md:items-start md:justify-between gap-6 mb-8 ">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">{badgeData.badgeName}</h1>
            <p className="text-xl font-bold text-white mb-4">Awarded to {badgeData.studentEmail}</p>
            <div className="flex items-center gap-3">
              <Link
                href={`/profile/${assignmentId}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700 font-medium">
                View public page
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Badge variant="secondary" className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Public
              </Badge>
            </div>
          </div>

          <div className="flex gap-3 pt-7">
            <Button variant="outline" size="lg" className="gap-2 text-gray-50 bg-transparent bg-gray-900">
              <Download className="h-5 w-5" />
              Download
            </Button>
            <Button onClick={handleShare} size="lg" className="gap-2 bg-transparent bg-blue-600 hover:bg-blue-700">
              <Share2 className="h-5 w-5" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8 px-7">
          {/* Left Column - Badge Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden shadow-lg border-2">
              <CardContent className="p-0">
                <div className="aspect-square bg-gradient-to-br from-blue-50  flex items-center justify-center">
                  <img
  src={`${process.env.NEXT_PUBLIC_API_URL}/api/public/assertions/badges/${badgeData.id}/image`}
  alt={badgeData.badgeImagePath}
  className="w-full h-full object-contain p-8"
/>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Offered By */}
            <Card className="shadow-md border-2">
              <CardContent className="p-6 bg-transparent hover:bg-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 ">Offered by</h2>
                <div className="flex items-center gap-4">
                  <img
  src={buildUrl(1, "issuers")}
  alt="INCODE TECH SCHOOL"
  className="w-16 h-16 object-contain rounded-lg border"
/>
                  <a
                    href={badgeData.issuerUrl || "https://incode-tech-school.com.br/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-semibold text-lg flex items-center gap-2 hover:underline"
                  >
                    {badgeData.issuer}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Issued On */}
            <Card className="shadow-md border-2">
              <CardContent className="p-6 hover:bg-gray-200">
                <h2 className="text-lg font-bold  text-gray-900 mb-2">Issued on</h2>
                <p className="text-gray-900 text-lg">{formatDate(badgeData.assignedAt)}</p>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="shadow-md border-2 hover:bg-gray-200">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">{badgeData.badgeDescription}</p>
                {badgeData.achievementReason && (
                  <>
                    <Separator className="my-4" />
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-1">Achievement Reason</p>
                      <p className="text-blue-800">{badgeData.achievementReason}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Earning Criteria */}
            {badgeData.criteria && badgeData.criteria.length > 0 && (
              <Card className="shadow-md border-2">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold text-gray-700 mb-4">Earning criteria</h2>
                  <div className="space-y-3">
                    {badgeData.criteria.map((criterion, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-1">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-gray-700 flex-1">{criterion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recipient Info */}
            <Card className="shadow-md border-2 bg-gradient-to-br from-slate-50 to-blue-50 ">
              <CardContent className="p-6 bg-transparent hover:bg-gray-200">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Badge Recipient</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-900">Mãe de Gustavo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Awarded on</p>
                      <p className="font-semibold text-gray-900">{formatDate(badgeData.assignedAt)}</p>
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

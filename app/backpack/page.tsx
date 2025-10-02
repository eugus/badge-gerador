"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Award, Search, Filter, MoreVertical, Share2, Download, Home, LogOut, User, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface BadgeItem {
  id: number
  name: string
  description: string
  category: string
  imagePath: string
  issuer: string
  issuerImagePath: string
  createdAt: string
  isActive: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export default function BackpackPage() {
  const [badges, setBadges] = useState<BadgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    setLoading(true)
    try {
      console.log(`🔍 Buscando badges em: ${API_BASE_URL}/api/badges`)

      const res = await fetch(`${API_BASE_URL}/api/badges`)

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      console.log("✅ Badges recebidos:", data)

      // Filtrar apenas badges ativos
      const activeBadges = data.filter((badge: BadgeItem) => badge.isActive)
      console.log(`✅ ${activeBadges.length} badges ativos de ${data.length} totais`)

      setBadges(activeBadges)
    } catch (error) {
      console.error("❌ Erro ao buscar badges:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os badges",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredBadges = badges.filter((badge) => {
    const matchesSearch =
      badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !filterCategory || badge.category === filterCategory
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getBadgeImageUrl = (badgeId: number) => {
    if (!badgeId) {
      console.warn("⚠️ Badge ID não fornecido")
      return "/placeholder.svg"
    }
    const url = `${API_BASE_URL}/api/public/assertions/badges/${badgeId}/image`
    console.log(`🖼️ URL da imagem do badge ${badgeId}:`, url)
    return url
  }

  const handleShareBadge = (badgeId: number) => {
    // TODO: Usar assignmentId quando implementar autenticação
    const url = `${window.location.origin}/badge/${badgeId}`
    navigator.clipboard.writeText(url)
    toast({ title: "Link copiado!", description: "Link do badge copiado para área de transferência" })
  }

  const handleClickBagde = (badgeId: number) => {
    // TODO: Usar assignmentId quando implementar autenticação
    const url = `${window.location.origin}/badge/${badgeId}`
    navigator.clipboard.writeText(url)
    toast({ title: "Link copiado!", description: "Link do badge copiado para área de transferência" })
  }

  const handleDownloadBadge = async (badgeId: number, badgeName: string) => {
    try {
      const imageUrl = getBadgeImageUrl(badgeId)
      console.log(`⬇️ Baixando badge ${badgeId} de: ${imageUrl}`)

      const res = await fetch(imageUrl)

      if (!res.ok) {
        throw new Error("Erro ao baixar imagem")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${badgeName.toLowerCase().replace(/\s+/g, "-")}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({ title: "Sucesso!", description: "Badge baixado com sucesso" })
    } catch (error) {
      console.error("❌ Erro ao baixar badge:", error)
      toast({ title: "Erro", description: "Não foi possível baixar o badge", variant: "destructive" })
    }
  }

  const categories = Array.from(new Set(badges.map((b) => b.category).filter(Boolean)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando badges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-xl transform transition-transform hover:scale-105 hover:shadow-2xl">
                                <Award className="h-8 w-8 text-white" />
                              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Minha Mochila</h1>
                <p className="text-sm text-gray-600">Meus badges conquistados</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/">
                <Button className="bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl rounded-xl px-6 transform transition-all hover:-translate-y-0.5">
                                  <Home className="h-4 w-4 mr-2" />
                                  Dashboard
                                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl rounded-xl px-6 transform transition-all hover:-translate-y-0.5">
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Backpack</h2>
            <p className="text-lg text-gray-600 mt-1">Colete e compartilhe os badges digitais que você conquistou.</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="badges" className="w-full">
            <TabsList className="bg-white border">
              <TabsTrigger value="badges" className="data-[state=active]:bg-blue-50">
                Badges
              </TabsTrigger>
              <TabsTrigger value="collections" className="data-[state=active]:bg-blue-50">
                Coleções
              </TabsTrigger>
            </TabsList>

            <TabsContent value="badges" className="space-y-6 mt-6">
              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-1 gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Buscar badges..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                  {categories.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Filter className="h-4 w-4 mr-2" />
                          Filtro
                          {filterCategory && <span className="ml-2 text-xs">({filterCategory})</span>}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => setFilterCategory(null)}>
                          <span className={!filterCategory ? "font-bold" : ""}>Todos</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {categories.map((category) => (
                          <DropdownMenuItem key={category} onClick={() => setFilterCategory(category)}>
                            <span className={filterCategory === category ? "font-bold" : ""}>{category}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Badge Count */}
              <p className="text-sm text-gray-600">
                {filteredBadges.length} {filteredBadges.length === 1 ? "badge listado" : "badges listados"}.
              </p>

              {/* Badges Grid */}
              {filteredBadges.length === 0 ? (
                <Card className="p-12 text-center">
                  <Award className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum badge encontrado</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || filterCategory
                      ? "Tente ajustar os filtros de busca"
                      : "Você ainda não possui badges na sua coleção"}
                  </p>
                  {!searchTerm && !filterCategory && badges.length === 0 && (
                    <Button onClick={fetchBadges} variant="outline">
                      <Search className="h-4 w-4 mr-2" />
                      Recarregar
                    </Button>
                  )}
                </Card>
              ) : (

               
             
             
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {filteredBadges.map((badge) => (
    <Link key={badge.id} href={`/badge/${badge.id}`} className="block">
      <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden cursor-pointer">
        <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
          {/* Badge Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleShareBadge(badge.id)}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadBadge(badge.id, badge.name)}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Badge Image */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 p-2">
              <img
                src={getBadgeImageUrl(badge.id) || "/placeholder.svg"}
                alt={badge.name}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  console.error(`❌ Erro ao carregar imagem do badge ${badge.id}`)
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
            </div>
          </div>

          {/* Badge Info */}
          <div className="space-y-2 w-full">
            <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{badge.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-1">{badge.issuer}</p>
            {badge.createdAt && (
              <p className="text-xs text-gray-500">{formatDate(badge.createdAt)}</p>
            )}
          </div>

          {/* Badge Category */}
          {badge.category && (
            <Badge variant="outline" className="text-xs">
              {badge.category}
            </Badge>
          )}

          {/* Badge Description */}
          {badge.description && (
            <p className="text-xs text-gray-500 line-clamp-2 w-full">{badge.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  ))}
</div>
              )}
            
            </TabsContent>

            <TabsContent value="collections" className="space-y-6 mt-6">
              <Card className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Coleções em Breve</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Organize seus badges em coleções personalizadas. Esta funcionalidade estará disponível em breve!
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>Fornecido por Incode Tech School</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-blue-600 transition-colors">
                Termos de Serviço
              </Link>
              <Link href="#" className="hover:text-blue-600 transition-colors">
                Política de Privacidade
              </Link>
              <Link href="#" className="hover:text-blue-600 transition-colors">
                Suporte
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

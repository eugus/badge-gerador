"use client"

import type React from "react"
import { useState, useEffect, useCallback, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Award, Edit, Trash2, Upload, ImageIcon, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ImageGallerySelector from "@/components/image-gallery-selector"

interface BadgeType {
  id: number
  name: string
  description: string
  imagePath: string
  category: string
  issuer: string
  issuerImagePath: string
  isActive: boolean
}

interface FormData {
  name: string
  description: string
  category: string
  issuer: string
  isActive: boolean
}

// Componente de Skeleton para Loading
const BadgeCardSkeleton = memo(() => (
  <Card className="h-[280px] animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100" />
    <div className="relative z-10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-full mb-3" />
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-16" />
          <div className="h-6 bg-gray-200 rounded w-20" />
        </div>
      </CardContent>
    </div>
  </Card>
))

BadgeCardSkeleton.displayName = "BadgeCardSkeleton"

// Componente de Imagem Otimizada
const OptimizedImage = memo(
  ({
    src,
    alt,
    className,
    fallback,
    onLoad,
    onError,
  }: {
    src: string | null
    alt: string
    className: string
    fallback: React.ReactNode
    onLoad?: () => void
    onError?: () => void
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false)
    const [imageError, setImageError] = useState(false)

    const handleLoad = useCallback(() => {
      setImageLoaded(true)
      onLoad?.()
    }, [onLoad])

    const handleError = useCallback(() => {
      setImageError(true)
      onError?.()
    }, [onError])

    if (!src || imageError) {
      return <>{fallback}</>
    }

    return (
      <div className="relative">
        {!imageLoaded && <div className={`${className} bg-gray-200 animate-pulse absolute inset-0`} />}
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className={`${className} ${imageLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      </div>
    )
  },
)

OptimizedImage.displayName = "OptimizedImage"

// Componente do Card do Badge
const BadgeCard = memo(
  ({
    badge,
    onEdit,
    onDelete,
  }: {
    badge: BadgeType
    onEdit: (badge: BadgeType) => void
    onDelete: (id: number) => void
  }) => {
    const getImageUrl = useCallback((imagePath: string) => {
      if (!imagePath) return null
      if (imagePath.startsWith("http")) return imagePath
      const filename = imagePath.includes("/") ? imagePath.split("/").pop() : imagePath
      return `${process.env.NEXT_PUBLIC_API_URL}/uploads/badges/${filename}`
    }, [])

    const getIssuerImageUrl = useCallback((imagePath: string) => {
      if (!imagePath) return null
      if (imagePath.startsWith("http")) return imagePath
      const filename = imagePath.includes("/") ? imagePath.split("/").pop() : imagePath
      return `${process.env.NEXT_PUBLIC_API_URL}/uploads/issuers/${filename}`
    }, [])

    const imageUrl = getImageUrl(badge.imagePath)
    const issuerImageUrl = getIssuerImageUrl(badge.issuerImagePath)

    const handleImageLoad = useCallback((type: string, url: string) => {
      console.log(`✅ ${type} carregada:`, url)
    }, [])

    const handleImageError = useCallback((type: string, url: string) => {
      console.log(`⚠️ ${type} falhou:`, url)
    }, [])

    return (
      <Card className="h-[280px] relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        {/* Background Image com dimensões fixas */}
        {imageUrl && (
          <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
            <OptimizedImage
              src={imageUrl}
              alt={badge.name}
              className="w-full h-full object-cover"
              fallback={<div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />}
              onLoad={() => handleImageLoad("Badge background", imageUrl)}
              onError={() => handleImageError("Badge background", imageUrl)}
            />
          </div>
        )}

        {/* Overlay fixo */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-white/70" />

        {/* Content com altura fixa */}
        <div className="relative z-10 h-full flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-start justify-between min-h-[60px]">
              <div className="flex items-center space-x-3 flex-1">
                {/* Badge Icon/Image com dimensões fixas */}
                <div className="w-12 h-12 flex-shrink-0">
                  {imageUrl ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                      <OptimizedImage
                        src={imageUrl}
                        alt={badge.name}
                        className="w-full h-full object-cover"
                        fallback={
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <Award className="h-6 w-6 text-white" />
                          </div>
                        }
                        onLoad={() => handleImageLoad("Badge icon", imageUrl)}
                        onError={() => handleImageError("Badge icon", imageUrl)}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-bold text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem]">
                    {badge.name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1 mt-1 min-h-[1.5rem]">
                    {badge.category && (
                      <Badge variant="secondary" className="text-xs bg-white/80">
                        {badge.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons com posição fixa */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(badge)}
                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(badge.id)}
                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0 flex-1 flex flex-col justify-between">
            {/* Descrição com altura fixa */}
            <div className="mb-3">
              <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                {badge.description || "Sem descrição disponível"}
              </p>
            </div>

            {/* Emissor com altura fixa */}
            <div className="mb-3 min-h-[2.5rem]">
              {badge.issuer && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <div className="w-10 h-6 flex-shrink-0">
                    {issuerImageUrl ? (
                      <OptimizedImage
                        src={issuerImageUrl}
                        alt={badge.issuer}
                        className="w-10 h-6 object-cover rounded"
                        fallback={<Building2 className="h-6 w-6 text-blue-600" />}
                        onLoad={() => handleImageLoad("Issuer", issuerImageUrl)}
                        onError={() => handleImageError("Issuer", issuerImageUrl)}
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <span className="text-sm text-blue-800 font-medium truncate">{badge.issuer}</span>
                </div>
              )}
            </div>

            {/* Footer com altura fixa */}
            <div className="flex items-center justify-between min-h-[2rem]">
              <Badge
                variant={badge.isActive ? "default" : "secondary"}
                className={badge.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
              >
                {badge.isActive ? "✓ Ativo" : "○ Inativo"}
              </Badge>

              {badge.imagePath ? (
                <span className="text-xs text-gray-600 flex items-center gap-1 bg-white/80 px-2 py-1 rounded-full">
                  <ImageIcon className="h-3 w-3" />
                  Com imagem
                </span>
              ) : (
                <span className="text-xs text-gray-500 flex items-center gap-1 bg-white/60 px-2 py-1 rounded-full">
                  <Upload className="h-3 w-3" />
                  Sem imagem
                </span>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    )
  },
)

BadgeCard.displayName = "BadgeCard"

// Componente Principal
export default function BadgesTab() {
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    category: "",
    issuer: "Sistema de Badges Acadêmicos",
    isActive: true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [issuerImageFile, setIssuerImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [issuerImagePreview, setIssuerImagePreview] = useState<string | null>(null)
  const [selectedBadgeImageFromGallery, setSelectedBadgeImageFromGallery] = useState<string | null>(null)
  const [selectedIssuerImageFromGallery, setSelectedIssuerImageFromGallery] = useState<string | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const [newIssuerImagePreview, setNewIssuerImagePreview] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/badges`)
      if (response.ok) {
        const data = await response.json()
        setBadges(data)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar badges",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar badges:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão com o servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchBadges()
  }, [fetchBadges])

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }, [])

  const handleIssuerImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setIssuerImageFile(file)

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setIssuerImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setIssuerImagePreview(null)
    }
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      console.log("🚀 ===== INICIANDO SUBMIT =====")
      console.log("📝 Form data:", formData)
      console.log("🖼️ Image file:", imageFile ? imageFile.name : "nenhum")
      console.log("🏢 Issuer image file:", issuerImageFile ? issuerImageFile.name : "nenhum")
      console.log("🎨 Selected badge image from gallery:", selectedBadgeImageFromGallery)
      console.log("🏢 Selected issuer image from gallery:", selectedIssuerImageFromGallery)

      try {
        const formDataToSend = new FormData()

        // Incluir informações sobre imagens da galeria
        const badgeData = {
          ...formData,
          useExistingBadgeImage: selectedBadgeImageFromGallery,
          useExistingIssuerImage: selectedIssuerImageFromGallery,
        }

        console.log("📦 Badge data to send:", badgeData)

        const badgeBlob = new Blob([JSON.stringify(badgeData)], {
          type: "application/json",
        })
        formDataToSend.append("badge", badgeBlob)

        if (imageFile) {
          formDataToSend.append("image", imageFile, imageFile.name)
          console.log("✅ Badge image file added to FormData:", imageFile.name, imageFile.size, "bytes")
        }

        if (issuerImageFile) {
          formDataToSend.append("issuerImage", issuerImageFile, issuerImageFile.name)
          console.log("✅ Issuer image file added to FormData:", issuerImageFile.name, issuerImageFile.size, "bytes")
        }

        // Log do FormData
        console.log("📋 FormData entries:")
        for (const [key, value] of formDataToSend.entries()) {
          if (value instanceof File) {
            console.log(`   ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
          } else {
            console.log(`   ${key}:`, value)
          }
        }

        const url = editingBadge
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/badges/${editingBadge.id}`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/badges`

        const method = editingBadge ? "PUT" : "POST"

        console.log(`🌐 Sending ${method} request to:`, url)

        const response = await fetch(url, {
          method,
          body: formDataToSend,
        })

        console.log("📡 Response status:", response.status)
        console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))

        if (response.ok) {
          const responseData = await response.json()
          console.log("✅ Success response:", responseData)

          toast({
            title: "Sucesso",
            description: editingBadge ? "Badge atualizado com sucesso!" : "Badge criado com sucesso!",
          })
          fetchBadges()
          resetForm()
          setIsDialogOpen(false)
        } else {
          const errorText = await response.text()
          console.error("❌ Error response:", errorText)
          toast({
            title: "Erro",
            description: errorText || "Erro ao salvar badge",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("💥 Submit error:", error)
        toast({
          title: "Erro",
          description: "Erro de conexão com o servidor",
          variant: "destructive",
        })
      }
    },
    [
      formData,
      imageFile,
      issuerImageFile,
      selectedBadgeImageFromGallery,
      selectedIssuerImageFromGallery,
      editingBadge,
      toast,
      fetchBadges,
    ],
  )

  const handleEdit = useCallback((badge: BadgeType) => {
    setEditingBadge(badge)
    setFormData({
      name: badge.name,
      description: badge.description,
      category: badge.category,
      issuer: badge.issuer || "Sistema de Badges Acadêmicos",
      isActive: badge.isActive,
    })
    setImagePreview(null)
    setIssuerImagePreview(null)
    setSelectedBadgeImageFromGallery(badge.imagePath || null)
    setSelectedIssuerImageFromGallery(badge.issuerImagePath || null)
    setNewImagePreview(null)
    setNewIssuerImagePreview(null)
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm("Tem certeza que deseja excluir este badge?")) return

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/badges/${id}`, {
          method: "DELETE",
        })

        if (response.ok) {
          toast({
            title: "Sucesso",
            description: "Badge excluído com sucesso!",
          })
          fetchBadges()
        } else {
          toast({
            title: "Erro",
            description: "Erro ao excluir badge",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro de conexão com o servidor",
          variant: "destructive",
        })
      }
    },
    [toast, fetchBadges],
  )

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      category: "",
      issuer: "Sistema de Badges Acadêmicos",
      isActive: true,
    })
    setEditingBadge(null)
    setImageFile(null)
    setIssuerImageFile(null)
    setImagePreview(null)
    setIssuerImagePreview(null)
    setSelectedBadgeImageFromGallery(null)
    setSelectedIssuerImageFromGallery(null)
    setNewImagePreview(null)
    setNewIssuerImagePreview(null)
  }, [])

  const handleBadgeFileSelect = useCallback((file: File | null) => {
    console.log("🖼️ Badge file selected:", file ? file.name : "none")
    setImageFile(file)
    setSelectedBadgeImageFromGallery(null) // Limpar seleção da galeria

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setNewImagePreview(result)
        console.log("✅ Badge preview generated")
      }
      reader.readAsDataURL(file)
    } else {
      setNewImagePreview(null)
    }
  }, [])

  const handleIssuerFileSelect = useCallback((file: File | null) => {
    console.log("🏢 Issuer file selected:", file ? file.name : "none")
    setIssuerImageFile(file)
    setSelectedIssuerImageFromGallery(null) // Limpar seleção da galeria

    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setNewIssuerImagePreview(result)
        console.log("✅ Issuer preview generated")
      }
      reader.readAsDataURL(file)
    } else {
      setNewIssuerImagePreview(null)
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Gerenciar Badges
            </CardTitle>
            <CardDescription>Crie e gerencie os badges disponíveis no sistema</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Badge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBadge ? "Editar Badge" : "Novo Badge"}</DialogTitle>
                <DialogDescription>
                  {editingBadge ? "Edite as informações do badge" : "Preencha os dados do novo badge"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Primeiro Projeto"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descreva o que este badge representa..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: Projetos, Colaboração, Liderança"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="issuer" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Emissor/Instituição *
                    </Label>
                    <Input
                      id="issuer"
                      value={formData.issuer}
                      onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                      placeholder="Ex: Universidade XYZ, Empresa ABC, Instituto DEF"
                      required
                    />
                    <p className="text-xs text-gray-500">Nome da instituição ou empresa que emite este badge</p>
                  </div>

                  <div className="grid gap-2">
                    <ImageGallerySelector
                      type="badges"
                      selectedImage={selectedBadgeImageFromGallery}
                      onImageSelect={setSelectedBadgeImageFromGallery}
                      onFileSelect={handleBadgeFileSelect}
                      label="Imagem do Badge"
                      description="Escolha uma imagem da galeria ou envie uma nova"
                    />
                    {newImagePreview && (
                      <div className="mt-2">
                        <Label className="text-sm font-medium text-green-600">Nova Imagem Selecionada:</Label>
                        <div className="relative inline-block mt-1">
                          <img
                            src={newImagePreview || "/placeholder.svg"}
                            alt="Preview da nova imagem"
                            className="w-20 h-20 object-cover rounded-lg border-2 border-green-200"
                          />
                          <Badge variant="default" className="absolute -bottom-2 left-0 text-xs bg-green-500">
                            Novo Arquivo
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <ImageGallerySelector
                      type="issuers"
                      selectedImage={selectedIssuerImageFromGallery}
                      onImageSelect={setSelectedIssuerImageFromGallery}
                      onFileSelect={handleIssuerFileSelect}
                      label="Logo do Emissor"
                      description="Logo ou imagem da instituição emissora (opcional)"
                    />
                    {newIssuerImagePreview && (
                      <div className="mt-2">
                        <Label className="text-sm font-medium text-green-600">Nova Logo Selecionada:</Label>
                        <div className="relative inline-block mt-1">
                          <img
                            src={newIssuerImagePreview || "/placeholder.svg"}
                            alt="Preview da nova logo"
                            className="w-20 h-20 object-cover rounded-lg border-2 border-green-200"
                          />
                          <Badge variant="default" className="absolute -bottom-2 left-0 text-xs bg-green-500">
                            Novo Arquivo
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Badge ativo</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingBadge ? "Atualizar" : "Criar"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <BadgeCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {!loading && badges.length === 0 && (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum badge encontrado</p>
            <p className="text-gray-400 text-sm">Crie seu primeiro badge clicando no botão acima</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

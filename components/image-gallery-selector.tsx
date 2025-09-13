"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, ImageIcon, Check, Search, Calendar, HardDrive, RefreshCw, X, Users, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageInfo {
  filename: string
  size: number
  lastModified: string
  url: string
  formattedSize: string
  usageCount: number
  usedBy: string[]
}

interface ImageGallerySelectorProps {
  type: "badges" | "issuers"
  selectedImage: string | null
  onImageSelect: (filename: string | null) => void
  onFileSelect: (file: File | null) => void
  label: string
  description?: string
}

export default function ImageGallerySelector({
  type,
  selectedImage,
  onImageSelect,
  onFileSelect,
  label,
  description,
}: ImageGallerySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [gallery, setGallery] = useState<ImageInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFromGallery, setSelectedFromGallery] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("gallery")
  const { toast } = useToast()

  const fetchGallery = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/images/${type}/gallery`)
      if (response.ok) {
        const data = await response.json()
        setGallery(data)
        console.log(`📸 Galeria ${type} carregada:`, data.length, "imagens do banco de dados")

        // Log das imagens mais usadas
        if (data.length > 0) {
          console.log("🏆 Imagens mais populares:")
          data.slice(0, 3).forEach((img: ImageInfo) => {
            console.log(`   - ${img.filename}: ${img.usageCount} usos`)
          })
        }
      } else {
        console.error("Erro ao carregar galeria")
        toast({
          title: "Aviso",
          description: "Não foi possível carregar a galeria de imagens",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar galeria:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão ao buscar galeria",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [type, toast])

  useEffect(() => {
    if (isOpen) {
      fetchGallery()
    }
  }, [isOpen, fetchGallery])

  const filteredGallery = gallery.filter(
    (image) =>
      image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.usedBy.some((name) => name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleGallerySelect = (filename: string) => {
    setSelectedFromGallery(filename)
  }

  const handleConfirmSelection = () => {
    if (activeTab === "gallery" && selectedFromGallery) {
      onImageSelect(selectedFromGallery)
      onFileSelect(null) // Limpar arquivo selecionado

      const selectedImageInfo = gallery.find((img) => img.filename === selectedFromGallery)
      toast({
        title: "✅ Imagem Selecionada",
        description: `"${selectedFromGallery}" selecionada (usada por ${selectedImageInfo?.usageCount || 0} ${type === "badges" ? "badges" : "emissores"})`,
      })
    }
    setIsOpen(false)
    setSelectedFromGallery(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    console.log("📁 File input changed:", file ? `${file.name} (${file.size} bytes, ${file.type})` : "no file")

    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "❌ Arquivo Inválido",
          description: "Por favor, selecione apenas arquivos de imagem",
          variant: "destructive",
        })
        return
      }

      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "❌ Arquivo Muito Grande",
          description: "O arquivo deve ter no máximo 10MB",
          variant: "destructive",
        })
        return
      }

      onFileSelect(file)
      onImageSelect(null) // Limpar seleção da galeria
      setIsOpen(false)

      toast({
        title: "📁 Arquivo Selecionado",
        description: `"${file.name}" (${formatFileSize(file.size)}) será enviado quando você salvar o badge`,
      })
    }
  }

  const clearSelection = () => {
    onImageSelect(null)
    onFileSelect(null)
    toast({
      title: "🗑️ Seleção Limpa",
      description: "Nenhuma imagem selecionada",
    })
  }

  const getImageUrl = (filename: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${type}/${filename}`
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Data inválida"
    }
  }

  const getUsageText = (image: ImageInfo) => {
    if (type === "badges") {
      return `${image.usageCount} badge${image.usageCount !== 1 ? "s" : ""}`
    } else {
      return `${image.usageCount} emissor${image.usageCount !== 1 ? "es" : ""}`
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-gray-500">{description}</p>}

      {/* Preview da imagem selecionada */}
      {selectedImage && (
        <div className="relative inline-block">
          <img
            src={getImageUrl(selectedImage) || "/placeholder.svg"}
            alt="Preview"
            className="w-20 h-20 object-cover rounded-lg border-2 border-blue-200"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
            onClick={clearSelection}
          >
            <X className="h-3 w-3" />
          </Button>
          <Badge variant="secondary" className="absolute -bottom-2 left-0 text-xs">
            Da Galeria
          </Badge>
        </div>
      )}

      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 bg-transparent">
              <ImageIcon className="h-4 w-4 mr-2" />
              {selectedImage ? "Trocar Imagem" : "Escolher Imagem"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Galeria de Imagens - {type === "badges" ? "Badges" : "Emissores"}
              </DialogTitle>
              <DialogDescription>
                Escolha uma imagem já utilizada no sistema ou envie uma nova
                {gallery.length > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • {gallery.length} imagem{gallery.length !== 1 ? "ns" : ""} disponível
                    {gallery.length !== 1 ? "eis" : ""}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gallery" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Galeria ({gallery.length})
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Enviar Nova
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gallery" className="space-y-4">
                {/* Busca e Refresh */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={`Buscar por nome da imagem ou ${type === "badges" ? "badge" : "emissor"}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" onClick={fetchGallery} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {/* Estatísticas rápidas */}
                {gallery.length > 0 && !loading && (
                  <div className="flex gap-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      {gallery.length} imagens
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {gallery.reduce((sum, img) => sum + img.usageCount, 0)} usos totais
                    </span>
                    {searchTerm && (
                      <span className="flex items-center gap-1">
                        <Search className="h-4 w-4" />
                        {filteredGallery.length} encontradas
                      </span>
                    )}
                  </div>
                )}

                {/* Grid de Imagens */}
                <ScrollArea className="h-96">
                  {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : filteredGallery.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredGallery.map((image) => (
                        <div
                          key={image.filename}
                          className={`relative group cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                            selectedFromGallery === image.filename
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleGallerySelect(image.filename)}
                        >
                          <div className="aspect-square overflow-hidden rounded-t-lg">
                            <img
                              src={getImageUrl(image.filename) || "/placeholder.svg"}
                              alt={image.filename}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          </div>

                          {/* Overlay com informações */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center p-3">
                              <p className="text-sm font-medium truncate mb-1">{image.filename}</p>
                              <p className="text-xs mb-2">{image.formattedSize}</p>
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <Users className="h-3 w-3" />
                                {getUsageText(image)}
                              </div>
                            </div>
                          </div>

                          {/* Indicador de seleção */}
                          {selectedFromGallery === image.filename && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                              <Check className="h-4 w-4" />
                            </div>
                          )}

                          {/* Badge de popularidade */}
                          {image.usageCount > 1 && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full px-2 py-1 text-xs font-medium">
                              {image.usageCount}x
                            </div>
                          )}

                          {/* Informações na parte inferior */}
                          <div className="p-3 bg-white">
                            <p className="text-xs font-medium truncate mb-2" title={image.filename}>
                              {image.filename}
                            </p>

                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-xs">
                                <HardDrive className="h-3 w-3 mr-1" />
                                {image.formattedSize}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {image.usageCount}
                              </Badge>
                            </div>

                            {/* Lista de onde é usado */}
                            {image.usedBy.length > 0 && (
                              <div className="text-xs text-gray-500">
                                <p className="font-medium mb-1 flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  Usado em:
                                </p>
                                <div className="max-h-12 overflow-y-auto">
                                  {image.usedBy.slice(0, 3).map((name, index) => (
                                    <p key={index} className="truncate" title={name}>
                                      • {name}
                                    </p>
                                  ))}
                                  {image.usedBy.length > 3 && (
                                    <p className="text-gray-400">+{image.usedBy.length - 3} mais...</p>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-gray-400 mt-2 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(image.lastModified)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-2">
                        {searchTerm ? "Nenhuma imagem encontrada" : "Nenhuma imagem na galeria"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {searchTerm
                          ? "Tente outro termo de busca"
                          : `Crie o primeiro ${type === "badges" ? "badge" : "emissor"} com imagem para popular a galeria`}
                      </p>
                    </div>
                  )}
                </ScrollArea>

                {/* Botões de ação para galeria */}
                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmSelection} disabled={!selectedFromGallery}>
                    <Check className="h-4 w-4 mr-2" />
                    Usar Esta Imagem
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Enviar Nova Imagem</h3>
                  <p className="text-gray-500 mb-4">
                    Selecione uma imagem do seu computador. Ela será adicionada à galeria automaticamente após salvar o
                    badge.
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="max-w-xs mx-auto cursor-pointer"
                  />
                  <div className="mt-4 text-xs text-gray-400 space-y-1">
                    <p>📋 Formatos aceitos: JPG, PNG, GIF, WebP</p>
                    <p>📏 Tamanho máximo: 10MB</p>
                    <p>💡 A imagem será salva quando você criar/atualizar o badge</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {selectedImage && (
          <Button variant="outline" size="sm" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

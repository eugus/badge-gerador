"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Send, Mail, Award, Copy, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// --- Tipos ---
interface Student {
  course: string
  name: string
  email: string
}

interface BadgeType {
  id: number
  name: string
  description: string
  category: string
}

interface Assignment {
  id: number
  studentName: string
  studentEmail: string
  badgeName: string
  badgeDescription: string
  achievementReason: string
  emailSent?: boolean
  emailSentAt?: string
  downloadToken?: string
  downloadCount?: number
  tokenExpiresAt?: string
}

interface PageInfo {
  content: Student[]
  totalPages: number
  totalElements: number
  number: number
  size: number
  first: boolean
  last: boolean
}

// --- API ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const api = {
  get: (path: string) => fetch(`${API_BASE_URL}${path}`),
  post: (path: string, body?: any) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }),
}

// --- Diálogo para Nova Atribuição ---
function NewAssignmentDialog({
  badges,
  onAssignmentCreated,
}: {
  badges: BadgeType[]
  onAssignmentCreated: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ badgeId: "", achievementReason: "", sendEmail: true })
  const { toast } = useToast()

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchStudents = useCallback(
    async (page = 0, search = "") => {
      console.log(`📚 Buscando alunos - Página: ${page + 1}, Busca: "${search}"`)

      // 🔥 LIMPAR LISTA IMEDIATAMENTE ao iniciar nova busca
      setStudents([])
      setLoading(true)

      try {
        let url = `/api/studentsRM/paged?page=${page}&size=${pageSize}&sort=name,asc`
        if (search.trim()) {
          url += `&search=${encodeURIComponent(search.trim())}`
        }

        console.log(`🔗 URL da requisição: ${url}`)
        const res = await api.get(url)

        if (!res.ok) {
          throw new Error(`Erro HTTP: ${res.status}`)
        }

        const data: PageInfo = await res.json()
        console.log(`✅ Dados recebidos:`, {
          totalElements: data.totalElements,
          totalPages: data.totalPages,
          currentPage: data.number,
          contentLength: data.content?.length || 0,
          rawContent: data.content?.slice(0, 2), // Primeiros 2 para debug
        })

        // Normalizar dados dos alunos
        const normalizedContent = (data.content || []).map((s: any) => ({
          name: s.NAME || s.name || "",
          email: s.EMAIL || s.email || "",
          course: s.COURSE || s.course || "",
        }))

        console.log(`🔄 Atualizando estado com ${normalizedContent.length} alunos`)

        // 🔥 GARANTIR que apenas os novos dados sejam definidos
        setStudents(normalizedContent)
        setPageInfo(data)
        setCurrentPage(data.number !== undefined ? data.number : page)
      } catch (error) {
        console.error("❌ Erro ao buscar alunos:", error)
        toast({
          title: "Erro",
          description: "Falha ao carregar alunos. Verifique a conexão.",
          variant: "destructive",
        })
        // 🔥 LIMPAR dados em caso de erro
        setStudents([])
        setPageInfo(null)
      } finally {
        setLoading(false)
      }
    },
    [pageSize, toast],
  )

  // Buscar alunos quando abrir modal ou mudar busca
  useEffect(() => {
    if (isOpen) {
      console.log(`🔄 Efeito disparado - Busca: "${debouncedSearchTerm}"`)
      setCurrentPage(0) // Reset para primeira página
      // 🔥 LIMPAR seleções ao mudar busca
      setSelectedEmails([])
      fetchStudents(0, debouncedSearchTerm)
    }
  }, [isOpen, debouncedSearchTerm, fetchStudents])

  const resetAndClose = () => {
    console.log("🔄 Resetando e fechando modal")
    setFormData({ badgeId: "", achievementReason: "", sendEmail: true })
    setSelectedEmails([])
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setStudents([]) // 🔥 LIMPAR lista
    setCurrentPage(0)
    setPageInfo(null)
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedEmails.length === 0 || !formData.badgeId) {
      toast({ title: "Erro", description: "Selecione alunos e um badge.", variant: "destructive" })
      return
    }

    console.log(`📤 Enviando atribuições para ${selectedEmails.length} alunos`)

    try {
      const results = await Promise.all(
        selectedEmails.map(async (email) => {
          const response = await api.post("/api/assignments", {
            studentEmail: email,
            badgeId: Number.parseInt(formData.badgeId),
            achievementReason: formData.achievementReason,
            sendEmail: formData.sendEmail,
          })
          return { email, success: response.ok }
        }),
      )

      const successes = results.filter((r) => r.success).length
      const failures = results.filter((r) => !r.success).length

      console.log(`✅ Sucessos: ${successes}, ❌ Falhas: ${failures}`)

      if (successes > 0) {
        toast({
          title: "Sucesso",
          description: `${successes} badge(s) atribuído(s)!${failures > 0 ? ` (${failures} falhas)` : ""}`,
        })
        onAssignmentCreated()
        resetAndClose()
      } else {
        toast({
          title: "Erro",
          description: "Nenhuma atribuição foi realizada com sucesso.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Erro na atribuição:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão com o servidor.",
        variant: "destructive",
      })
    }
  }

  const goToPage = (page: number) => {
    if (page < 0 || (pageInfo && page >= pageInfo.totalPages) || loading) return

    console.log(`📄 Navegando para página ${page + 1}`)
    console.log(`🔄 Estado atual - Página: ${currentPage}, Alunos: ${students.length}`)

    // 🔥 LIMPAR seleções da página atual ao navegar
    setSelectedEmails([])

    // 🔥 FORÇAR limpeza da lista antes de buscar nova página
    setStudents([])

    fetchStudents(page, debouncedSearchTerm)
  }

  const handleSelectAll = () => {
    if (selectedEmails.length === students.length && students.length > 0) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(students.map((s) => s.email))
    }
  }

  const handleStudentSelect = (email: string) => {
    setSelectedEmails((prev) => {
      const newSelection = prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]

      console.log(`👤 Seleção atualizada: ${newSelection.length} alunos`)
      return newSelection
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Atribuição
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Atribuir Badge em Lote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-2">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Selecionar Alunos ({selectedEmails.length} selecionados)</Label>
              {pageInfo && (
                <div className="text-sm text-muted-foreground">{pageInfo.totalElements} alunos no total</div>
              )}
            </div>

            <Input
              placeholder="Buscar por nome, email ou curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="border rounded-lg">
              {/* Cabeçalho com seleção */}
              <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={students.length > 0 && selectedEmails.length === students.length}
                    onCheckedChange={handleSelectAll}
                    disabled={students.length === 0}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    Selecionar todos da página ({students.length})
                  </Label>
                </div>
                {loading && <Loader2 className="animate-spin h-4 w-4 text-gray-500" />}
              </div>

              {/* Lista de alunos */}
              <ScrollArea className="h-64">
                <div className="p-2">
                  {loading && (
                    <div className="text-center py-8 text-gray-500">
                      <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />
                      Carregando alunos...
                    </div>
                  )}

                  {!loading && students.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {debouncedSearchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno disponível"}
                    </div>
                  )}

                  {!loading &&
                    students.map((s, index) => (
                      <div
                        key={`${s.email}-${currentPage}-${index}`}
                        className="flex flex-col my-1 p-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={`${s.email}-${currentPage}`}
                            checked={selectedEmails.includes(s.email)}
                            onCheckedChange={() => handleStudentSelect(s.email)}
                          />
                          <Label htmlFor={`${s.email}-${currentPage}`} className="font-medium cursor-pointer flex-1">
                            {s.name}
                          </Label>
                        </div>
                        <div className="ml-7 text-sm text-gray-500 flex gap-1 items-center">
                          <span>{s.course}</span>
                          <span>•</span>
                          <span>{s.email}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>

            {/* Controles de Paginação */}
            {pageInfo && pageInfo.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage + 1} de {pageInfo.totalPages}
                  {students.length > 0 && ` (${students.length} alunos nesta página)`}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(0)}
                    disabled={currentPage === 0 || loading}
                  >
                    Primeira
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm bg-gray-100 rounded">{currentPage + 1}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage + 1 >= pageInfo.totalPages || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pageInfo.totalPages - 1)}
                    disabled={currentPage + 1 >= pageInfo.totalPages || loading}
                  >
                    Última
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="badge">Badge</Label>
              <Select value={formData.badgeId} onValueChange={(v) => setFormData((f) => ({ ...f, badgeId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um badge" />
                </SelectTrigger>
                <SelectContent>
                  {badges.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-2 space-x-2">
              <Switch
                id="sendEmail"
                checked={formData.sendEmail}
                onCheckedChange={(c) => setFormData((f) => ({ ...f, sendEmail: c }))}
              />
              <Label htmlFor="sendEmail">Enviar notificação por email</Label>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo da Conquista</Label>
            <Textarea
              id="reason"
              value={formData.achievementReason}
              onChange={(e) => setFormData((f) => ({ ...f, achievementReason: e.target.value }))}
              placeholder="Opcional: Descreva o motivo..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={selectedEmails.length === 0 || !formData.badgeId || loading}>
              <Award className="h-4 w-4 mr-2" />
              Atribuir para {selectedEmails.length} aluno(s)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- Componente Principal ---
export default function AssignmentsTab() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchInitialData = useCallback(async () => {
    setLoading(true)
    try {
      console.log("📊 Carregando dados iniciais...")
      const [assignmentsRes, badgesRes] = await Promise.all([
        api.get("/api/assignments"),
        api.get("/api/badges/active"),
      ])

      if (!assignmentsRes.ok || !badgesRes.ok) {
        throw new Error("Falha ao buscar dados")
      }

      const [assignmentsData, badgesData] = await Promise.all([assignmentsRes.json(), badgesRes.json()])

      console.log("✅ Dados carregados:", {
        assignments: assignmentsData?.length || 0,
        badges: badgesData?.length || 0,
      })

      setAssignments(assignmentsData || [])
      setBadges(badgesData || [])
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  const handleResendEmail = async (assignmentId: number) => {
    try {
      console.log(`📧 Reenviando email para assignment ${assignmentId}`)
      const res = await api.post(`/api/assignments/${assignmentId}/resend-email`)

      if (res.ok) {
        toast({ title: "Sucesso", description: "Email reenviado com sucesso!" })
        fetchInitialData()
      } else {
        toast({ title: "Erro", description: "Falha ao reenviar email.", variant: "destructive" })
      }
    } catch (error) {
      console.error("❌ Erro ao reenviar email:", error)
      toast({ title: "Erro", description: "Erro de conexão.", variant: "destructive" })
    }
  }

  const copyDownloadLink = (token: string) => {
    const link = `${API_BASE_URL}/api/badges/download/${token}`
    navigator.clipboard.writeText(link)
    console.log("📋 Link copiado:", link)
    toast({ title: "Sucesso", description: "Link de download copiado!" })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Atribuir Badges
          </CardTitle>
          <CardDescription>Atribua e gerencie os badges dos alunos.</CardDescription>
        </div>
        <NewAssignmentDialog badges={badges} onAssignmentCreated={fetchInitialData} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
            <p>Carregando atribuições...</p>
          </div>
        ) : assignments.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {assignments.length} atribuição{assignments.length !== 1 ? "ões" : ""} encontrada
              {assignments.length !== 1 ? "s" : ""}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Aluno</TableCell>
                  <TableCell>Badge</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell className="text-right">Ações</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">{a.studentName}</div>
                      <div className="text-sm text-muted-foreground">{a.studentEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{a.badgeName}</div>
                      {a.badgeDescription && (
                        <div className="text-sm text-muted-foreground max-w-xs truncate">{a.badgeDescription}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.emailSent ? "default" : "secondary"}>
                        {a.emailSent ? "Email Enviado" : "Pendente"}
                      </Badge>
                      {a.emailSent && a.emailSentAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(a.emailSentAt).toLocaleString("pt-BR")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleResendEmail(a.id)}>
                          <Mail className="h-4 w-4 mr-1" />
                          Reenviar
                        </Button>
                        {a.downloadToken && (
                          <Button variant="outline" size="sm" onClick={() => copyDownloadLink(a.downloadToken!)}>
                            <Copy className="h-4 w-4 mr-1" />
                            Link
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10">
            <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Nenhuma atribuição encontrada</h3>
            <p className="text-sm text-muted-foreground">Clique em "Nova Atribuição" para começar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

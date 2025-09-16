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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Send, Mail, Award, Copy, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// --- Tipos e API ---
interface Student { course: string; name: string; email: string }
interface BadgeType { id: number; name: string; description: string; category: string }
interface Assignment {
  id: number; studentName: string; studentEmail: string; badgeName: string; badgeDescription: string;
  achievementReason: string; emailSent?: boolean; emailSentAt?: string; downloadToken?: string;
  downloadCount?: number; tokenExpiresAt?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const api = {
  get: (path: string) => fetch(`${API_BASE_URL}${path}`),
  post: (path: string, body?: any) => fetch(`${API_BASE_URL}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }),
}

// --- Diálogo para Nova Atribuição ---
function NewAssignmentDialog({ badges, onAssignmentCreated }: {
  badges: BadgeType[],
  onAssignmentCreated: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ badgeId: "", achievementReason: "", sendEmail: true })
  const { toast } = useToast()

  const PAGE_SIZE = 20

  const fetchStudents = useCallback(async (reset = false) => {
    if (loading) return
    setLoading(true)
    try {
      const currentPage = reset ? 0 : page
      const res = await api.get(`/api/studentsRM/paged?page=${currentPage}&size=${PAGE_SIZE}&sort=name,asc&search=${encodeURIComponent(searchTerm)}`)
      if (!res.ok) throw new Error("Erro ao buscar alunos")
      const data = await res.json()
      const newStudents = data.content.map((s: any) => ({
        name: s.NAME ?? "", email: s.EMAIL ?? "", course: s.COURSE ?? ""
      }))
      setStudents(prev => reset ? newStudents : [...prev, ...newStudents])
      setHasMore(!data.last)
      setPage(prev => reset ? 1 : prev + 1)
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar alunos.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, loading, toast])

  // 🔎 Efeito para buscar alunos sempre que abrir o modal ou mudar o termo de busca
  useEffect(() => {
    if (isOpen) {
      fetchStudents(true)
    }
  }, [isOpen, searchTerm, fetchStudents])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight + 10 && hasMore && !loading) {
      fetchStudents()
    }
  }

  const resetAndClose = () => {
    setFormData({ badgeId: "", achievementReason: "", sendEmail: true })
    setSelectedEmails([]); setSearchTerm(""); setStudents([]); setPage(0); setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedEmails.length === 0 || !formData.badgeId) {
      toast({ title: "Erro", description: "Selecione alunos e um badge.", variant: "destructive" })
      return
    }
    const results = await Promise.all(selectedEmails.map(email => api.post("/api/assignments", {
      studentEmail: email, badgeId: Number.parseInt(formData.badgeId),
      achievementReason: formData.achievementReason, sendEmail: formData.sendEmail,
    })))
    const successes = results.filter(r => r.ok).length
    toast({ title: "Sucesso", description: `${successes} badge(s) atribuído(s)!` })
    if (successes > 0) { onAssignmentCreated(); resetAndClose() }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nova Atribuição</Button></DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader><DialogTitle>Atribuir Badge em Lote</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-2">
          <div className="grid gap-4">
            <Label className="text-base font-medium">Selecionar Alunos ({selectedEmails.length})</Label>
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-64 border rounded-lg p-2" onScroll={handleScroll}>
              {students.map(s => (
                <div key={s.email} className="flex flex-col my-1">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={s.email}
                      checked={selectedEmails.includes(s.email)}
                      onCheckedChange={() =>
                        setSelectedEmails(prev =>
                          prev.includes(s.email)
                            ? prev.filter(e => e !== s.email)
                            : [...prev, s.email]
                        )
                      }
                    />
                    <Label htmlFor={s.email} className="font-medium cursor-pointer">
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
              {loading && (
                <div className="flex justify-center py-2">
                  <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                </div>
              )}
              {!loading && students.length === 0 && <p className="text-center my-2">Nenhum aluno encontrado</p>}
            </ScrollArea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="badge">Badge</Label>
              <Select value={formData.badgeId} onValueChange={v => setFormData(f => ({ ...f, badgeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione um badge" /></SelectTrigger>
                <SelectContent>{badges.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-2 space-x-2">
              <Switch id="sendEmail" checked={formData.sendEmail} onCheckedChange={c => setFormData(f => ({ ...f, sendEmail: c }))} />
              <Label htmlFor="sendEmail">Enviar notificação por email</Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo da Conquista</Label>
            <Textarea id="reason" value={formData.achievementReason} onChange={e => setFormData(f => ({ ...f, achievementReason: e.target.value }))} placeholder="Opcional: Descreva o motivo..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>Cancelar</Button>
            <Button type="submit" disabled={selectedEmails.length === 0 || !formData.badgeId}>
              <Award className="h-4 w-4 mr-2" />Atribuir para {selectedEmails.length} aluno(s)
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
      const [assignmentsRes, badgesRes] = await Promise.all([api.get("/api/assignments"), api.get("/api/badges/active")])
      if (!assignmentsRes.ok || !badgesRes.ok) throw new Error("Falha ao buscar dados")
      const [assignmentsData, badgesData] = await Promise.all([assignmentsRes.json(), badgesRes.json()])
      setAssignments(assignmentsData || [])
      setBadges(badgesData || [])
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" })
    } finally { setLoading(false) }
  }, [toast])

  useEffect(() => { fetchInitialData() }, [fetchInitialData])

  const handleResendEmail = async (assignmentId: number) => {
    const res = await api.post(`/api/assignments/${assignmentId}/resend-email`)
    toast({ title: res.ok ? "Sucesso" : "Erro", description: `Email ${res.ok ? "reenviado" : "não enviado"}.` })
    if (res.ok) fetchInitialData()
  }

  const copyDownloadLink = (token: string) => {
    navigator.clipboard.writeText(`${API_BASE_URL}/api/badges/download/${token}`)
    toast({ title: "Sucesso", description: "Link de download copiado!" })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Send />Atribuir Badges</CardTitle>
          <CardDescription>Atribua e gerencie os badges dos alunos.</CardDescription>
        </div>
        <NewAssignmentDialog badges={badges} onAssignmentCreated={fetchInitialData} />
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-center py-8">Carregando atribuições...</p> : (
          assignments.length > 0 ? (
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
                {assignments.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">{a.studentName}</div>
                      <div className="text-sm text-muted-foreground">{a.studentEmail}</div>
                    </TableCell>
                    <TableCell><div className="font-medium">{a.badgeName}</div></TableCell>
                    <TableCell>
                      <Badge variant={a.emailSent ? "default" : "secondary"}>
                        {a.emailSent ? "Email Enviado" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleResendEmail(a.id)} className="mr-2">
                        <Mail className="h-4 w-4 mr-1" />Reenviar
                      </Button>
                      {a.downloadToken && (
                        <Button variant="outline" size="sm" onClick={() => copyDownloadLink(a.downloadToken!)}>
                          <Copy className="h-4 w-4 mr-1" />Link
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">Nenhuma atribuição encontrada</h3>
              <p className="text-sm text-muted-foreground">Clique em "Nova Atribuição" para começar.</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}

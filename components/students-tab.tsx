"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  course: string
  name: string
  email: string
}

interface PageInfo {
  content: Student[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
}

export default function StudentsTab() {
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: "", email: "", course: "" })
  const { toast } = useToast()

  useEffect(() => {
    fetchStudents()
  }, [currentPage, pageSize])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/studentsRM/paged?page=${currentPage}&size=${pageSize}&sort=name,asc`
      console.log("📡 Buscando alunos paginados:", url)

      const response = await fetch(url)
      if (!response.ok) throw new Error("Erro ao buscar alunos")

      const data: PageInfo = await response.json()
      console.log("📋 Dados brutos recebidos:", data)

      // Normaliza os campos
      const normalizedContent = data.content.map((student: any) => ({
        name: student.name ?? student.NAME ?? "",
        email: student.email ?? student.EMAIL ?? "",
        course: student.course ?? student.COURSE ?? "",
      }))

      setPageInfo({ ...data, content: normalizedContent })
      
    } catch (error) {
      console.error("❌ Erro ao buscar alunos:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão com o servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.course) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" })
      return
    }

    try {
      let response
      if (editingStudent && editingIndex !== null) {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/studentsRM`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index: editingIndex, student: formData }),
        })
      } else {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/studentsRM`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      }

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingStudent ? "Aluno atualizado com sucesso!" : "Aluno criado com sucesso!",
        })
        fetchStudents()
        resetForm()
        setIsDialogOpen(false)
      } else {
        const errorText = await response.text()
        toast({ title: "Erro", description: errorText || "Erro ao salvar aluno", variant: "destructive" })
      }
    } catch (error) {
      console.error("❌ Erro ao salvar aluno:", error)
      toast({ title: "Erro", description: "Erro de conexão com o servidor", variant: "destructive" })
    }
  }

  const handleEdit = (student: Student, globalIndex: number) => {
    setEditingStudent(student)
    setEditingIndex(globalIndex)
    setFormData({ name: student.name, email: student.email, course: student.course })
    setIsDialogOpen(true)
  }

  const handleDelete = async (globalIndex: number) => {
    const student = pageInfo?.content[globalIndex % pageSize]
    if (!student || !confirm(`Tem certeza que deseja excluir o aluno "${student.name}"?`)) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/studentsRM`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: globalIndex }),
      })

      if (response.ok) {
        toast({ title: "Sucesso", description: "Aluno excluído com sucesso!" })
        fetchStudents()
      } else {
        const errorText = await response.text()
        toast({ title: "Erro", description: errorText || "Erro ao excluir aluno", variant: "destructive" })
      }
    } catch (error) {
      console.error("❌ Erro ao excluir aluno:", error)
      toast({ title: "Erro", description: "Erro de conexão com o servidor", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", course: "" })
    setEditingStudent(null)
    setEditingIndex(null)
  }

  const handlePageChange = (newPage: number) => {
    if (pageInfo && newPage >= 0 && newPage < pageInfo.totalPages) setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize))
    setCurrentPage(0)
  }

  console.log("🔍 Termo de busca:", pageInfo)

  const filteredStudents =
    pageInfo?.content.filter(
      (student) =>
        (student?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student?.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student?.course ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

  const getPaginationInfo = () => {
    if (!pageInfo) return ""
    const start = currentPage * pageSize + 1
    const end = Math.min((currentPage + 1) * pageSize, pageInfo.totalElements)
    return `${start}-${end} de ${pageInfo.totalElements} alunos`
  }

  const getPageNumbers = () => {
    if (!pageInfo) return []
    const totalPages = pageInfo.totalPages
    const current = currentPage
    const pages: number[] = []

    if (totalPages > 0) pages.push(0)
    for (let i = Math.max(1, current - 1); i <= Math.min(totalPages - 2, current + 1); i++) {
      if (!pages.includes(i)) pages.push(i)
    }
    if (totalPages > 1 && !pages.includes(totalPages - 1)) pages.push(totalPages - 1)

    return pages
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Gerenciar Alunos
            </CardTitle>
            <CardDescription>
              Cadastre e gerencie os alunos do sistema
              {pageInfo && <span className="ml-2 text-sm text-muted-foreground">({pageInfo.totalElements} alunos cadastrados)</span>}
            </CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" /> Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStudent ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
                <DialogDescription>
                  {editingStudent ? "Edite as informações do aluno" : "Preencha os dados do novo aluno"}
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
                      placeholder="Digite o nome completo do aluno"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Digite o email do aluno"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="course">Curso *</Label>
                    <Input
                      id="course"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      placeholder="Digite o curso do aluno"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingStudent ? "Atualizar" : "Criar"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="pageSize" className="text-sm">Itens por página:</Label>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, localIndex) => {
                  const globalIndex = currentPage * pageSize + localIndex
                  return (
                    <TableRow key={`${student.email}-${globalIndex}`}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.course}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(student, globalIndex)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(globalIndex)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {pageInfo && pageInfo.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">{getPaginationInfo()}</div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(0)} disabled={pageInfo.first}>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={pageInfo.first}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {getPageNumbers().map((pageNum, index, array) => (
                    <React.Fragment key={pageNum}>
                      {index > 0 && array[index - 1] !== pageNum - 1 && <span className="px-2 text-muted-foreground">...</span>}
                      <Button variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)}>
                        {pageNum + 1}
                      </Button>
                    </React.Fragment>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={pageInfo.last}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(pageInfo.totalPages - 1)} disabled={pageInfo.last}>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && filteredStudents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "Nenhum aluno encontrado para a busca" : "Nenhum aluno cadastrado"}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

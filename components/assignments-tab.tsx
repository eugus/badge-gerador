"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Send, Mail, Award, User, Download, Copy, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: number
  name: string
  email: string
}

interface BadgeType {
  id: number
  name: string
  description: string
  category: string
  isActive: boolean
}

interface Assignment {
  id: number
  studentId: number
  badgeId: number
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

export default function AssignmentsTab() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    studentId: "",
    badgeId: "",
    achievementReason: "",
    sendEmail: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [assignmentsRes, studentsRes, badgesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/students`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/badges/active`),
      ])

      if (assignmentsRes.ok && studentsRes.ok && badgesRes.ok) {
        const [assignmentsData, studentsData, badgesData] = await Promise.all([
          assignmentsRes.json(),
          studentsRes.json(),
          badgesRes.json(),
        ])

        setAssignments(assignmentsData)
        setStudents(studentsData)
        setBadges(badgesData)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar dados",
          variant: "destructive",
        })
      }
    } catch (error) {
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

    if (!formData.studentId || !formData.badgeId) {
      toast({
        title: "Erro",
        description: "Selecione um aluno e um badge",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: Number.parseInt(formData.studentId),
          badgeId: Number.parseInt(formData.badgeId),
          achievementReason: formData.achievementReason,
          sendEmail: formData.sendEmail,
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Badge atribuído com sucesso!",
        })
        fetchData()
        resetForm()
        setIsDialogOpen(false)
      } else {
        const errorText = await response.text()
        toast({
          title: "Erro",
          description: errorText || "Erro ao atribuir badge",
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
  }

  const handleResendEmail = async (assignmentId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments/${assignmentId}/resend-email`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Email reenviado com sucesso!",
        })
        fetchData()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao reenviar email",
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
  }

  const copyDownloadLink = (token: string) => {
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/badges/download/${token}`
    navigator.clipboard.writeText(downloadUrl)
    toast({
      title: "Sucesso",
      description: "Link de download copiado para a área de transferência!",
    })
  }

  const resetForm = () => {
    setFormData({
      studentId: "",
      badgeId: "",
      achievementReason: "",
      sendEmail: true,
    })
  }

  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Atribuir Badges
            </CardTitle>
            <CardDescription>Atribua badges aos alunos e gerencie as atribuições</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Atribuição
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atribuir Badge</DialogTitle>
                <DialogDescription>Selecione um aluno e um badge para fazer a atribuição</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="student">Aluno</Label>
                    <Select
                      value={formData.studentId}
                      onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name} ({student.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="badge">Badge</Label>
                    <Select
                      value={formData.badgeId}
                      onValueChange={(value) => setFormData({ ...formData, badgeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um badge" />
                      </SelectTrigger>
                      <SelectContent>
                        {badges.map((badge) => (
                          <SelectItem key={badge.id} value={badge.id.toString()}>
                            {badge.name} {badge.category && `(${badge.category})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reason">Motivo da Conquista</Label>
                    <Textarea
                      id="reason"
                      value={formData.achievementReason}
                      onChange={(e) => setFormData({ ...formData, achievementReason: e.target.value })}
                      placeholder="Descreva o motivo pelo qual o aluno conquistou este badge..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sendEmail"
                      checked={formData.sendEmail}
                      onCheckedChange={(checked) => setFormData({ ...formData, sendEmail: checked })}
                    />
                    <Label htmlFor="sendEmail">Enviar email de notificação</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Atribuir Badge</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{assignment.studentName}</div>
                        <div className="text-sm text-gray-500">{assignment.studentEmail}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <div>
                        <div className="font-medium">{assignment.badgeName}</div>
                        <div className="text-sm text-gray-500">{assignment.badgeDescription}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={assignment.achievementReason}>
                      {assignment.achievementReason || "Sem motivo especificado"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={assignment.emailSent ? "default" : "secondary"}>
                      {assignment.emailSent ? "Enviado" : "Não enviado"}
                    </Badge>
                    {assignment.emailSent && assignment.emailSentAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(assignment.emailSentAt).toLocaleString("pt-BR")}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {assignment.downloadCount || 0}
                      </Badge>
                      {assignment.tokenExpiresAt && (
                        <Badge
                          variant={isTokenExpired(assignment.tokenExpiresAt) ? "destructive" : "secondary"}
                          className="flex items-center gap-1"
                        >
                          <Clock className="h-3 w-3" />
                          {isTokenExpired(assignment.tokenExpiresAt) ? "Expirado" : "Válido"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleResendEmail(assignment.id)}>
                        <Mail className="h-4 w-4 mr-1" />
                        {assignment.emailSent ? "Reenviar" : "Enviar"}
                      </Button>
                      {assignment.downloadToken && (
                        <Button variant="outline" size="sm" onClick={() => copyDownloadLink(assignment.downloadToken!)}>
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
        )}

        {!loading && assignments.length === 0 && (
          <div className="text-center py-8 text-gray-500">Nenhuma atribuição encontrada</div>
        )}
      </CardContent>
    </Card>
  )
}
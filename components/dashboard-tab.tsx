"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Award, Send, TrendingUp } from "lucide-react"

interface DashboardStats {
  totalStudents: number
  totalBadges: number
  totalAssignments: number
  recentAssignments: any[]
}

export default function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalBadges: 0,
    totalAssignments: 0,
    recentAssignments: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Buscar dados das APIs
      const [studentsRes, badgesRes, assignmentsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/students`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/badges`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments`),
      ])

      const students = await studentsRes.json()
      const badges = await badgesRes.json()
      const assignments = await assignmentsRes.json()

      setStats({
        totalStudents: students.length,
        totalBadges: badges.length,
        totalAssignments: assignments.length,
        recentAssignments: assignments.slice(-5).reverse(),
      })
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Alunos cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Badges</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBadges}</div>
            <p className="text-xs text-muted-foreground">Badges disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Atribuídos</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Total de atribuições</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Engajamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalStudents > 0 ? Math.round((stats.totalAssignments / stats.totalStudents) * 100) / 100 : 0}
            </div>
            <p className="text-xs text-muted-foreground">Badges por aluno</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Atribuições Recentes</CardTitle>
          <CardDescription>Últimas 5 atribuições de badges realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentAssignments.length > 0 ? (
            <div className="space-y-4">
              {stats.recentAssignments.map((assignment, index) => (
                <div
                  key={assignment.id || index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Award className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{assignment.studentName}</p>
                      <p className="text-sm text-gray-600">{assignment.badgeName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{assignment.achievementReason || "Sem motivo especificado"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Nenhuma atribuição encontrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

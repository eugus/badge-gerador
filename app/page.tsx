"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Award, Send, BarChart3 } from "lucide-react"
import StudentsTab from "@/components/students-tab"
import BadgesTab from "@/components/badge-tab"
import AssignmentsTab from "@/components/assignments-tab"
import DashboardTab from "@/components/dashboard-tab"

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sistema de Badges</h1>
          <p className="text-gray-600">Gerencie badges e reconheça conquistas dos seus alunos</p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Atribuições
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="students">
            <StudentsTab />
          </TabsContent>

          <TabsContent value="badges">
            <BadgesTab />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

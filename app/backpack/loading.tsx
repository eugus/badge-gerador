import { Loader2 } from "lucide-react"

export default function BackpackLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Carregando seus badges...</p>
      </div>
    </div>
  )
}

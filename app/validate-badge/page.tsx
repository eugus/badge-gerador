"use client"

import { useState } from "react"

export default function ValidateBadgePage() {
  const [badgeId, setBadgeId] = useState("")
  const [recipient, setRecipient] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleValidate = async () => {
    if (!badgeId || !recipient) return alert("Preencha o ID do badge e o destinatário")

    setLoading(true)
    try {
      // 1️⃣ Buscar JSON do badge
      const resBadge = await fetch(`http://localhost:8080/public/assertions/${badgeId}`)
      if (!resBadge.ok) throw new Error("Badge não encontrado")
      const badgeJson = await resBadge.json()

      // 2️⃣ Enviar para validação interna
      const resValidate = await fetch("http://localhost:8080/api/badges/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeJson: JSON.stringify(badgeJson), recipient })
      })
      const data = await resValidate.json()
      setResult(data)
    } catch (err: any) {
      console.error(err)
      setResult({ valid: false, errors: [err.message] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Validador de Badges</h1>

      <input
        type="text"
        placeholder="ID do badge"
        value={badgeId}
        onChange={(e) => setBadgeId(e.target.value)}
        className="w-full max-w-lg p-2 border rounded mb-2"
      />

      <input
        type="text"
        placeholder="Email do destinatário"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className="w-full max-w-lg p-2 border rounded mb-4"
      />

      <button
        onClick={handleValidate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? "Validando..." : "Validar Badge"}
      </button>

      {result && (
        <div className={`w-full max-w-lg p-4 border rounded bg-white shadow ${result.valid ? "text-green-600" : "text-red-600"}`}>
          {result.valid ? (
            <>
              ✅ Badge válido!
              <p><strong>Nome:</strong> {result.badgeName}</p>
              <p><strong>Issuer:</strong> {result.issuer}</p>
            </>
          ) : (
            <>
              ❌ Badge inválido
              <ul className="list-disc pl-5">
                {result.errors?.map((err: string, idx: number) => <li key={idx}>{err}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

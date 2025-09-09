"use client";

import { use, useEffect, useState } from "react";

type PageProps = {
  params: Promise<{ assignmentId: string }>
};

export default function OpenBadgePage({ params }: PageProps) {
  const { assignmentId } = use(params); // ✅ destrutura a Promise

  const [badge, setBadge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBadge() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/public/assertions/${assignmentId}/open-badge`
        );
        if (!res.ok) {
          throw new Error("Erro ao buscar badge");
        }
        const data = await res.json();
        setBadge(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchBadge();
  }, [assignmentId]);

  if (loading) return <p>Carregando badge...</p>;

  if (!badge) return <p>Badge não encontrado</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Open Badge</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(badge, null, 2)}
      </pre>
    </div>
  );
}

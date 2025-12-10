"use client"

import { useEffect, useState } from "react"
import { PropertyCard } from "./property-card"
// تأكدنا الآن أن البيانات المرسلة تتطابق تماماً مع الـ Property Interface
import { Loader2 } from "lucide-react"

export function PropertyGrid() {
  const [lands, setLands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchLands() {
      try {
        const res = await fetch("/api/lands")
        if (!res.ok) throw new Error("Failed to fetch lands")
        
        const data = await res.json()
        setLands(Array.isArray(data) ? data : data.data || [])
      } catch (err) {
        console.error(err)
        setError("Unable to load properties at the moment.")
      } finally {
        setLoading(false)
      }
    }

    fetchLands()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>
  }

  if (lands.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground text-lg">No properties found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pb-10">
      {lands.map((land: any) => (
        <PropertyCard 
          key={land.id || land._id} 
          property={{
            id: land.id,
            title: land.name || land.title || "Untitled Land", 
            location: land.location || "Unknown Location",
            price: land.price || 0,
            image: land.image_url || "/placeholder.svg",
            sqft: land.area || land.sqft || 0,
            status: land.status || "New",
            // ✅ الحل هنا: إضافة القيم المفقودة كأصفار
            beds: land.beds || 0,
            baths: land.baths || 0,
          }} 
        />
      ))}
    </div>
  )
}
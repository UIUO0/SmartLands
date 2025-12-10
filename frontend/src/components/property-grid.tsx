"use client"

import { useEffect, useState } from "react"
import { PropertyCard } from "./property-card"
import { Loader2 } from "lucide-react"

export function PropertyGrid() {
  const [lands, setLands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchLands() {
      try {
        console.log("Fetching lands..."); // للتجربة: هل بدأ الجلب؟
        const res = await fetch("/api/lands")
        
        if (!res.ok) {
            console.error("API Error:", res.status, res.statusText);
            throw new Error("Failed to fetch lands")
        }
        
        const data = await res.json()
        console.log("Data received:", data); // للتجربة: ماذا وصلنا من الباك إند؟

        // التعامل مع صيغ مختلفة من الباك إند
        const landsArray = Array.isArray(data) ? data : (data.data || []);
        setLands(landsArray)
        
      } catch (err) {
        console.error("Fetch error:", err)
        setError("Unable to load properties. Check console for details.")
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
    return <div className="text-center text-red-500 py-10 bg-red-50 rounded-xl">{error}</div>
  }

  if (lands.length === 0) {
    return (
      <div className="text-center py-20 bg-secondary/20 rounded-2xl border border-dashed border-border">
        <p className="text-muted-foreground text-lg font-medium">No properties found inside the database.</p>
        <p className="text-sm text-gray-500 mt-2">Try adding a new land from the "My Lands" page.</p>
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
            status: land.status || "For Sale",
            beds: 0, // تم التصفير
            baths: 0, // تم التصفير
          }} 
        />
      ))}
    </div>
  )
}
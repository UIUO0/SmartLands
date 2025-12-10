"use client"

import { Heart, MapPin, Square, ArrowRight } from "lucide-react"
import { useState } from "react"
import type { Property } from "@/types/property"

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="group bg-[#D2DCB6] rounded-3xl overflow-hidden border border-[#A1BC98] shadow-sm hover:shadow-xl transition-all h-full flex flex-col">
      
      {/* 🛑 الحل للصور: ارتفاع ثابت (h-52) وتغطية كاملة (object-cover) */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-200">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* البادج */}
        <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase">
          {property.status}
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-lg font-bold text-black mb-1 line-clamp-1">{property.title}</h3>
          
          <div className="flex items-center gap-1.5 text-[#3a4430] text-sm">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{property.location}</span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-1">
             <p className="text-xl font-bold text-black">
                {formatPrice(property.price)}
             </p>
             <div className="flex items-center gap-1 bg-[#A1BC98]/40 px-2 py-1 rounded-md text-xs font-semibold">
                <Square className="h-3 w-3" />
                <span>{property.sqft} m²</span>
             </div>
        </div>

        <button className="w-full mt-auto bg-black text-white text-sm font-bold py-3 rounded-xl hover:bg-[#333] transition-colors flex items-center justify-center gap-2 group-hover:gap-3">
          View Details <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
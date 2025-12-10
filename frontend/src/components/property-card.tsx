"use client"

import { MapPin, Square, ArrowRight } from "lucide-react"
import Link from "next/link" // 👈 استيراد مهم
import type { Property } from "@/types/property"

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="group bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all h-full flex flex-col">
      
      {/* الصورة */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-200">
        <img
          src={property.image || "/placeholder.svg"}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          {property.status || "For Sale"}
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1">{property.title}</h3>
          <div className="flex items-center gap-1.5 text-black/60 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{property.location}</span>
          </div>
        </div>

        <div className="flex items-end justify-between mt-auto pt-4 border-t border-black/10">
             <p className="text-xl font-bold text-foreground">
                {formatPrice(property.price)}
             </p>
             <div className="flex items-center gap-1 bg-primary/30 px-2 py-1 rounded-md text-xs font-semibold text-black">
                <Square className="h-3 w-3" />
                <span>{property.sqft} m²</span>
             </div>
        </div>

        {/* 👇 هنا الإصلاح: تحويل الزر لرابط يأخذ ID الأرض */}
        <Link 
          href={`/lands/${property.id}`} 
          className="w-full mt-3 bg-black text-white text-sm font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group-hover:gap-3"
        >
          View Details <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
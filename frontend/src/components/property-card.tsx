"use client"

import { Heart, MapPin, Square, ArrowRight } from "lucide-react"
import { useState } from "react"
import type { Property } from "@/types/property"

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)

  // تنسيق السعر
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      {/* قسم الصورة */}
      <div className="relative h-56 sm:h-64 overflow-hidden bg-secondary/50">
        <img
          src={property.image || "/placeholder.svg"}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
        />
        
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorited(!isFavorited);
            }}
            className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </button>
        </div>

        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-primary/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wider">
          {property.status || "For Sale"}
        </div>
      </div>

      {/* تفاصيل العقار */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>

          <div className="flex items-center gap-1.5 text-gray-500 mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">{property.location}</p>
          </div>

          <p className="text-2xl font-bold text-primary mb-5">
            {formatPrice(property.price)}
          </p>

          {/* المميزات: تم إبقاء المساحة فقط وحذف الغرف والحمامات */}
          <div className="grid grid-cols-1 gap-2 py-4 border-t border-dashed border-gray-200">
            <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-secondary/30">
              <Square className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">{property.sqft} m²</span>
            </div>
          </div>
        </div>

        <button className="w-full mt-4 bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-primary hover:text-black transition-colors flex items-center justify-center gap-2 group-hover:gap-3">
          View Details <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
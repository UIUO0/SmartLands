"use client"

import { Loader2, MapPin, Ruler, Square, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { getAbsoluteImageUrl } from "@/lib/utils"
import type { Property } from "@/types/property"
import { useEffect, useState } from "react"

interface PropertyCardProps {
  property: Property
}

export function PropertyCard({ property }: PropertyCardProps) {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const user = await res.json();
          setCurrentUserId(user.user_id);
        }
      } catch (e) {
        console.error("Failed to get current user:", e);
      } finally {
        setLoadingUser(false);
      }
    }
    fetchCurrentUser();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleViewDetails = async () => {
    // Fetch the land details to check ownership
    try {
      const res = await fetch(`/api/lands/${property.id}`);
      if (res.ok) {
        const land = await res.json();
        const ownerId = land.owner_id || land.owner_user_id || land.user_id;

        // If current user owns this land, go to edit page
        if (currentUserId && ownerId === currentUserId) {
          router.push(`/mylands/edit/${property.id}`);
        } else {
          // Otherwise, go to public details page
          router.push(`/lands/${property.id}`);
        }
      } else {
        // Fallback to public page if fetch fails
        router.push(`/lands/${property.id}`);
      }
    } catch (e) {
      console.error("Failed to check ownership:", e);
      router.push(`/lands/${property.id}`);
    }
  };

  return (
    <div className="group bg-card rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all h-full flex flex-col">

      {/* الصورة */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAbsoluteImageUrl(property.image)}
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

        {/* Fixed: Check ownership and redirect accordingly */}
        <button
          onClick={handleViewDetails}
          disabled={loadingUser}
          className="w-full mt-3 bg-black text-white text-sm font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group-hover:gap-3 disabled:opacity-50"
        >
          {loadingUser ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              View Details <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

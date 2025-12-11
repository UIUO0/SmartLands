"use client";

import { getAbsoluteImageUrl } from "@/lib/utils";
import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";

interface LandImageProps {
    land: any;
    className?: string;
    showStatus?: boolean;
}

export function LandImage({ land, className = "w-full h-full object-cover", showStatus = false }: LandImageProps) {
    // Robust image resolution logic
    const rawImage =
        land.image ||
        land.image_url ||
        land.cover_image_url ||
        land.picture_url ||
        (land.cover_image && land.cover_image.file_url) ||
        (land.images && land.images.length > 0 ? land.images[0].url : null);

    const imageSrc = getAbsoluteImageUrl(rawImage);
    const [hasError, setHasError] = useState(false);

    if (!imageSrc || imageSrc === "/placeholder.svg" || hasError) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
                <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                <span className="text-xs">لا توجد صورة</span>
                {showStatus && (
                    <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-lg shadow-sm z-10 ${land.status === 'available' ? 'bg-white text-green-700' : 'bg-gray-800 text-white'}`}>
                        {land.status === 'available' ? 'متاح' : land.status}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={imageSrc}
                alt={land.title || "Land Image"}
                className={className}
                onError={() => setHasError(true)}
            />
            {showStatus && (
                <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-lg shadow-sm z-10 ${land.status === 'available' ? 'bg-white text-green-700' : 'bg-gray-800 text-white'}`}>
                    {land.status === 'available' ? 'متاح' : land.status}
                </span>
            )}
        </div>
    );
}

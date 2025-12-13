"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { SAUDI_CITIES } from "@/lib/constants";

interface CitySelectorProps {
    value: string;
    onChange: (city: string) => void;
    className?: string;
    placeholder?: string;
}

export function CitySelector({ value, onChange, className = "", placeholder = "Select City" }: CitySelectorProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter cities based on search query
    const filteredCities = useMemo(() => {
        if (!query) return SAUDI_CITIES;
        return SAUDI_CITIES.filter((city) =>
            city.toLowerCase().includes(query.toLowerCase())
        );
    }, [query]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (city: string) => {
        onChange(city);
        setOpen(false);
        setQuery(""); // Reset search on select
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full p-3 rounded-xl border border-[#A1BC98] bg-white text-gray-700 cursor-pointer hover:border-[#8da583]"
            >
                <span className={!value ? "text-gray-400" : "font-medium"}>
                    {value || placeholder}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-[#A1BC98]/50 max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 rounded-lg outline-none focus:ring-1 focus:ring-[#A1BC98] transition-all"
                                placeholder="Search city..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredCities.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">No city found.</div>
                        ) : (
                            filteredCities.map((city) => (
                                <div
                                    key={city}
                                    onClick={() => handleSelect(city)}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm transition-colors ${value === city ? "bg-[#F1F3E0] text-[#556b4d] font-bold" : "hover:bg-gray-50"
                                        }`}
                                >
                                    {city}
                                    {value === city && <Check className="h-4 w-4" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

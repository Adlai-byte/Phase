"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Users, Home, FileText } from "lucide-react";
import { globalSearch, type SearchResult } from "@/app/actions/search";
import { useRouter } from "next/navigation";

const typeIcons = {
  tenant: { icon: Users, color: "text-primary" },
  room: { icon: Home, color: "text-tertiary" },
  invoice: { icon: FileText, color: "text-secondary" },
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const data = await globalSearch(query);
      setResults(data);
      setOpen(true);
      setLoading(false);
    }, 300);
  }, [query]);

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(result.link);
  }

  return (
    <div ref={ref} className="relative hidden md:block">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search tenants, rooms..."
        className="w-56 lg:w-72 pl-10 pr-4 py-2 bg-surface-container rounded-xl text-sm text-on-surface placeholder:text-outline font-[family-name:var(--font-body)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:w-80 transition-all"
      />

      {open && (
        <div className="absolute top-11 left-0 right-0 bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_-8px_rgba(24,28,30,0.12)] overflow-hidden z-50 animate-slide-up">
          {loading && (
            <div className="px-4 py-3 text-xs text-on-surface-variant">Searching...</div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="px-4 py-6 text-center text-xs text-on-surface-variant">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.map((r) => {
            const meta = typeIcons[r.type];
            const Icon = meta.icon;
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-container-low transition-colors"
              >
                <Icon size={16} className={meta.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-on-surface truncate">{r.title}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{r.subtitle}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-outline bg-surface-container px-2 py-0.5 rounded-full">
                  {r.type}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

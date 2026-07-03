"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function SurahList({ onSelect }) {
  const [surahs, setSurahs] = useState([]);

  // Controls the mobile drawer (left side-sheet) visibility
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    axios
      .get("https://api.alquran.cloud/v1/surah")
      .then((res) => setSurahs(res.data.data));
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleSelect = (number) => {
    onSelect(number);
    setDrawerOpen(false); // auto-close drawer on mobile after picking a surah
  };

  // Shared list markup, reused inline (desktop) and inside the drawer (mobile)
  const SurahItems = () => (
    <>
      {surahs.map((s) => (
        <div
          key={s.number}
          onClick={() => handleSelect(s.number)}
          className="p-3 mb-2 rounded-lg cursor-pointer bg-white shadow hover:bg-green-100 transition"
        >
          <p className="font-bold">
            {s.number}. {s.englishName}
          </p>
          <p className="text-sm text-gray-500">{s.name}</p>
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* Mobile top bar: toggle button that opens/closes the drawer */}
      <div className="sm:hidden bg-gray-50/95 backdrop-blur border-b px-3 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">📖 Surahs</span>
        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          aria-expanded={drawerOpen}
          className="flex items-center gap-2 text-sm border rounded-lg px-3 py-1.5 bg-white shadow-sm active:scale-95 transition"
        >
          {drawerOpen ? "Close" : "Browse"}
          <span
            aria-hidden="true"
            className={`inline-block transition-transform duration-200 ${
              drawerOpen ? "rotate-90" : ""
            }`}
          >
            ☰
          </span>
        </button>
      </div>

      {/* Desktop / tablet: plain sidebar list, always visible */}
      <div className="hidden sm:block p-4">
        <h2 className="text-xl font-bold mb-2">Surahs</h2>
        <SurahItems />
      </div>

      {/* Mobile drawer (left side-sheet) for surah selection */}
      {drawerOpen && (
        <div className="sm:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute top-0 left-0 bottom-0 w-[80%] max-w-xs bg-gray-50 shadow-2xl p-3 overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between mb-3 bg-gray-50 pb-2">
              <h2 className="text-lg font-bold">📖 Surahs</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-gray-500 text-lg leading-none px-2"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <SurahItems />
          </div>
        </div>
      )}

      {/* Drawer slide-in animation */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.25s ease-out;
        }
      `}</style>
    </>
  );
}

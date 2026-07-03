"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function AyahList({ surahNumber }) {
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [reciters, setReciters] = useState([]);
  const [reciter, setReciter] = useState(null);
  const [recitersLoading, setRecitersLoading] = useState(true);

  // Controls the mobile drawer (bottom sheet) visibility
  const [drawerOpen, setDrawerOpen] = useState(false);

  const audioRefs = useRef([]);
  const [playingIndex, setPlayingIndex] = useState(null);

  // Fetch the real, valid list of Arabic audio reciters directly from the
  // API instead of hardcoding identifiers (which can be wrong/outdated).
  useEffect(() => {
    axios
      .get("https://api.alquran.cloud/v1/edition?format=audio&language=ar")
      .then((res) => {
        const list = res.data.data || [];
        setReciters(list);

        // Prefer Alafasy as the default if present, otherwise first one.
        const defaultReciter =
          list.find((r) => r.identifier === "ar.alafasy") || list[0];
        setReciter(defaultReciter);
      })
      .catch((err) => console.log(err))
      .finally(() => setRecitersLoading(false));
  }, []);

  // Fetch the surah text (Arabic, English, Urdu) + this reciter's audio
  // edition together. Because the reciter's edition identifier is passed
  // to the API, the API itself returns the correct, working audio URL for
  // every ayah (in the "audio" / "audioSecondary" fields) — no need to
  // manually guess a CDN bitrate/path.
  useEffect(() => {
    if (!surahNumber || !reciter) return;

    setLoading(true);

    axios
      .get(
        `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.asad,ur.jalandhry,${reciter.identifier}`
      )
      .then((res) => {
        setAyahs(res.data.data);
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [surahNumber, reciter]);

  // Stop all audio when reciter changes
  useEffect(() => {
    audioRefs.current.forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.load();
      }
    });

    setPlayingIndex(null);
  }, [reciter]);

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

  // If the primary audio URL fails, try the alternate URLs the API
  // provided (audioSecondary) before giving up.
  const handleAudioError = (e, audioSecondary = []) => {
    const audio = e.currentTarget;
    const triedCount = Number(audio.dataset.fallbackIndex || 0);

    if (triedCount < audioSecondary.length) {
      audio.dataset.fallbackIndex = triedCount + 1;
      audio.src = audioSecondary[triedCount];
      audio.load();
    } else {
      console.warn(`No working audio found for ${reciter?.identifier}`);
    }
  };

  if (recitersLoading || loading) {
    return <p className="text-center mt-10">Loading Quran... 🌙</p>;
  }

  if (!ayahs.length || !reciter) return null;

  const arabic = ayahs[0];
  const english = ayahs[1];
  const urdu = ayahs[2];
  const audioEdition = ayahs[3];

  // Shared reciter picker markup, reused inline (desktop) and inside the drawer (mobile)
  const ReciterPicker = () => (
    <select
      className="w-full border rounded-lg p-2 text-sm sm:text-base"
      value={reciter.identifier}
      onChange={(e) => {
        const selected = reciters.find(
          (r) => r.identifier === e.target.value
        );
        setReciter(selected);
        setDrawerOpen(false);
      }}
    >
      {reciters.map((r) => (
        <option key={r.identifier} value={r.identifier}>
          {r.englishName}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      {/* Mobile top bar: opens the drawer instead of showing the select inline */}
      <div className="sm:hidden sticky top-0 z-30 bg-gray-50/95 backdrop-blur border-b -mx-3 px-3 py-2 flex items-center justify-between">
        <span className="font-semibold text-sm">🎧 Reciter</span>
        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          aria-expanded={drawerOpen}
          className="flex items-center gap-2 text-sm border rounded-lg px-3 py-1.5 bg-white shadow-sm active:scale-95 transition"
        >
          {reciter.englishName}
          <span
            aria-hidden="true"
            className={`inline-block transition-transform duration-200 ${
              drawerOpen ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </button>
      </div>

      {/* Desktop / tablet: reciter selector shown inline as before */}
      <div className="hidden sm:block bg-white shadow rounded-lg p-4 border">
        <label className="font-semibold block mb-2">🎧 Select Reciter</label>
        <ReciterPicker />
      </div>

      {/* Mobile drawer (bottom sheet) for reciter selection */}
      {drawerOpen && (
        <div className="sm:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-4 pb-6 animate-slide-up">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base">🎧 Select Reciter</h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-gray-500 text-lg leading-none px-2"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <ReciterPicker />
          </div>
        </div>
      )}

      {/* Ayahs */}
      {arabic.ayahs.map((a, i) => {
        const audioAyah = audioEdition?.ayahs?.[i];

        return (
          <div
            key={a.number}
            className={`p-3 sm:p-4 rounded-lg border shadow transition ${
              playingIndex === i ? "border-green-600 bg-green-50" : "bg-white"
            }`}
          >
            {/* Arabic */}
            <p className="text-2xl sm:text-3xl text-right leading-loose font-arabic">
              {a.text}
            </p>

            {/* Urdu */}
            <p className="mt-3 text-right text-green-700 text-sm sm:text-base">
              {urdu.ayahs[i].text}
            </p>

            {/* English */}
            <p className="mt-2 text-gray-700 text-sm sm:text-base">
              {english.ayahs[i].text}
            </p>

            {/* Audio */}
            {audioAyah?.audio && (
              <audio
                key={`${reciter.identifier}-${a.number}`}
                ref={(el) => (audioRefs.current[i] = el)}
                controls
                className="mt-4 w-full"
                onError={(e) =>
                  handleAudioError(e, audioAyah.audioSecondary || [])
                }
                onPlay={() => {
                  setPlayingIndex(i);

                  audioRefs.current.forEach((audio, index) => {
                    if (audio && index !== i) {
                      audio.pause();
                      audio.currentTime = 0;
                    }
                  });
                }}
                onEnded={() => {
                  const next = audioRefs.current[i + 1];

                  if (next) {
                    next.play();
                  } else {
                    setPlayingIndex(null);
                  }
                }}
              >
                <source src={audioAyah.audio} type="audio/mp3" />
                Your browser does not support audio.
              </audio>
            )}
          </div>
        );
      })}

      {/* Drawer slide-up animation */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

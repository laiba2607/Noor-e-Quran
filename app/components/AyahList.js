"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function AyahList({ surahNumber }) {
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [reciters, setReciters] = useState([]);
  const [reciter, setReciter] = useState(null);
  const [recitersLoading, setRecitersLoading] = useState(true);

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

  return (
    <div className="space-y-6">

      {/* Reciter Dropdown */}
      <div className="bg-white shadow rounded-lg p-4 border">
        <label className="font-semibold block mb-2">
          🎧 Select Reciter
        </label>

        <select
          className="w-full border rounded-lg p-2"
          value={reciter.identifier}
          onChange={(e) => {
            const selected = reciters.find(
              (r) => r.identifier === e.target.value
            );
            setReciter(selected);
          }}
        >
          {reciters.map((r) => (
            <option key={r.identifier} value={r.identifier}>
              {r.englishName}
            </option>
          ))}
        </select>
      </div>

      {/* Ayahs */}
      {arabic.ayahs.map((a, i) => {
        const audioAyah = audioEdition?.ayahs?.[i];

        return (
          <div
            key={a.number}
            className={`p-4 rounded-lg border shadow transition ${
              playingIndex === i
                ? "border-green-600 bg-green-50"
                : "bg-white"
            }`}
          >
            {/* Arabic */}
            <p className="text-3xl text-right leading-loose font-arabic">
              {a.text}
            </p>

            {/* Urdu */}
            <p className="mt-3 text-right text-green-700">
              {urdu.ayahs[i].text}
            </p>

            {/* English */}
            <p className="mt-2 text-gray-700">
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
    </div>
  );
}

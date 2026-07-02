// "use client";
// import { useEffect, useState } from "react";
// import axios from "axios";

// export default function SurahList({ onSelect }) {
//   const [surahs, setSurahs] = useState([]);

//   useEffect(() => {
//     axios.get("https://api.alquran.cloud/v1/surah")
//       .then(res => setSurahs(res.data.data));
//   }, []);

//   return (
//     <div className="p-4">
//       <h2 className="text-xl font-bold mb-2">Surahs</h2>
//       {surahs.map(surah => (
//         <div
//           key={surah.number}
//           onClick={() => onSelect(surah.number)}
//           className="cursor-pointer border p-2 mb-2 hover:bg-green-100"
//         >
//           {surah.number}. {surah.englishName}
//         </div>
//       ))}
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function SurahList({ onSelect }) {
  const [surahs, setSurahs] = useState([]);

  useEffect(() => {
    axios.get("https://api.alquran.cloud/v1/surah")
      .then(res => setSurahs(res.data.data));
  }, []);

  return (
    <div className="p-3">
      {surahs.map((s) => (
        <div
          key={s.number}
          onClick={() => onSelect(s.number)}
          className="p-3 mb-2 rounded-lg cursor-pointer bg-white shadow hover:bg-green-100 transition"
        >
          <p className="font-bold">{s.number}. {s.englishName}</p>
          <p className="text-sm text-gray-500">{s.name}</p>
        </div>
      ))}
    </div>
  );
}
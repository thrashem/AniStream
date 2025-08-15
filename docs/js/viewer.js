document.addEventListener("DOMContentLoaded", () => {
  const seasonSelect = document.getElementById("seasonSelect");
  const dateInput = document.getElementById("dateSelect");
  const platformDiv = document.getElementById("platformCheckboxes");
  const loadBtn = document.getElementById("loadBtn");
  const resultDiv = document.getElementById("result");
  const DAY_COUNT = 7;

  let platformMap = {};

  if (!dateInput.value) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    dateInput.value = `${y}-${m}-${d}`;
  }

  fetch("platforms.json").then(res => res.json()).then(map => {
    platformMap = map;
    const saved = JSON.parse(localStorage.getItem("platformPrefs") || "[]");
    Object.entries(map).forEach(([key, val]) => {
      const label = document.createElement("label");
      label.style.marginRight = "1em";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = key;
      cb.checked = saved.length === 0 || saved.includes(key);
      label.appendChild(cb);
      label.append(" " + val.label);
      platformDiv.appendChild(label);
    });
  });

  loadBtn.addEventListener("click", () => {
    const season = seasonSelect.value;
    const startDate = new Date(dateInput.value);
    const selected = Array.from(platformDiv.querySelectorAll("input:checked")).map(cb => cb.value);
    localStorage.setItem("platformPrefs", JSON.stringify(selected));
    const url = `https://raw.githubusercontent.com/thrashem/AniStream/main/${season}.json`;

    fetch(url).then(res => res.json()).then(data => {
      const days = [...Array(DAY_COUNT)].map((_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return {
          date: d,
          ymd: d.toISOString().slice(0, 10),
          weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
          entries: []
        };
      });

      for (const anime of data) {
        for (const s of anime.streaming || []) {
          if (!selected.includes(s.platform)) continue;
          if (!s.day_of_week || !s.first_air_date || !s.time) continue;

          const first = new Date(s.first_air_date);
          const last = s.last_air_date ? new Date(s.last_air_date) : null;
          
          for (const day of days) {
            if (day.weekday !== s.day_of_week || day.date < first || (last && day.date > last)) continue;
            day.entries.push({
              id: anime.anilist_id || anime.id || "",
              title: anime.title,
              time: s.time,
              platform: s.platform,
              platform_url: s.platform_url || ""
            });
          }
        }
      }

      resultDiv.innerHTML = "";
      let anyFound = false;

      for (const day of days) {
        if (day.entries.length === 0) continue;
        anyFound = true;

        day.entries.sort((a, b) => a.time.localeCompare(b.time));

        const jpWeek = { Sunday: "日", Monday: "月", Tuesday: "火", Wednesday: "水", Thursday: "木", Friday: "金", Saturday: "土" };
        const y = day.date.getFullYear();
        const m = String(day.date.getMonth() + 1).padStart(2, "0");
        const d = String(day.date.getDate()).padStart(2, "0");
        const w = jpWeek[day.weekday];
        const label = `${y}年${m}月${d}日(${w})`;

        const rows = day.entries.map(e => {
          const anilistLink = e.id
            ? `<a href="https://anilist.co/anime/${e.id}" target="_blank" rel="noopener">${e.id}</a>`
            : e.id;
          const platformText = platformMap[e.platform]?.label || e.platform;
          const platformLink = e.platform_url
            ? `<a href="${e.platform_url}" target="_blank" rel="noopener">${platformText}</a>`
            : platformText;

          return `<tr><td>${anilistLink}</td><td>${e.title}</td><td>${e.time}</td><td>${platformLink}</td></tr>`;
        }).join("");

        resultDiv.innerHTML += `<h3>${label}</h3><table>
<tr><th>AniList ID</th><th>Title</th><th>Time</th><th>Platform</th></tr>
${rows}
</table>`;
      }

      if (!anyFound) {
        resultDiv.innerHTML = `<p>該当する番組は見つかりませんでした。</p>`;
      }
    });
  });
});

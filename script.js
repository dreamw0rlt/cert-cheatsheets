const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = { filetype: "", location: "" };
const starters = [
  { label: "Login- en beheerpagina's", query: 'intitle:(login OR admin) inurl:(admin OR portal)' },
  { label: "Openbare documenten", query: '(filetype:pdf OR filetype:xlsx OR filetype:docx)' },
  { label: "Directory listings", query: 'intitle:"index of" (backup OR archive)' },
  { label: "Configuratiebestanden", query: '(filetype:conf OR filetype:env OR filetype:ini)' },
  { label: "Foutmeldingen en stack traces", query: 'intext:("stack trace" OR "fatal error" OR exception)' },
  { label: "API-documentatie", query: 'inurl:(api OR swagger OR graphql) (docs OR schema)' },
  { label: "Subdomeinen buiten www", query: '-www inurl:.' },
  { label: "Oude en tijdelijke bestanden", query: '(filetype:bak OR filetype:old OR filetype:tmp)' },
];

function cleanDomain(value) {
  return value.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
}

function terms(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function buildQuery() {
  const domain = cleanDomain($("#target").value) || "example.com";
  const keyword = $("#keywords").value.trim();
  const exclusions = terms($("#exclude").value).map((item) => `-${item.includes(" ") ? `"${item}"` : item}`);
  const parts = [$("#related").checked ? `related:${domain}` : `site:${domain}`];

  if (keyword) {
    const value = $("#exact").checked && !/^".*"$/.test(keyword) ? `"${keyword}"` : keyword;
    parts.push(state.location ? `${state.location}:${value}` : value);
  }
  if (state.filetype) parts.push(`filetype:${state.filetype}`);
  parts.push(...exclusions);
  const query = parts.join(" ");
  $("#queryOutput").textContent = query;
  $("#queryOutput").innerHTML = escapeHtml(query).replace(domain, `<mark>${escapeHtml(domain)}</mark>`);
  return query;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function renderStarters() {
  const shuffled = [...starters].sort(() => Math.random() - 0.5).slice(0, 4);
  $("#starterList").innerHTML = shuffled.map((item, index) => `<button class="starter" type="button" data-query="${escapeHtml(item.query)}"><i>0${index + 1}</i><span>${item.label}</span></button>`).join("");
  $$(".starter").forEach((button) => button.addEventListener("click", () => {
    const domain = cleanDomain($("#target").value) || "example.com";
    $("#keywords").value = button.dataset.query;
    state.location = "";
    $$("#locationOptions button").forEach((item, index) => item.classList.toggle("active", index === 0));
    $("#queryOutput").textContent = `site:${domain} ${button.dataset.query}`;
    buildQuery();
  }));
}

$$('input').forEach((input) => input.addEventListener("input", buildQuery));
$$('#filetypes button').forEach((button) => button.addEventListener("click", () => {
  state.filetype = state.filetype === button.dataset.value ? "" : button.dataset.value;
  $$('#filetypes button').forEach((item) => item.classList.toggle("active", item.dataset.value === state.filetype));
  buildQuery();
}));
$$('#locationOptions button').forEach((button) => button.addEventListener("click", () => {
  state.location = button.dataset.value;
  $$('#locationOptions button').forEach((item) => item.classList.toggle("active", item === button));
  buildQuery();
}));

$("#copyButton").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(buildQuery()); }
  catch { const area = document.createElement("textarea"); area.value = buildQuery(); document.body.append(area); area.select(); document.execCommand("copy"); area.remove(); }
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 1800);
});
$("#searchButton").addEventListener("click", () => window.open(`https://www.google.com/search?q=${encodeURIComponent(buildQuery())}`, "_blank", "noopener,noreferrer"));
$("#shuffleButton").addEventListener("click", renderStarters);
$("#resetButton").addEventListener("click", () => {
  $$('input:not([type="checkbox"])').forEach((input) => { input.value = ""; });
  $$('input[type="checkbox"]').forEach((input) => { input.checked = false; });
  state.filetype = ""; state.location = "";
  $$('#filetypes button').forEach((button) => button.classList.remove("active"));
  $$('#locationOptions button').forEach((button, index) => button.classList.toggle("active", index === 0));
  buildQuery();
});

renderStarters();
buildQuery();

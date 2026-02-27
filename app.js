let CATALOG = null;

// -------------------- Toast --------------------
let toastTimer = null;
function showToast(message, ms = 1800) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), ms);
}

// -------------------- Icons --------------------
function iconWhatsApp() {
  return `
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2a9.7 9.7 0 0 0-9.7 9.7c0 1.7.4 3.4 1.2 4.9L2 22l5.6-1.4c1.5.8 3.2 1.2 4.9 1.2A9.7 9.7 0 0 0 22.2 12 9.7 9.7 0 0 0 12 2zm0 17.7c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-3.3.8.9-3.2-.2-.3a7.8 7.8 0 0 1-1.2-4A7.9 7.9 0 0 1 12 4.2 7.9 7.9 0 0 1 19.8 12 7.9 7.9 0 0 1 12 19.7z"/>
    <path fill="currentColor" d="M16.6 14.2c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.6.1l-.6.7c-.2.2-.3.2-.5.1-1.5-.7-2.5-2-2.7-2.3-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.1-.4 0-.1-.1-.3-.1-.4l-.7-1.6c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.1.1 1.5.1.5-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1-.1-.1-.2-.2-.4-.3z"/>
  </svg>`;
}

function iconSignal() {
  return `
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 3c-5 0-9 3.5-9 7.8 0 2.4 1.3 4.6 3.4 6.1L6 21l4-2c.6.1 1.3.2 2 .2 5 0 9-3.5 9-7.8S17 3 12 3zm0 14.5c-.7 0-1.3-.1-1.9-.2l-.4-.1-1.8.9.4-2-.3-.2c-1.9-1.2-3-2.9-3-4.8C5 7.7 8.1 5.5 12 5.5s7 2.2 7 5.6-3.1 6-7 6z"/>
    <circle fill="currentColor" cx="9.3" cy="11.1" r="1"/>
    <circle fill="currentColor" cx="12" cy="11.1" r="1"/>
    <circle fill="currentColor" cx="14.7" cy="11.1" r="1"/>
  </svg>`;
}

// -------------------- Links --------------------
function buildWhatsAppLink(phoneE164, message) {
  const clean = (phoneE164 || "").replace(/\D/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${text}`;
}

function buildSignalChatLink(phoneE164) {
  return `https://signal.me/#p/${encodeURIComponent(phoneE164)}`;
}

function buildTelLink(phoneE164) {
  return `tel:${phoneE164}`;
}

// -------------------- Helpers --------------------
function money(price) {
  if (!price || price === 0) return "Quote";
  return `$${price.toFixed(0)}`;
}

function uniqueCategories(items) {
  const set = new Set(items.map(i => i.category).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function attachSignalCopyOpen(anchorEl, phoneE164, messageToCopy) {
  if (!anchorEl) return;

  anchorEl.addEventListener("click", async (e) => {
    e.preventDefault();
    const copied = await copyToClipboard(messageToCopy);
    if (copied) showToast("Message copied — paste it into Signal.", 2200);
    else showToast("Couldn’t auto-copy. Copy message manually.", 2200);

    window.open(buildSignalChatLink(phoneE164), "_blank", "noopener");
  });
}

// -------------------- Render catalog items --------------------
function renderItems(items, seller) {
  const grid = document.getElementById("grid");
  const status = document.getElementById("status");
  grid.innerHTML = "";

  status.textContent = `${items.length} item(s) shown • ${seller.location} • Typical lead time: ${seller.leadTime}`;

  if (items.length === 0) {
    grid.innerHTML = `<div class="status">No matches. Try a different search or category.</div>`;
    return;
  }

  for (const item of items) {
    const msg =
`Hi! I want to order: ${item.name}
Category: ${item.category}
Material: ${item.material}
Size: ${item.size}
Requested color(s): ______
Quantity: ____
Pickup: ${seller.location}`;

    const wa = buildWhatsAppLink(seller.phoneE164, msg);

    const card = document.createElement("article");
    card.className = "card";

    const badgeText = item.featured ? "Popular" : item.category;

    card.innerHTML = `
      <div class="thumb">
        <span class="badge">${badgeText}</span>
      </div>
      <div class="content">
        <div class="titleRow">
          <div class="title">${item.name}</div>
          <div class="price">${money(item.price)}</div>
        </div>
        <div class="desc">${item.description}</div>
        <div class="meta">
          <span class="pill">${item.category}</span>
          <span class="pill">${item.material}</span>
          <span class="pill">${item.size}</span>
          <span class="pill">${item.leadTimeDays} day(s)</span>
        </div>
        <div class="actions">
          <a class="btn primary" href="${wa}" target="_blank" rel="noopener">
            ${iconWhatsApp()}<span class="label">Order (WhatsApp)</span>
          </a>
        </div>
      </div>
    `;

    grid.appendChild(card);
  }
}

// -------------------- Render community picks --------------------
function renderPicks(picks, seller) {
  const picksGrid = document.getElementById("picksGrid");
  if (!picksGrid) return;

  picksGrid.innerHTML = "";

  if (!picks || picks.length === 0) {
    picksGrid.innerHTML = `<div class="status">No featured picks yet. Add links in catalog.json → community_picks.</div>`;
    return;
  }

  for (const p of picks) {
    const msg =
`Hi! I want to request this community model:
Name: ${p.name}
Source: ${p.source}
Link: ${p.url}

Desired size: ______
Color(s): ______
Quantity: ______
Pickup: ${seller.location}`;

    const wa = buildWhatsAppLink(seller.phoneE164, msg);

    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <div class="thumb">
        <span class="badge">${p.source}</span>
      </div>
      <div class="content">
        <div class="titleRow">
          <div class="title">${p.name}</div>
          <div class="price">Pick</div>
        </div>
        <div class="desc">${p.notes || "Community model link. License will be confirmed before printing."}</div>
        <div class="meta">
          <span class="pill">${p.source}</span>
        </div>
        <div class="actions">
          <a class="btn" href="${p.url}" target="_blank" rel="noopener">Open Model</a>
          <a class="btn primary" href="${wa}" target="_blank" rel="noopener">
            ${iconWhatsApp()}<span class="label">Request</span>
          </a>
        </div>
      </div>
    `;

    picksGrid.appendChild(card);
  }
}

// -------------------- Filters --------------------
function applyFilters() {
  const search = (document.getElementById("search").value || "").toLowerCase().trim();
  const category = document.getElementById("category").value;
  const sort = document.getElementById("sort").value;

  let items = [...CATALOG.items];

  if (category !== "all") items = items.filter(i => i.category === category);

  if (search) {
    items = items.filter(i => {
      const hay = [
        i.name, i.category, i.description,
        ...(i.tags || []),
        i.material, i.size, i.id
      ].join(" ").toLowerCase();
      return hay.includes(search);
    });
  }

  if (sort === "featured") {
    items.sort((a, b) => (b.featured === true) - (a.featured === true));
  } else if (sort === "priceAsc") {
    items.sort((a, b) => (a.price || 999999) - (b.price || 999999));
  } else if (sort === "priceDesc") {
    items.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sort === "nameAsc") {
    items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  renderItems(items, CATALOG.seller);
}

// -------------------- Init --------------------
async function init() {
  const res = await fetch("catalog.json", { cache: "no-store" });
  CATALOG = await res.json();

  const phone = CATALOG.seller.phoneE164;

  const generalMsg =
`Hi! I’m browsing your 3D print catalog.
I want to ask about: ______
Pickup: ${CATALOG.seller.location}`;

  const customMsg =
`Hi! I want a custom 3D print quote.
What I want: ______
Reference link/photo: ______
Desired size: ______
Color(s): ______
Quantity: ______
Pickup: ${CATALOG.seller.location}`;

  const linkMsg =
`Hi! I found a model online and want a quote.
Model link: ______
Site: Printables / MakerWorld
Desired size (approx): ______
Color(s): ______
Quantity: ______
Pickup: ${CATALOG.seller.location}`;

  // Header buttons
  const waGeneralEl = document.getElementById("waGeneral");
  const callGeneralEl = document.getElementById("callGeneral");

  if (waGeneralEl) {
    waGeneralEl.href = buildWhatsAppLink(phone, generalMsg);
    waGeneralEl.innerHTML = `${iconWhatsApp()}<span class="label">Order / Quote (WhatsApp)</span>`;
    waGeneralEl.target = "_blank";
    waGeneralEl.rel = "noopener";
  }

  if (callGeneralEl) callGeneralEl.href = buildTelLink(phone);

  // WhatsApp model link button
  const waFromLinkEl = document.getElementById("waFromLink");
  if (waFromLinkEl) {
    waFromLinkEl.href = buildWhatsAppLink(phone, linkMsg);
    waFromLinkEl.innerHTML = `${iconWhatsApp()}<span class="label">Send Model Link (WhatsApp)</span>`;
    waFromLinkEl.target = "_blank";
    waFromLinkEl.rel = "noopener";
  }

  // WhatsApp custom quote
  const waCustomEl = document.getElementById("waCustom");
  if (waCustomEl) {
    waCustomEl.href = buildWhatsAppLink(phone, customMsg);
    waCustomEl.innerHTML = `${iconWhatsApp()}<span class="label">Custom Quote (WhatsApp)</span>`;
    waCustomEl.target = "_blank";
    waCustomEl.rel = "noopener";
  }

  // Optional Signal (copy + open)
  const signalOptionalEl = document.getElementById("signalOptional");
  if (signalOptionalEl) {
    signalOptionalEl.innerHTML = `${iconSignal()}<span class="label">Contact via Signal (Copy + Open)</span>`;
    attachSignalCopyOpen(signalOptionalEl, phone, generalMsg);
  }

  // Populate categories
  const catSelect = document.getElementById("category");
  for (const c of uniqueCategories(CATALOG.items)) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  }

  // Wire controls
  document.getElementById("search").addEventListener("input", applyFilters);
  document.getElementById("category").addEventListener("change", applyFilters);
  document.getElementById("sort").addEventListener("change", applyFilters);

  // Render
  applyFilters();
  renderPicks(CATALOG.community_picks || [], CATALOG.seller);

  showToast("Catalog loaded.", 1400);
}

init().catch(err => {
  console.error(err);
  const status = document.getElementById("status");
  if (status) status.textContent = "Failed to load catalog.json. Check your file names and try again.";
});

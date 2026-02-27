let CATALOG = null;

// ---- Link builders ----
function buildSmsLink(phoneE164, message) {
  const body = encodeURIComponent(message);
  return `sms:${phoneE164}?&body=${body}`;
}

function buildWhatsAppLink(phoneE164, message) {
  // WhatsApp wa.me requires digits only (no +, spaces, etc.)
  const clean = (phoneE164 || "").replace(/\D/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${text}`;
}

function buildSignalLink(phoneE164, message) {
  // Works when Signal is installed; some browsers/OS may block deep links
  const text = encodeURIComponent(message);
  return `sgnl://send?phone=${phoneE164}&text=${text}`;
}

function buildTelLink(phoneE164) {
  return `tel:${phoneE164}`;
}

// ---- Helpers ----
function money(price) {
  if (!price || price === 0) return "Quote";
  return `$${price.toFixed(0)}`;
}

function uniqueCategories(items) {
  const set = new Set(items.map(i => i.category).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// ---- Render ----
function render(items, seller) {
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

    // Prefer WhatsApp + Signal for Germany-based community
    const wa = buildWhatsAppLink(seller.phoneE164, msg);
    const signal = buildSignalLink(seller.phoneE164, msg);

    const card = document.createElement("article");
    card.className = "card";

    const badgeText = item.featured ? "Popular" : item.category;

    // NOTE: If you want "Copy Item ID" back, see comment below.
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
          <a class="btn primary" href="${wa}">WhatsApp</a>
          <a class="btn" href="${signal}">Signal</a>
        </div>
      </div>
    `;

    grid.appendChild(card);
  }
}

// ---- Filters ----
function applyFilters() {
  const search = (document.getElementById("search").value || "").toLowerCase().trim();
  const category = document.getElementById("category").value;
  const sort = document.getElementById("sort").value;

  let items = [...CATALOG.items];

  if (category !== "all") {
    items = items.filter(i => i.category === category);
  }

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

  render(items, CATALOG.seller);
}

// ---- Init ----
async function init() {
  const res = await fetch("catalog.json", { cache: "no-store" });
  CATALOG = await res.json();

  // Header buttons: keeps your existing IDs (textGeneral/callGeneral/textCustom)
  // If you changed your index.html IDs to waGeneral/signalGeneral, tell me and I’ll adjust.
  const generalMsg =
`Hi! I’m looking at your 3D print catalog.
I want to ask about: ______
Pickup: ${CATALOG.seller.location}`;

  const textCustomMsg = "Hi! I want a custom 3D print quote. I’m looking for: ______";

  // WhatsApp as the primary "text" button
  const textGeneralEl = document.getElementById("textGeneral");
  if (textGeneralEl) textGeneralEl.href = buildWhatsAppLink(CATALOG.seller.phoneE164, generalMsg);

  const callGeneralEl = document.getElementById("callGeneral");
  if (callGeneralEl) callGeneralEl.href = buildTelLink(CATALOG.seller.phoneE164);

  const textCustomEl = document.getElementById("textCustom");
  if (textCustomEl) textCustomEl.href = buildWhatsAppLink(CATALOG.seller.phoneE164, textCustomMsg);

  // Optional: if you added the community models section button with id="textFromLink"
  const fromLinkEl = document.getElementById("textFromLink");
  if (fromLinkEl) {
    const linkMsg =
`Hi! I found a model online and want a quote.
Model link: ______
Site: Printables / MakerWorld
Desired size (approx): ______
Color(s): ______
Quantity: ______
Pickup: ${CATALOG.seller.location}`;
    fromLinkEl.href = buildWhatsAppLink(CATALOG.seller.phoneE164, linkMsg);
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

  applyFilters();
}

init().catch(err => {
  console.error(err);
  const status = document.getElementById("status");
  if (status) status.textContent = "Failed to load catalog.json. Check your file names and try again.";
});

/*
-----------------------
If you want “Copy Item ID” back:
-----------------------
1) In render(), add a third button:
   <a class="btn" href="#" data-copy="${item.id}">Copy ID</a>

2) After card.innerHTML, attach click handler like before:
   const copyBtn = card.querySelector("[data-copy]");
   copyBtn.addEventListener("click", (e) => { ... });

But on mobile, 3 buttons in one row gets tight unless we adjust CSS.
*/

import { fuzzyMatch, formatUrl } from "./helpers.js";

let logConsoleMessage = () => {
  console.log(
    "%c👋 Hey there" +
      "\n\n%cLooks like you're poking around in the console. Why not add your site to the webring?" +
      "\n\n%c→ https://github.com/faizm10/uog-webring",
    "font-size: 18px; font-weight: bold; color: #E51937;",
    "font-size: 14px; color: #000000;",
    "font-size: 14px; color: #FFC429; text-decoration: underline;"
  );
};

const getSites = () => (window.webringData?.sites ?? []);

const isAbsoluteHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeUrlInput = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
};

const socialIconSvg = (type) => {
  if (type === "website") {
    return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9Z"/></svg>`;
  }
  if (type === "instagram") {
    return `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm8.9 1.15a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/></svg>`;
  }
  if (type === "twitter") {
    return `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M18.24 2h3.27l-7.14 8.16L22.77 22h-6.57l-5.15-6.73L5.16 22H1.88l7.63-8.72L1.5 2h6.73l4.65 6.14L18.24 2Zm-1.15 18h1.81L7.25 3.9H5.3L17.1 20Z"/></svg>`;
  }
  if (type === "linkedin") {
    return `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A1.97 1.97 0 1 0 5.3 6.94 1.97 1.97 0 0 0 5.25 3ZM20.44 12.86c0-3.06-1.63-4.48-3.8-4.48-1.75 0-2.53.96-2.97 1.63V8.5h-3.38V20h3.38v-5.7c0-1.5.28-2.95 2.14-2.95 1.84 0 1.87 1.72 1.87 3.05V20h3.38v-7.14Z"/></svg>`;
  }
  return "";
};

const createSocialLink = (type, url, isSearchItem) => {
  if (!url || typeof url !== "string" || url.trim() === "") return null;

  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  if (type === "twitter") {
    a.title = "Twitter/X";
  } else if (type === "website") {
    a.title = "Website";
  } else {
    a.title = type[0].toUpperCase() + type.slice(1);
  }
  a.className = type === "website" ? "inline-flex items-center sm:hidden" : "inline-flex items-center";
  a.style.color = isSearchItem ? "#1a1308" : "#ffc429";
  a.innerHTML = socialIconSvg(type);
  return a;
};

let createWebringList = (matchedSiteIndices) => {
  const webringList = document.getElementById("webring-list");
  webringList.innerHTML = "";

  let firstHighlightedItem = null;

  getSites().forEach((site, index) => {
    const displayUrl = formatUrl(site.website);

    const listItem = document.createElement("tr");
    listItem.className = "align-middle table-row";
    const isSearchItem =
      matchedSiteIndices.includes(index) &&
      matchedSiteIndices.length !== getSites().length;
    if (isSearchItem) {
      listItem.className += " table-row-highlight";
    }

    if (firstHighlightedItem === null && isSearchItem) {
      firstHighlightedItem = listItem;
    }

    const name = document.createElement("td");
    name.className = "pr-2 sm:pr-3 py-0 font-latinRomanCaps truncate row-name";
    name.textContent = site.name;
    if (isSearchItem) {
      name.className += " row-highlight-text";
    }

    const year = document.createElement("td");
    year.className = "hidden sm:table-cell pr-2 sm:pr-3 py-0 text-left font-latinRoman row-year";
    year.textContent = site.year;
    if (isSearchItem) {
      year.className += " row-highlight-text";
    }

    const roleCell = document.createElement("td");
    roleCell.className = "pr-2 sm:pr-3 py-0 font-latinRoman truncate row-role";
    roleCell.textContent = site.role?.trim() || "—";
    if (isSearchItem) {
      roleCell.className += " row-highlight-text";
    }

    const urlCell = document.createElement("td");
    urlCell.className = "hidden sm:table-cell pr-2 sm:pr-3 py-0 truncate";

    const link = document.createElement("a");
    link.href = site.website;
    link.className = "font-latinMonoRegular underline row-url";
    link.textContent = displayUrl;
    if (isSearchItem) {
      link.className += " row-highlight-text";
    }
    urlCell.appendChild(link);

    const linksCell = document.createElement("td");
    linksCell.className = "pl-2 sm:pl-3 py-0 min-w-[3.5rem] row-links";

    const links = document.createElement("div");
    links.className = "flex items-center gap-3";

    const websiteLink = createSocialLink("website", site.website, isSearchItem);
    const instagramLink = createSocialLink("instagram", site?.links?.instagram, isSearchItem);
    const twitterLink = createSocialLink("twitter", site?.links?.twitter, isSearchItem);
    const linkedinLink = createSocialLink("linkedin", site?.links?.linkedin, isSearchItem);
    if (websiteLink) links.appendChild(websiteLink);
    if (instagramLink) links.appendChild(instagramLink);
    if (twitterLink) links.appendChild(twitterLink);
    if (linkedinLink) links.appendChild(linkedinLink);
    if (!websiteLink && !instagramLink && !twitterLink && !linkedinLink) {
      const empty = document.createElement("span");
      empty.textContent = "—";
      empty.className = "font-latinMonoRegular";
      empty.style.color = isSearchItem ? "#1a1308" : "#ffc429";
      links.appendChild(empty);
    }
    linksCell.appendChild(links);

    listItem.appendChild(name);
    listItem.appendChild(year);
    listItem.appendChild(roleCell);
    listItem.appendChild(urlCell);
    listItem.appendChild(linksCell);
    webringList.appendChild(listItem);
  });

  // Only scroll if there's a highlighted item
  if (firstHighlightedItem) {
    setTimeout(() => {
      firstHighlightedItem.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }
};
function handleUrlFragment(searchInput) {
  const fragment = window.location.hash.slice(1); // Remove the # symbol
  if (fragment) {
    searchInput.value = decodeURIComponent(fragment);
    filterWebring(fragment);
    const searchEvent = new Event("input");
    searchInput.dispatchEvent(searchEvent);
  }
}
function filterWebring(searchTerm) {
  const searchLower = searchTerm.toLowerCase();
  const matchedSiteIndices = [];
  getSites().forEach((site, index) => {
    if (
      site.name.toLowerCase().includes(searchLower) ||
      fuzzyMatch(site.website.toLowerCase(), searchLower) ||
      site.year.toString().includes(searchLower) ||
      (site?.role || "").toLowerCase().includes(searchLower) ||
      (site?.links?.instagram || "").toLowerCase().includes(searchLower) ||
      (site?.links?.twitter || "").toLowerCase().includes(searchLower) ||
      (site?.links?.linkedin || "").toLowerCase().includes(searchLower)
    ) {
      matchedSiteIndices.push(index);
    }
  });
  createWebringList(matchedSiteIndices);
}
let navigateWebring = () => {
  // https://cs.uwatering.com/#your-site-here?nav=next OR
  // https://cs.uwatering.com/#your-site-here?nav=prev
  const fragment = window.location.hash.slice(1); // #your-site-here?nav=
  if (!fragment.includes("?")) return;

  const [currentSite, query] = fragment.split("?");
  const params = new URLSearchParams(query);
  const nav = params.get("nav");
  const navTrimmed = nav ? nav.replace(/\/+$/, "").trim() : "";
  if (!nav || !["next", "prev"].includes(navTrimmed)) return;

  const match = getSites().filter((site) =>
    fuzzyMatch(currentSite, site.website)
  );
  if (match.length === 0) return;
  if (match.length > 1) {
    throw new Error(
      `Cannot calculate navigation state because mutiple URLs matched ${currentSite}`
    );
  }

  const currIndex = getSites().findIndex((site) =>
    fuzzyMatch(currentSite, site.website)
  );
  const increment = navTrimmed === "next" ? 1 : -1;
  let newIndex = (currIndex + increment) % getSites().length;
  if (newIndex < 0) newIndex = getSites().length - 1;
  if (!getSites()[newIndex]) return;

  document.body.innerHTML = `
  <main class="p-6 min-h-[100vh] w-[100vw] text-site-paper bg-site-ink">
    <p class="font-latinMonoCondOblique">redirecting...</p>
  </main>
  `;
  window.location.href = getSites()[newIndex].website;
};

document.addEventListener("DOMContentLoaded", async () => {
  await (window.webringDataReady ?? Promise.resolve());

  if (window.location.hash.includes("?nav=")) {
    navigateWebring();
  }
  const desktopInput = document.getElementById("search");
  const mobileInput = document.getElementById("search-mobile");
  const searchMemberCount = document.getElementById("search-member-count");
  const formModal = document.getElementById("form-modal");
  const openFormModal = document.getElementById("open-form-modal");
  const closeFormModal = document.getElementById("close-form-modal");
  const formModalBackdrop = document.getElementById("form-modal-backdrop");
  const submitForm = document.getElementById("member-submit-form");
  const submitButton = document.getElementById("submit-member-button");
  const submitStatus = document.getElementById("member-submit-status");

  logConsoleMessage();
  createWebringList(getSites().map((_, index) => index));
  if (searchMemberCount) searchMemberCount.textContent = String(getSites().length);
  if (desktopInput) handleUrlFragment(desktopInput);
  if (mobileInput) handleUrlFragment(mobileInput);

  if (desktopInput) {
    desktopInput.addEventListener("input", (e) => {
      filterWebring(e.target.value);
    });
  }
  if (mobileInput) {
    mobileInput.addEventListener("input", (e) => {
      filterWebring(e.target.value);
    });
  }
  window.addEventListener("hashchange", () => {
    if (desktopInput) handleUrlFragment(desktopInput);
    if (mobileInput) handleUrlFragment(mobileInput);
  });
  window.addEventListener("hashchange", navigateWebring);

  const closeModal = () => {
    if (!formModal) return;
    formModal.classList.add("hidden");
    document.body.style.overflow = "";
  };

  if (openFormModal && formModal) {
    openFormModal.addEventListener("click", () => {
      formModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
    });
  }
  if (closeFormModal) closeFormModal.addEventListener("click", closeModal);
  if (formModalBackdrop) formModalBackdrop.addEventListener("click", closeModal);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  if (submitForm && submitButton && submitStatus) {
    submitForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(submitForm);
      const payload = {
        name: (formData.get("name") || "").toString().trim(),
        year: Number.parseInt((formData.get("year") || "").toString(), 10),
        website: normalizeUrlInput((formData.get("website") || "").toString()),
        role: (formData.get("role") || "").toString().trim(),
        links: {
          instagram: normalizeUrlInput((formData.get("instagram") || "").toString()),
          twitter: normalizeUrlInput((formData.get("twitter") || "").toString()),
          linkedin: normalizeUrlInput((formData.get("linkedin") || "").toString()),
          github: normalizeUrlInput((formData.get("github") || "").toString()),
        },
      };

      const errors = [];
      if (!payload.name) errors.push("Name is required.");
      if (!Number.isInteger(payload.year) || payload.year < 2000 || payload.year > 2100) {
        errors.push("Year must be between 2000 and 2100.");
      }
      if (!payload.website || !isAbsoluteHttpUrl(payload.website)) {
        errors.push("Website URL is invalid.");
      }
      ["instagram", "twitter", "linkedin", "github"].forEach((field) => {
        const value = payload.links[field];
        if (value && !isAbsoluteHttpUrl(value)) {
          errors.push(`${field} URL is invalid.`);
        }
      });

      if (errors.length) {
        submitStatus.textContent = errors.join(" ");
        submitStatus.className = "text-xs font-latinMonoRegular text-site-accent";
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
      submitStatus.textContent = "Creating your PR...";
      submitStatus.className = "text-xs font-latinMonoRegular text-site-muted";

      try {
        const response = await fetch("/api/submit-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const rawResponse = await response.text();
        let data = {};
        if (rawResponse) {
          try {
            data = JSON.parse(rawResponse);
          } catch (parseError) {
            data = { message: rawResponse };
          }
        }

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Submission endpoint is not available on this deployment.");
          }
          const detailText = [data?.message, data?.details].filter(Boolean).join(" ");
          if (detailText) {
            throw new Error(detailText);
          }
          throw new Error(`Could not submit form (HTTP ${response.status}).`);
        }

        if (!data?.prUrl || !data?.prNumber) {
          throw new Error("Submission succeeded but PR details were not returned.");
        }

        submitStatus.innerHTML = `Done. Your PR is ready: <a href="${data.prUrl}" class="underline" target="_blank" rel="noopener noreferrer">#${data.prNumber}</a>`;
        submitStatus.className = "text-xs font-latinMonoRegular text-site-paper";
        submitForm.reset();
        closeModal();
      } catch (error) {
        submitStatus.textContent = error.message || "Could not submit form. Please try again.";
        submitStatus.className = "text-xs font-latinMonoRegular text-site-accent";
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit and create PR";
      }
    });
  }
});

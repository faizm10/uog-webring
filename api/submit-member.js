const GITHUB_API = "https://api.github.com";
const GITHUB_OWNER = "faizm10";
const GITHUB_REPO = "uog-webring";

function normalizeWebsite(rawUrl) {
  const parsed = new URL(rawUrl);
  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const path = parsed.pathname.replace(/\/+$/, "");
  const search = parsed.search || "";
  const hash = parsed.hash || "";
  return `${host}${path}${search}${hash}`.toLowerCase();
}

function isAbsoluteHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrlInput(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function sanitizeBranchPart(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "member";
}

async function githubRequest(path, token, method = "GET", body) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "uog-webring-bot",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${text}`);
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "submit-member endpoint is reachable",
      configured: Boolean(process.env.GITHUB_TOKEN),
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = GITHUB_OWNER;
  const repo = GITHUB_REPO;

  if (!token) {
    return res.status(500).json({
      message: "Server is missing GitHub configuration. Required env var: GITHUB_TOKEN.",
    });
  }

  try {
    const payload = req.body || {};
    const name = (payload.name || "").toString().trim();
    const year = Number.parseInt((payload.year || "").toString(), 10);
    const website = normalizeUrlInput((payload.website || "").toString());
    const role = (payload.role || "").toString().trim();
    const links = payload.links || {};

    const instagram = normalizeUrlInput((links.instagram || "").toString());
    const twitter = normalizeUrlInput((links.twitter || "").toString());
    const linkedin = normalizeUrlInput((links.linkedin || "").toString());
    const github = normalizeUrlInput((links.github || "").toString());

    const errors = [];
    if (!name) errors.push("name is required");
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      errors.push("year must be between 2000 and 2100");
    }
    if (!website || !isAbsoluteHttpUrl(website)) {
      errors.push("website must be an absolute URL (http:// or https://)");
    }

    [instagram, twitter, linkedin, github].forEach((value, idx) => {
      const keys = ["instagram", "twitter", "linkedin", "github"];
      if (value && !isAbsoluteHttpUrl(value)) {
        errors.push(`${keys[idx]} must be an absolute URL when provided`);
      }
    });

    if (errors.length) {
      return res.status(400).json({ message: errors.join(", ") });
    }

    const repoMeta = await githubRequest(`/repos/${owner}/${repo}`, token);
    const defaultBranch = repoMeta.default_branch;

    const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`, token);
    const baseSha = baseRef.object.sha;

    const membersFile = await githubRequest(
      `/repos/${owner}/${repo}/contents/data/members.json?ref=${encodeURIComponent(defaultBranch)}`,
      token
    );

    const decoded = Buffer.from(membersFile.content, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);

    if (!parsed || !Array.isArray(parsed.sites)) {
      return res.status(500).json({ message: "members.json does not contain a sites array" });
    }

    const normalizedIncomingWebsite = normalizeWebsite(website);
    const duplicate = parsed.sites.some((site) => {
      if (!site?.website || typeof site.website !== "string") return false;
      try {
        return normalizeWebsite(site.website) === normalizedIncomingWebsite;
      } catch {
        return false;
      }
    });

    if (duplicate) {
      return res.status(409).json({ message: "A member with this website already exists." });
    }

    const entry = {
      name,
      year,
      website,
      links: {
        instagram: instagram || "",
        twitter: twitter || "",
        linkedin: linkedin || "",
        github: github || "",
      },
    };
    if (role) {
      entry.role = role;
    }

    parsed.sites.push(entry);
    const updatedMembers = `${JSON.stringify(parsed, null, 2)}\n`;

    const branch = `auto/site-form-${sanitizeBranchPart(name)}-${Date.now().toString().slice(-8)}`;

    await githubRequest(`/repos/${owner}/${repo}/git/refs`, token, "POST", {
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    });

    await githubRequest(`/repos/${owner}/${repo}/contents/data/members.json`, token, "PUT", {
      message: `chore: add member from site form (${name})`,
      content: Buffer.from(updatedMembers, "utf8").toString("base64"),
      branch,
      sha: membersFile.sha,
    });

    const pr = await githubRequest(`/repos/${owner}/${repo}/pulls`, token, "POST", {
      title: `Add member: ${name}`,
      head: branch,
      base: defaultBranch,
      body: [
        `Automated submission from the uog-webring site form.`,
        "",
        `Submitted profile: ${website}`,
      ].join("\n"),
    });

    return res.status(201).json({ prUrl: pr.html_url, prNumber: pr.number });
  } catch (error) {
    return res.status(500).json({
      message: "Could not create PR from submission.",
      details: String(error.message || error),
    });
  }
};

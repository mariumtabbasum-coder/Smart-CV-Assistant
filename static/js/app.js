const form = document.getElementById("cvForm");
const buttons = [...document.querySelectorAll("[data-action]")];
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const resultContent = document.getElementById("resultContent");
const resultSections = document.getElementById("resultSections");
const retryButton = document.getElementById("retryButton");
const copyAllButton = document.getElementById("copyAll");
let lastAction = "resume";
let latestResult = null;
let latestInput = {};

function showState(state) {
  [emptyState, loadingState, errorState, resultContent].forEach(el => el.classList.add("d-none"));
  state.classList.remove("d-none");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function renderResult(result, action) {
  latestResult = result;
  let html = "";

  if (action === "improve") {
    html += `<div class="upgrade-banner"><span class="upgrade-icon">✦</span><div><b>Resume transformation complete</b><small>Your content has been rewritten and reorganized for a more professional presentation.</small></div></div>`;
    html += `<section class="comparison-grid">
      <article class="compare-card before-card"><div class="compare-label"><span class="compare-dot"></span> BEFORE</div><h4>Original profile</h4><p class="original-text">${escapeHtml(latestInput.current_resume?.trim() || [latestInput.education, latestInput.skills, latestInput.experience].filter(Boolean).join("\n\n") || result.before_summary || "Your original profile information was used as the starting point.")}</p></article>
      <article class="compare-card after-card"><div class="compare-label"><span class="compare-dot"></span> AFTER · IMPROVED</div><h4>${escapeHtml(result.improved_headline || "Professional Profile")}</h4><p>${escapeHtml(result.improved_summary || result.resume_summary || "")}</p></article>
    </section>`;
    if (Array.isArray(result.skills_descriptions) && result.skills_descriptions.length) {
      html += `<section class="result-block"><h4>REFINED SKILLS</h4>${result.skills_descriptions.map(item => `<div class="skill-item"><b>${escapeHtml(item.skill)}</b><span>${escapeHtml(item.description)}</span></div>`).join("")}</section>`;
    }
    if (Array.isArray(result.improved_experience) && result.improved_experience.length) {
      html += `<section class="result-block"><h4>IMPROVED EXPERIENCE & PROJECT BULLETS</h4><ul class="resume-bullets">${result.improved_experience.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
    }
    if (Array.isArray(result.change_highlights) && result.change_highlights.length) {
      html += `<section class="result-block"><h4>WHAT CHANGED?</h4><div class="change-list">${result.change_highlights.map((item, i) => `<div class="change-item"><span>${String(i+1).padStart(2,"0")}</span><p>${escapeHtml(item)}</p></div>`).join("")}</div></section>`;
    }
  } else {
    if (result.resume_summary) html += `<section class="result-block"><h4>RESUME SUMMARY</h4><p>${escapeHtml(result.resume_summary)}</p></section>`;
    if (Array.isArray(result.skills_descriptions) && result.skills_descriptions.length) {
      html += `<section class="result-block"><h4>PROFESSIONAL SKILLS</h4>${result.skills_descriptions.map(item => `<div class="skill-item"><b>${escapeHtml(item.skill)}</b><span>${escapeHtml(item.description)}</span></div>`).join("")}</section>`;
    }
  }
  if (result.cover_letter) html += `<section class="result-block"><h4>COVER LETTER</h4><p class="letter-text">${escapeHtml(result.cover_letter)}</p></section>`;
  if (Array.isArray(result.improvement_suggestions) && result.improvement_suggestions.length) {
    html += `<section class="result-block"><h4>${action === "improve" ? "NEXT STEPS TO MAKE IT EVEN STRONGER" : "IMPROVEMENT SUGGESTIONS"}</h4><ul>${result.improvement_suggestions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
  }
  if (Array.isArray(result.notes) && result.notes.length) html += `<section class="result-block"><h4>NOTES TO REVIEW</h4><ul>${result.notes.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;

  resultSections.innerHTML = html || "<p>No content was returned. Please try again.</p>";
  document.querySelector(".result-head .eyebrow").textContent = action === "improve" ? "BEFORE → AFTER RESUME EDITOR" : "AI-GENERATED DRAFT";
  document.querySelector(".result-head h3").textContent = action === "improve" ? "Your upgraded resume" : "Your career toolkit";
  showState(resultContent);
}

async function generate(action) {
  lastAction = action;
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  latestInput = {...data};
  data.action = action;
  buttons.forEach(button => button.disabled = true);
  showState(loadingState);

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Unable to generate content.");
    renderResult(payload.result, action);
  } catch (error) {
    errorMessage.textContent = error.message || "Something went wrong. Please try again.";
    showState(errorState);
  } finally {
    buttons.forEach(button => button.disabled = false);
  }
}

buttons.forEach(button => button.addEventListener("click", () => generate(button.dataset.action)));
retryButton.addEventListener("click", () => generate(lastAction));

copyAllButton.addEventListener("click", async () => {
  if (!latestResult) return;
  const text = [
    latestResult.improved_headline && `IMPROVED HEADLINE\n${latestResult.improved_headline}`,
    (latestInput.current_resume || [latestInput.education, latestInput.skills, latestInput.experience].filter(Boolean).join("\n\n")) && `ORIGINAL CONTENT\n${latestInput.current_resume || [latestInput.education, latestInput.skills, latestInput.experience].filter(Boolean).join("\n\n")}`,
    latestResult.improved_summary && `IMPROVED RESUME SUMMARY\n${latestResult.improved_summary}`,
    latestResult.improved_experience?.length && `IMPROVED EXPERIENCE & PROJECTS\n${latestResult.improved_experience.map(x => `• ${x}`).join("\n")}`,
    latestResult.change_highlights?.length && `WHAT CHANGED\n${latestResult.change_highlights.map(x => `• ${x}`).join("\n")}`,
    latestResult.resume_summary && `RESUME SUMMARY\n${latestResult.resume_summary}`,
    latestResult.skills_descriptions?.length && `PROFESSIONAL SKILLS\n${latestResult.skills_descriptions.map(x => `${x.skill}: ${x.description}`).join("\n")}`,
    latestResult.cover_letter && `COVER LETTER\n${latestResult.cover_letter}`,
    latestResult.improvement_suggestions?.length && `IMPROVEMENT SUGGESTIONS\n${latestResult.improvement_suggestions.map(x => `• ${x}`).join("\n")}`,
    latestResult.notes?.length && `NOTES\n${latestResult.notes.map(x => `• ${x}`).join("\n")}`
  ].filter(Boolean).join("\n\n");
  try {
    await navigator.clipboard.writeText(text);
    copyAllButton.textContent = "Copied ✓";
    setTimeout(() => copyAllButton.textContent = "Copy all ⧉", 1600);
  } catch {
    copyAllButton.textContent = "Copy unavailable";
  }
});

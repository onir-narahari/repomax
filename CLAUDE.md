@AGENTS.md
# RepoStory

## Mission

RepoStory turns a GitHub repository into high-converting career and launch content.

The user should paste a public GitHub repo URL and instantly get:
1. Three resume bullets that make the project sound internship/recruiter-ready
2. One LinkedIn post that makes the project sound polished and impressive
3. One X/Twitter post that is short, sharp, and attention-grabbing

This is not a generic resume builder.
This is a repo-to-story engine for students, builders, and internship applicants who build real projects but explain them badly.

## Product Standard

The output should make users think:

"Damn, this made my project sound way better."

If the output sounds generic, boring, fake, or like every other AI resume tool, the product failed.

The product wins when:
- a weak GitHub repo becomes a strong project story
- a student can copy the bullets directly into a resume
- the LinkedIn post sounds human and confident
- the X post sounds punchy enough to actually post
- every claim is grounded in the repo
- the app feels fast, clean, and polished enough to show real users

## Core User Flow

1. User enters a public GitHub repo URL
2. User optionally selects a target role
3. App reads the repo and extracts useful project evidence
4. App turns repo evidence into structured project facts
5. App generates:
   - 3 resume bullets
   - 1 LinkedIn post
   - 1 X/Twitter post
6. User can copy each output immediately

Do not add extra product flows unless explicitly approved.

## Product Constraints

Allowed:
- GitHub repo URL input
- Target role selector if useful
- Repo analysis
- Resume bullets
- LinkedIn post
- X/Twitter post
- Copy buttons
- Loading states
- Error states
- Clean responsive UI

Not allowed unless explicitly approved:
- auth
- database
- dashboard
- payments
- Chrome extension
- public sharing pages
- scoring system
- resume upload
- cover letters
- job matching
- unrelated AI features

This product should feel focused, not bloated.

## Non-Negotiable Truth Rule

All generated content must be grounded in actual repo evidence.

Never invent:
- fake metrics
- fake users
- fake revenue
- fake scale
- fake funding
- fake production usage
- fake performance improvements
- fake company impact
- fake technical features
- fake integrations
- fake deployment details

If the repo does not provide enough evidence, write the strongest honest version possible.

Acceptable:
"Built a FastAPI-based stock analysis API integrating financial data endpoints and LLM-based query routing."

Not acceptable:
"Scaled an AI investing platform to 10,000 users and improved analysis speed by 40%."

Unless the repo proves it, do not say it.

## Repo Analysis Standard

The app should not dump raw README text directly into a writer prompt and hope for the best.

The pipeline should be:

GitHub repo data
→ structured project evidence
→ project story facts
→ career/social outputs
→ quality check

The repo analyzer should extract:
- project name
- project type
- what the product/app does
- target user if inferable
- core features
- tech stack
- frameworks/libraries
- APIs/integrations
- backend/frontend/data/model components
- architecture hints
- interesting technical decisions
- source evidence for important claims
- missing information that would improve the output

## Structured Repo Context Shape

Prefer generating or maintaining an internal structure like:

{
  "repoName": "",
  "repoUrl": "",
  "projectType": "",
  "oneSentenceSummary": "",
  "targetUser": "",
  "techStack": [],
  "coreFeatures": [],
  "technicalComponents": [],
  "apiIntegrations": [],
  "architectureNotes": [],
  "interestingImplementationDetails": [],
  "evidence": [
    {
      "claim": "",
      "source": "",
      "confidence": "high | medium | low"
    }
  ],
  "missingInfo": []
}

The writer should use structured facts, not random guesses.

## Resume Bullet Standard

Resume bullets must be strong enough for internship recruiting.

Each bullet should:
- start with a strong action verb
- clearly state what was built
- include relevant technical detail
- show engineering depth
- connect the technical work to product/user value
- be tailored to the target role if selected
- stay honest when metrics are unavailable
- avoid sounding like generic AI output

Preferred formula:
Action verb + technical system + implementation detail + outcome/value

Good:
"Built a FastAPI-based equity research API integrating Financial Modeling Prep data, valuation logic, and LLM query routing to generate natural-language stock analysis responses."

Bad:
"Created an AI finance app using Python."

Good:
"Implemented a repo analysis pipeline that extracts README content, dependency files, language metadata, and file-tree signals to generate grounded career content from GitHub projects."

Bad:
"Worked on a tool that helps users with resumes."

Avoid:
- "worked on"
- "helped build"
- "utilized various technologies"
- "leveraged cutting-edge AI"
- fake numbers
- vague business impact
- buzzword stuffing

## LinkedIn Post Standard

The LinkedIn post should sound like a real builder sharing a project.

It should:
- open with a clear hook
- explain what was built
- mention the most interesting technical pieces
- explain what the builder learned
- sound confident but not cringe
- avoid fake hype
- avoid corporate fluff
- be polished enough to post immediately

It should not sound like:
"I am thrilled to announce..."
unless the user specifically asks for that style.

## X/Twitter Post Standard

The X post should be short, specific, and attention-grabbing.

It should:
- have a strong first line
- explain the project in plain English
- include one technical detail
- include one sharp takeaway
- be easy to screenshot or post
- avoid sounding like LinkedIn

Good:
"Built a tool that turns any GitHub repo into resume bullets + launch posts.

The hard part wasn’t the LLM. It was making the output grounded in the actual code instead of fake AI fluff."

Bad:
"Excited to share my new project, which leverages AI to optimize career development."

## Frontend Standard

The UI should feel clean enough to show real users.

Priorities:
- obvious input flow
- fast perceived speed
- strong loading state
- clean result cards
- copy buttons
- mobile responsiveness
- no clutter
- no dashboard feel
- no unnecessary navigation

The result page should make the output feel valuable.

## Engineering Standard

Prefer:
- simple architecture
- clear modules
- typed data structures
- readable functions
- explicit error handling
- focused components
- small changes

Avoid:
- giant functions
- prompt logic mixed into UI
- GitHub fetching mixed into writing logic
- random abstractions
- unnecessary frameworks
- unrelated refactors

## Agent Workflow Rules

Before major changes:
- inspect relevant files only
- explain the plan
- state which files will be edited
- wait if the change is broad or risky

After changes:
- summarize files changed
- explain how to test locally
- mention any known limitations
- do not claim something works unless it was tested or clearly explain it was not tested

## Current Priority

The priority is not adding features.

The priority is making the core output excellent:
1. Repo understanding must be better
2. Resume bullets must be stronger
3. LinkedIn post must sound human
4. X post must be punchy
5. UI must make the output easy to use

Do not expand scope until this core loop feels good.
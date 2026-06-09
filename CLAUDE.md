# RepoMax Context

RepoMax is a SaaS tool for CS students and new grads.

A user pastes a public GitHub repo URL and gets:
1. A Repo Score
2. Specific repo gaps
3. Resume bullets
4. LinkedIn/X content
5. Suggestions to improve the README and project presentation

## Target user

CS students applying for internships or new grad roles.

They usually have decent projects, but their GitHub repos look weak because:
- README is vague
- no screenshots
- no demo link
- no install/run instructions
- no technical explanation
- resume bullets sound generic
- project impact is unclear

## Core positioning

RepoMax helps students make strong projects look strong.

Core line:
"Recruiters judge your repo in 30 seconds."

Avoid generic AI SaaS language like:
- unlock your potential
- supercharge your workflow
- AI-powered insights
- transform your career

## Product rules

RepoMax should feel:
- practical
- sharp
- recruiter-aware
- student-focused
- specific

It should not feel:
- corporate
- vague
- overdesigned
- generic AI SaaS

## Resume bullet rules

Generated bullets must:
- be grounded in actual repo evidence
- not invent users, revenue, scale, speed, latency, accuracy, or percentages
- use strong action verbs
- mention real stack/features from the repo
- stay concise
- be recruiter-readable

If metrics are not found, use technical specificity instead of fake numbers.

## Engineering rules

Before editing:
- explain the plan
- identify files likely involved
- avoid large rewrites

When editing:
- implement one feature/change at a time
- preserve working behavior
- do not change backend logic unless requested
- do not rename files casually
- do not rewrite styling system casually

After editing:
- run build/lint/tests if available
- summarize changed files
- explain how to verify locally
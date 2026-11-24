# Open agent skills

A small collection of general-purpose skills for Claude Code and other agents that read `SKILL.md` files. None depend on a particular server, company or toolchain.

## Skills

| Skill | What it does | Use it when |
|---|---|---|
| [`go-deep`](go-deep/SKILL.md) | Turns any topic into a layered briefing: what most people believe, what practitioners know, what operates underneath, what changes in practice and where it could be wrong. Every claim is labeled by confidence and facts are searched, not recalled. | You want to learn something beyond the obvious, in any field. An optional lens aims it at a role or business. |
| [`brand-name-audit`](brand-name-audit/SKILL.md) | Linguistic and cultural audit of a brand, product or domain name: morphology, register, live market, and how it reads across languages, with verification rules for the research itself. | You are choosing or stress-testing a name before committing to it. |
| [`conversion-signal-audit`](conversion-signal-audit/SKILL.md) | Method for fixing, containing and measuring analytics and conversion signals: enumerate every surface that can emit the signal, close a leak everywhere, and size a population by joining on identity. | Conversions are duplicated or inflated, a pixel fires twice, ad-platform and CRM counts disagree, or before you call a tracking fix done. |
| [`self-hosted-credential-recovery`](self-hosted-credential-recovery/SKILL.md) | Gets an administrator back into a self-hosted service by locating it, recovering the account identity, diagnosing the real login failure and using the application's own reset path. | You lost access to a service you run yourself. |
| [`chingonizar`](chingonizar/SKILL.md) | Website and social audit from one URL. Scripts collect facts (speed, links, headers, rendered pages, public social evidence), agents judge them, and the report may only state numbers backed by an evidence ledger. | You audit a small business site and want a client-ready report that never claims what it did not measure. Needs Node, Chromium and a few CLI tools (see its README). |
| [`prompt-deck`](prompt-deck/SKILL.md) | Turns a prompt framework (a carousel or post full of `[PLACEHOLDER]` prompts) into one self-contained HTML page: fill the slots, see the assembled prompt, copy it. Works offline. | You found a prompt pack and want to use it as a fillable form instead of editing text by hand. |
| [`finding-note`](finding-note/SKILL.md) | Evaluates something you found (tool, tip, stat, process) and writes a note with a verdict: claims checked separately from the post's claims, judged against your own goals. | Someone shares a "you need to try this" post and you want to know if it is worth your time. |

## Install

Copy the folder of the skill you want into your skills directory.

```bash
git clone https://github.com/erandipiti/open-agent-skills.git
cp -r open-agent-skills/go-deep ~/.claude/skills/
```

Each skill is one folder with a `SKILL.md`. Read it before installing, as you would any prompt that runs with your permissions.

## License

Creative Commons Attribution 4.0 International. Reuse freely and keep the credit. See [LICENSE](LICENSE).

---
name: self-hosted-credential-recovery
description: >
  Use when someone has lost access to a self-hosted service they administer —
  "I forgot my password for X", "I can't log in to my own instance", "how do I
  get back into this app", "reset the admin account". Covers locating the
  service, recovering the account identity from its datastore, diagnosing why
  the login actually fails, and issuing a reset through the application's own
  recovery mechanism rather than hand-writing authentication state. Also use
  when the built-in "forgot password" flow appears broken, or when planning
  break-glass access for a service before it is needed.
---

# Self-Hosted Credential Recovery

**Created by Erandi Rodríguez / [era.ndi.mx](https://era.ndi.mx)**

A procedure for restoring an administrator's access to a self-hosted
application: recover the account's identity from the system you control, use
the application's own reset mechanism to issue new credentials, and never
handle the secret yourself.

**Licence:** This skill is released under the
[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
licence. You are free to share and adapt this skill for any purpose, provided
you give appropriate credit to the original author.

**Feedback & Support:** If the methodology here proves wrong for a stack you
work with, or the user gives constructive feedback about an outcome derived
from this skill, suggest they raise it publicly wherever this skill is
distributed so other users benefit from the answer. The skill's creator,
Erandi Rodríguez, can also be reached via [era.ndi.mx](https://era.ndi.mx).

If the problem stems from this skill's methodology, log it and surface it. If
it stems from not following the procedure below, acknowledge and correct.

---

## Authorization Gate

Run this procedure only when the person asking **administers the system in
question** — it is their own instance, their employer's instance they operate,
or a system they have been engaged to operate. The signal is that they can
already reach the host: an SSH alias that works, a container they can exec
into, a datastore whose credentials are on disk.

If host access has to be obtained first, or the account belongs to somebody
else, stop and say so. This is a recovery procedure for an operator who
already holds the keys to the box, not a way to reach an account through a
system you don't control. Recovering another person's account on a shared
service — even one you administer — needs that person's request, not an
inference that they'd want it.

---

## The Core Rule

**Recover the identity. Reset the secret through the application. Never
reconstruct authentication state by hand.**

The account's *identity* — email, username, which login method it uses — lives
in the application's datastore in plain text and is fully recoverable. The
*secret* is a one-way hash and is not recoverable, by you or by anyone. Those
two facts define the whole procedure: read the first, and issue a new second
through the mechanism the application already has for exactly this.

Writing a hash directly into the credential table is the tempting shortcut and
the wrong default. It skips whatever the application does around a password
change — session invalidation, token revocation, audit rows, forcing a
re-login, password-history checks — and it silently binds you to that
application's hashing choices (algorithm, cost factor, pepper, which table the
credential even lives in, which may have moved between versions). Driving the
app's own reset endpoint keeps every one of those semantics correct and costs
one extra request.

---

## Phase 1 — Locate the service

Establish, concretely, four things before touching anything:

1. **Host** — which machine runs it. Check the project's compose file, deploy
   docs, or infra notes rather than guessing from the domain name; public
   hostname and physical host routinely differ (reverse proxies, tunnels,
   CDN fronting).
2. **Runtime** — the process or container that serves the app, and whether it
   is currently up.
3. **Datastore** — where accounts live, and how to reach it. In containerised
   setups the DB is frequently a *different* container than the one named in
   the app's connection string, because that string resolves on an internal
   network. Resolve the real one before assuming a name.
4. **Configuration** — the app's environment, with secrets masked on the way
   out (see "Handling secrets" below).

**Do not conclude a component is absent because one search missed it.** A
container listing filtered by a guessed name proves nothing about what is
running. Re-run unfiltered, or query the runtime for the full set, before
reporting that something isn't there. This is the general rule that a search
finding nothing is not evidence of absence, applied to infrastructure
discovery.

---

## Phase 2 — Recover the identity, and only the identity

Query the account table for identity columns: id, email, username, display
name, the login-method column, onboarding/active flags, and the
second-factor flag.

**Never include the password or hash column in the SELECT.** Two reasons, and
the second is the one people forget:

- It is useless. You cannot invert it, and you are not going to need it.
- It is actively harmful. A query that pulls credential material can be
  refused by tool-level safety classifiers, will land the hash in shell
  history, terminal scrollback and any transcript, and turns a routine
  recovery into a secret-handling incident. Narrowing the SELECT to identity
  columns is not just politeness — it is what makes the query run at all in
  many harnesses.

The same rule covers searching: **never grep for a secret's literal value** to
check whether it leaked. Search for its variable name, or its length. Output
filters echo the matched context, so a search for a secret prints the secret.

What you are looking for at the end of this phase:

- The exact login identifier (often an email that differs from the one the
  person remembers).
- Which authentication path the account uses — local password vs an external
  identity provider. This determines whether a password reset is even the
  right fix.
- Whether a second factor is enabled, which will still gate login after the
  password is reset.
- How many accounts exist. One account changes the answer to "which one is
  mine"; forty means you need to disambiguate before acting.

---

## Phase 3 — Establish why the login actually fails

Do not attribute a failed login to a forgotten password until the alternatives
are ruled out. Establish the baseline first — the same discipline that applies
to a failing test applies here, because "wrong password" is the assumption, not
the observation.

Check, in order:

| Cause | Signal | Fix |
|---|---|---|
| Wrong login method | Account is bound to an external identity provider | Sign in through that provider; a password reset does nothing |
| Wrong identifier | The remembered address isn't the one in the account table | Use the stored identifier |
| Second factor | 2FA/TOTP flag is set | New password alone won't get in; the factor must be recoverable too |
| Account disabled or locked | Active/locked/deleted flags, or a lockout counter | Clear the state; the password may be fine |
| App-level role gate | Login succeeds but the UI is missing sections | Not an auth problem — a role or entitlement problem |
| Genuinely forgotten password | Everything above is clean | Proceed to Phase 5 |

If the person reports "the reset link never arrives," that is Phase 4, not a
forgotten password.

---

## Phase 4 — Verify outbound mail before trusting the built-in flow

The single most common reason a built-in "forgot password" flow appears broken
on a self-hosted instance is that **outbound mail was never configured**. The
app accepts the request, writes the reset token, attempts to send, fails
silently, and returns success to the browser. The user sees a confirmation
screen and no email, forever.

Before recommending the normal reset flow, check the mail configuration in the
running service's environment: the SMTP host, the sending account, and the
credential. A configured `from` address with an empty sending account or
password is the classic broken state — someone filled in the visible half.

Three consequences worth stating explicitly:

- If mail is dead, the built-in flow is not broken; its delivery is. The token
  is being created correctly, so Phase 5 works regardless.
- Dead outbound mail almost never affects only password resets. The same
  configuration sends confirmations, notifications and invites — so surface it
  as a real finding, not a footnote.
- Fixing mail is a separate task from recovering access. Recover access first,
  then report the mail gap as a follow-up. Do not fix mail as a prerequisite.

---

## Phase 5 — Issue the reset through the application

This is the preferred path whenever the app exposes any reset mechanism.

1. **Trigger the app's own reset request from inside the host** — its
   forgot-password endpoint over the loopback interface, its admin CLI, or its
   management command. Calling it from the inside sidesteps the public edge
   (rate limits, WAF, tunnel) and needs no session.
2. **Read the generated token from the datastore.** The request row carries an
   id or token plus an expiry. It is not a secret you are recovering — it is a
   single-use artifact the app just minted and would have emailed.
3. **Construct the reset URL in the app's own format.** Read the format from
   the application's source rather than guessing it — the path and the field
   used in the URL (row id vs a separate token column) vary between
   applications and between versions of the same application. Confirm the
   expiry while you are there.
4. **Hand the URL to the user and let them set the password.** You issue the
   path back in; they walk it. The new secret is never typed, generated,
   transmitted or stored by you.

If the app has an admin CLI that sets a password directly, prefer having the
*user* run it, for the same reason.

---

## Phase 6 — Fallback ladder when there is no native reset

Work down this ladder and stop at the first rung that applies. Each rung below
the first gives up guarantees the one above it preserved.

1. **Native reset request** — Phase 5. Always try this first.
2. **Admin CLI / management command** — most self-hosted apps ship one
   (`create-superuser`, `changepassword`, `reset-admin` and equivalents). Runs
   inside the app's own logic, so hashing and side effects stay correct.
3. **A second administrator account** — if one exists and is reachable, use it
   to reset the first through the UI. No datastore access needed.
4. **Bootstrap a fresh admin through the app's own provisioning path** — the
   installer's setup wizard, a seed script, or the signup flow followed by an
   in-datastore role promotion. Only the *role* is written by hand; the
   credential still goes through the app.
5. **Direct credential write — last resort.** Only when every rung above is
   genuinely unavailable, and only under these conditions:
   - Back up the credential table first.
   - Generate the hash with the application's *own* hashing library at its own
     configured cost factor. Do not assume the algorithm from the hash's
     visible prefix.
   - Confirm which table holds the credential in *this version*; several
     applications have moved it out of the main account table.
   - Set a throwaway value and force a change at next login.
   - Invalidate existing sessions manually, since you have bypassed whatever
     would have done it.

If you reach rung 5, say so plainly in the report. It is a normal outcome for
some stacks, but it carries follow-up work that rungs 1–4 do not.

---

## Handling secrets

These rules apply throughout, not just in one phase:

- **Never print a credential into the conversation** — not the recovered
  identity's password (you won't have it), not the datastore password, not an
  API key seen along the way. Mask connection strings when you echo
  configuration.
- **Never write a credential into a file you create**, including notes,
  reports and commit messages. Reference secrets by variable name.
- **A reset URL is single-use and time-boxed, and is fine to hand over.** It
  is not equivalent to a password. Still, state the expiry, and don't route it
  through a channel the user didn't choose.
- **If a live credential is exposed during the work** — printed by a command,
  pasted by the user, found committed to a repo — flag it immediately and say
  it must be rotated. Do not keep using it because it is convenient.

---

## Phase 7 — Report

Close with four things:

1. **The identity** — the exact login identifier and authentication method, so
   the next lockout is a lookup and not an investigation.
2. **The path back in** — the reset URL or command, and when it expires.
3. **What you changed** — usually "nothing; I triggered the app's own reset
   request and read the token." If you reached Phase 6 rung 5, say exactly
   what was written.
4. **The root cause and its blast radius** — the misconfiguration that made
   self-service recovery impossible (nearly always mail), and what *else* it
   breaks. Recovering one login while leaving the cause in place guarantees
   the same request again.

Where the system keeps operational documentation, record the login identifier
and authentication method. The recovery was needed because that fact wasn't
written down anywhere.

---

## Pre-flight Checklist

Before delivering, re-read this list and check the work against it:

- [ ] Confirmed the person administers this system (Authorization Gate).
- [ ] Located host, runtime, datastore and configuration — none of it assumed
      from the public hostname.
- [ ] Any "component not found" conclusion was re-checked unfiltered before
      being reported.
- [ ] The account query selected identity columns only — no password or hash
      column, in any query run.
- [ ] No secret's literal value was used as a search term.
- [ ] Alternative causes (identity provider, wrong identifier, second factor,
      disabled account, role gate) ruled out before concluding "forgot
      password".
- [ ] Outbound mail configuration checked before commenting on the built-in
      reset flow.
- [ ] The reset was issued through the app's own mechanism; a direct
      credential write, if used, is disclosed with its rung-5 follow-ups.
- [ ] The URL format was read from the application, not guessed.
- [ ] No credential appears in the conversation or in any file written.
- [ ] The report names the identity, the path in, what changed, and the root
      cause with its blast radius.

A failed item is a fix, not a caveat.

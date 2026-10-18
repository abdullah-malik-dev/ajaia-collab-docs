"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signUp, type SignUpState } from "./actions";

export function SignUpForm({ next }: { next: string }) {
  const [state, action] = useFormState<SignUpState, FormData>(signUp, {});
  return (
    <form action={action} className="mt-8 border-t border-line pt-6">
      <h2 className="text-sm font-medium text-ink-muted">Or continue with your own name</h2>
      <p className="mt-1 text-sm text-ink-faint">
        No password. If the email is already known you&apos;ll be signed in as that person.
      </p>
      <input type="hidden" name="next" value={next} />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          name="name"
          required
          maxLength={60}
          defaultValue={state.name ?? ""}
          placeholder="Your name"
          aria-label="Your name"
          className="min-w-0 flex-1 rounded border border-line-strong bg-paper px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          required
          defaultValue={state.email ?? ""}
          placeholder="you@example.com"
          aria-label="Email"
          className="min-w-0 flex-1 rounded border border-line-strong bg-paper px-3 py-2 text-sm"
        />
        <Submit />
      </div>
      {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-accent px-3.5 py-2 text-sm font-medium text-paper hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Continue"}
    </button>
  );
}

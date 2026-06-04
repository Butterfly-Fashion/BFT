"use client";

import { useState, useRef } from "react";
import { submitContactMessage } from "@/app/contact-actions";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await submitContactMessage(formData);
    setLoading(false);
    if (result.success) {
      setSubmitted(true);
      formRef.current?.reset();
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  function toggle() {
    setOpen((v) => !v);
    if (submitted) setSubmitted(false);
    setError("");
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Desktop panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 hidden w-80 rounded-2xl border border-gray-100 bg-white shadow-2xl md:block">
          <ChatPanel
            submitted={submitted}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            onClose={() => setOpen(false)}
            formRef={formRef}
          />
        </div>
      )}

      {/* Mobile bottom sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-gray-100 bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <ChatPanel
          submitted={submitted}
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
          onClose={() => setOpen(false)}
          formRef={formRef}
        />
      </div>

      {/* Floating button */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#C41E3A] shadow-lg transition-colors hover:bg-[#A01830]"
        aria-label={open ? "Close support chat" : "Contact support"}
      >
        {open ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
      </button>
    </>
  );
}

function ChatPanel({
  submitted,
  loading,
  error,
  onSubmit,
  onClose,
  formRef,
}: {
  submitted: boolean;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  formRef: React.RefObject<HTMLFormElement | null>;
}) {
  return (
    <>
      {/* Drag handle — mobile only */}
      <div className="flex justify-center pb-1 pt-3 md:hidden">
        <div className="h-1 w-10 rounded-full bg-gray-200" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#C41E3A]">
            World Fan Gear
          </p>
          <p className="text-sm font-semibold text-gray-900">Contact Us</p>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        {submitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">Message sent!</p>
            <p className="mt-1 text-xs text-gray-500">
              We&apos;ll reply to your email within 24 hours.
            </p>
          </div>
        ) : (
          <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-blue-700 leading-relaxed">
                Leave a message and we&apos;ll reply to your email — usually within a few hours.
              </p>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Name</span>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A]/20"
                placeholder="Your name"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A]/20"
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Message</span>
              <textarea
                name="message"
                required
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#C41E3A] focus:ring-1 focus:ring-[#C41E3A]/20"
                placeholder="How can we help?"
              />
            </label>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#C41E3A] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#A01830] disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

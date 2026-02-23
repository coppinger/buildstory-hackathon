"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Do I need a project idea?",
    a: "No. Show up with an idea, find one during the week, or join someone else\u2019s. The only rule: ship something.",
  },
  {
    q: "What counts as \u2018shipping\u2019?",
    a: "A working thing. A deployed app, a CLI tool, a bot, an API \u2014 if someone else can use it or see it run, it counts.",
  },
  {
    q: "Can I work with a team?",
    a: "Yes. Solo or with teammates. You can bring your own or find collaborators through the hackathon.",
  },
  {
    q: "What if I\u2019m brand new?",
    a: "Perfect. This is designed for you too. The community and streams will help you get unstuck. Ship something small \u2014 that\u2019s the whole point.",
  },
  {
    q: "Do I have to stream?",
    a: "No, but we encourage it. Even streaming a portion of your build helps others learn and makes the whole thing more fun.",
  },
  {
    q: "What do I win?",
    a: "Recognition, not prizes. Standout projects get featured by the panel across five categories: Creativity, Business Case, Technical Challenge, Impact, and Design. Plus peer-to-peer voting for community favourites.",
  },
  {
    q: "How much time do I need?",
    a: "As much as you can give. Go all-in for the full week, commit a few hours a day, or build on nights and weekends. Any level of participation counts.",
  },
  {
    q: "Is vibecoding allowed?",
    a: "Absolutely. Use whatever AI tools you want \u2014 Cursor, Copilot, Claude, ChatGPT, v0, Bolt, all of it. This isn\u2019t about purity, it\u2019s about shipping. Just be honest about your stack.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-[900px]">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="border-t border-[#1a1917]">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between py-5 text-left group"
            >
              <span
                className={`font-mono text-base transition-colors ${
                  isOpen ? "text-[#e8e4de]" : "text-[#a09890]"
                } group-hover:text-[#e8e4de]`}
              >
                {faq.q}
              </span>
              <span
                className={`text-[#3d3a36] text-lg leading-none ml-6 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                isOpen ? "max-h-40 pb-5" : "max-h-0"
              }`}
            >
              <p className="font-mono text-base text-[#6b6560] leading-relaxed pr-4 md:pr-12">
                {faq.a}
              </p>
            </div>
          </div>
        );
      })}
      <div className="border-t border-[#1a1917]" />
    </div>
  );
}

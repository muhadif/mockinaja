"use client";

import { Button, Link } from "@heroui/react";
import { MoveRight, Zap, Code, Database } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background gradients */}
      <div className="pointer-events-none absolute -top-1/2 left-1/2 -z-10 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/30 to-secondary/30 opacity-50 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-1/2 -left-1/4 -z-10 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-40 blur-[120px]" />

      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">Mockinaja</span>
        </div>
        <div className="flex gap-4">
          <Button as={Link} href="/login" variant="ghost" color="primary">
            Sign In
          </Button>
          <Button as={Link} href="/register" color="primary" variant="shadow">
            Get Started
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-24 pb-32">
        <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
            🚀 The ultimate mocking platform for modern teams
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            Mock your APIs in <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
              seconds, not hours.
            </span>
          </h1>

          <p className="text-xl text-default-500 max-w-2xl">
            Create completely dynamic, customizable HTTP mock endpoints instantly.
            Accelerate your frontend development without waiting for the backend.
          </p>

          <div className="flex gap-4 mt-4">
            <Button as={Link} href="/register" size="lg" color="primary" variant="shadow" endContent={<MoveRight className="h-4 w-4" />}>
              Start Mocking Free
            </Button>
            <Button as={Link} href="https://github.com/muhadif/mockinaja" size="lg" variant="bordered">
              View Documentation
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-32">
          {[
            {
              icon: <Zap className="h-6 w-6" />,
              title: "Lightning Fast",
              desc: "Deploy mock endpoints to our global edge network in seconds."
            },
            {
              icon: <Code className="h-6 w-6" />,
              title: "GraphQL & REST",
              desc: "Support for all your favorite API paradigms flawlessly."
            },
            {
              icon: <Database className="h-6 w-6" />,
              title: "Dynamic Responses",
              desc: "Simulate delays, errors, and conditional responses easily."
            }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col gap-4 p-8 rounded-3xl bg-content1/50 border border-divider hover:-translate-y-1 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-default-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

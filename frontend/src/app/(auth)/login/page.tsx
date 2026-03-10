"use client";

import { useState } from "react";
import { Button, Input, Link } from "@heroui/react";
import { Mail, Lock, Zap } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client/core";
import { useRouter } from "next/navigation";

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
        onCompleted: (data) => {
            localStorage.setItem("token", data.login.token);
            router.push("/dashboard");
        }
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login({ variables: { email, password } });
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            <div className="absolute top-1/2 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />

            <div className="w-full max-w-md p-8 rounded-3xl bg-content1/50 border border-divider shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col items-center gap-2 mb-8">
                    <div className="h-12 w-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-2">
                        <Zap className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Welcome back</h1>
                    <p className="text-default-500 text-sm">Sign in to manage your mocks</p>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Email Address"
                        placeholder="you@example.com"
                        variant="faded"
                        startContent={<Mail className="h-4 w-4 text-default-400" />}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        variant="faded"
                        startContent={<Lock className="h-4 w-4 text-default-400" />}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && (
                        <div className="text-danger text-sm text-center">
                            Invalid credentials. Please try again.
                        </div>
                    )}

                    <Button
                        type="submit"
                        color="primary"
                        variant="shadow"
                        className="w-full mt-2"
                        isLoading={loading}
                    >
                        Sign In
                    </Button>
                </form>

                <p className="text-center text-sm text-default-500 mt-8">
                    Don't have an account? <Link href="/register" color="primary" size="sm">Create one</Link>
                </p>
            </div>
        </div>
    );
}

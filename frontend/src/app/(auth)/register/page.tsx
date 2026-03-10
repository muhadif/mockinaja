"use client";

import { useState } from "react";
import { Button, Input, Link } from "@heroui/react";
import { Mail, Lock, Zap, User } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client/core";
import { useRouter } from "next/navigation";

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $name: String!, $password: String!) {
    register(email: $email, name: $name, password: $password) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    const [register, { loading, error }] = useMutation(REGISTER_MUTATION, {
        onCompleted: (data) => {
            localStorage.setItem("token", data.register.token);
            router.push("/dashboard");
        }
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        register({ variables: { email, name, password } });
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            <div className="absolute bottom-1/4 right-1/4 -z-10 h-[600px] w-[600px] rounded-full bg-secondary/20 blur-[120px]" />

            <div className="w-full max-w-md p-8 rounded-3xl bg-content1/50 border border-divider shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col items-center gap-2 mb-8">
                    <div className="h-12 w-12 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center mb-2">
                        <Zap className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Create Account</h1>
                    <p className="text-default-500 text-sm">Join Mockinaja free today</p>
                </div>

                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Full Name"
                        placeholder="John Doe"
                        variant="faded"
                        startContent={<User className="h-4 w-4 text-default-400" />}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
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
                            Registration failed. {error.message}
                        </div>
                    )}

                    <Button
                        type="submit"
                        color="secondary"
                        variant="shadow"
                        className="w-full mt-2"
                        isLoading={loading}
                    >
                        Sign Up
                    </Button>
                </form>

                <p className="text-center text-sm text-default-500 mt-8">
                    Already have an account? <Link href="/login" color="secondary" size="sm">Log in</Link>
                </p>
            </div>
        </div>
    );
}

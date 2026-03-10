"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" color="primary" />
            </div>
        );
    }

    return <>{children}</>;
}

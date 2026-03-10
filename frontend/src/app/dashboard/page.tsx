"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client/core";
import { Button, Card, CardHeader, CardBody, Skeleton, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Textarea } from "@heroui/react";
import { Plus, ListTodo, Globe } from "lucide-react";
import { useState } from "react";

import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";

const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      description
      endpoints {
        id
      }
    }
  }
`;

const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $description: String) {
    createProject(name: $name, description: $description) {
      id
      name
      description
      endpoints {
        id
      }
    }
  }
`;

export default function DashboardPage() {
    const { data, loading, error, refetch } = useQuery(GET_PROJECTS);
    const router = useRouter();
    const client = useApolloClient();

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [createProject, { loading: creating }] = useMutation(CREATE_PROJECT, {
        onCompleted: () => {
            refetch();
            setName("");
            setDescription("");
            onOpenChange(); // Toggle modal close
        }
    });

    const handleLogout = () => {
        localStorage.removeItem("token");
        client.clearStore();
        router.push("/login");
    };

    const handleCreate = () => {
        if (!name) return;
        createProject({ variables: { name, description } });
    }

    let content = null;

    if (loading) {
        content = Array(3).fill(0).map((_, i) => (
            <Card key={i} className="bg-content1/50">
                <CardHeader className="flex gap-3">
                    <Skeleton className="rounded-lg w-12 h-12" />
                    <div className="flex flex-col gap-2 w-full">
                        <Skeleton className="h-4 w-3/5 rounded-lg" />
                        <Skeleton className="h-3 w-4/5 rounded-lg" />
                    </div>
                </CardHeader>
                <CardBody>
                    <Skeleton className="h-8 w-full rounded-lg" />
                </CardBody>
            </Card>
        ));
    } else if (error) {
        content = (
            <div className="col-span-3 text-center text-danger py-12">
                Failed to load projects. Make sure the backend is running.
            </div>
        );
    } else if (data && (data as any).projects.length === 0) {
        content = (
            <div className="col-span-3 border border-dashed border-divider rounded-3xl p-12 text-center text-default-500 flex flex-col items-center">
                <ListTodo className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg">No projects found.</p>
                <p className="text-sm">Create your first project to start mocking APIs.</p>
            </div>
        );
    } else if (data) {
        content = (data as any).projects.map((proj: any) => (
            <Card key={proj.id} isPressable onPress={() => router.push(`/dashboard/project/${proj.id}`)} className="bg-content1/50 border border-divider hover:-translate-y-1 transition-transform">
                <CardHeader className="flex gap-4 p-6 pb-2">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <Globe className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col text-left">
                        <p className="text-md font-bold">{proj.name}</p>
                        <p className="text-small text-default-500">{proj.description}</p>
                    </div>
                </CardHeader>
                <CardBody className="px-6 pb-6 pt-4">
                    <div className="flex items-center justify-between bg-default-100 rounded-lg p-3">
                        <span className="text-sm font-medium">Endpoints</span>
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                            {proj.endpoints.length} active
                        </span>
                    </div>
                </CardBody>
            </Card>
        ));
    }

    return (
        <AuthGuard>
            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                        <p className="text-default-500">Manage all your mock API projects.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button color="danger" variant="flat" onPress={handleLogout}>
                            Sign Out
                        </Button>
                        <Button color="primary" variant="shadow" onPress={onOpen} startContent={<Plus className="h-4 w-4" />}>
                            New Project
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {content}
                </div>

                <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">Create Project</ModalHeader>
                        <ModalBody>
                            <Input
                                autoFocus
                                label="Project Name"
                                placeholder="Enter project name"
                                variant="bordered"
                                value={name}
                                onValueChange={setName}
                            />
                            <Textarea
                                label="Description"
                                placeholder="Briefly describe this project"
                                variant="bordered"
                                value={description}
                                onValueChange={setDescription}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="flat" onPress={onOpenChange}>
                                Cancel
                            </Button>
                            <Button color="primary" onPress={handleCreate} isLoading={creating}>
                                Create
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </AuthGuard>
    );
}

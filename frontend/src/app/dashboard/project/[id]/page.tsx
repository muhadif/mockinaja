"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client/core";
import { Button, Card, CardHeader, CardBody, Skeleton, Input, Textarea, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { ArrowLeft, Save, Trash2, Globe, Trash, Plus, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import AuthGuard from "@/components/AuthGuard";

const GET_PROJECT = gql`
  query GetProject($id: String!) {
    project(id: $id) {
      id
      name
      description
      endpoints {
        id
        method
        path
        statusCode
      }
    }
  }
`;

const EDIT_PROJECT = gql`
  mutation EditProject($id: String!, $name: String, $description: String) {
    editProject(id: $id, name: $name, description: $description) {
      id
      name
      description
    }
  }
`;

const DELETE_PROJECT = gql`
  mutation DeleteProject($id: String!) {
    deleteProject(id: $id)
  }
`;

export default function ProjectDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data, loading, error, refetch } = useQuery(GET_PROJECT, {
        variables: { id },
        fetchPolicy: "network-only"
    });

    const [editProject, { loading: saving }] = useMutation(EDIT_PROJECT);
    const [deleteProject, { loading: deleting }] = useMutation(DELETE_PROJECT);

    const { isOpen, onOpen, onOpenChange } = useDisclosure(); // for delete modal

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (data?.project) {
            setName(data.project.name);
            setDescription(data.project.description || "");
        }
    }, [data]);

    const handleSave = () => {
        editProject({
            variables: { id, name, description },
            onCompleted: () => refetch()
        });
    };

    const handleDelete = () => {
        deleteProject({
            variables: { id },
            onCompleted: () => {
                onOpenChange(); // Close modal
                router.push("/dashboard");
            }
        });
    };

    const [baseUrl, setBaseUrl] = useState("http://localhost:3000");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
        }
    }, []);

    if (loading && !data) {
        return (
            <AuthGuard>
                <div className="max-w-5xl mx-auto px-8 py-12">
                    <Skeleton className="h-10 w-32 mb-8 rounded-lg" />
                    <Skeleton className="h-40 w-full rounded-2xl" />
                </div>
            </AuthGuard>
        );
    }

    if (error || !data?.project) {
        return (
            <AuthGuard>
                <div className="max-w-5xl mx-auto px-8 py-12 text-center text-danger">
                    <p>Failed to load project details.</p>
                    <Button color="primary" variant="light" onPress={() => router.push("/dashboard")} className="mt-4">
                        Back to Dashboard
                    </Button>
                </div>
            </AuthGuard>
        );
    }

    const { project } = data;

    return (
        <AuthGuard>
            <div className="max-w-5xl mx-auto px-8 py-12">
                <Button variant="light" startContent={<ArrowLeft className="h-4 w-4" />} onPress={() => router.push("/dashboard")} className="mb-8">
                    Back to Projects
                </Button>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
                    <Button color="danger" variant="flat" startContent={<Trash2 className="h-4 w-4" />} onPress={onOpen}>
                        Delete Project
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* General Settings */}
                    <Card className="col-span-2 bg-content1/50 border border-divider">
                        <CardHeader className="p-6 pb-2">
                            <h2 className="text-xl font-bold">General Information</h2>
                        </CardHeader>
                        <CardBody className="p-6 gap-4">
                            <Input
                                label="Project Name"
                                value={name}
                                onValueChange={setName}
                                variant="bordered"
                            />
                            <Textarea
                                label="Description"
                                value={description}
                                onValueChange={setDescription}
                                variant="bordered"
                            />
                            <div className="flex justify-end mt-4">
                                <Button color="primary" onPress={handleSave} isLoading={saving} startContent={!saving && <Save className="h-4 w-4" />}>
                                    Save Changes
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Stats / Overview */}
                    <Card className="bg-primary/5 border border-primary/20 shadow-none">
                        <CardHeader className="p-6 pb-2">
                            <h2 className="text-xl font-bold text-primary">Overview</h2>
                        </CardHeader>
                        <CardBody className="p-6 pt-2">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="text-sm text-default-500 mb-1">Total Endpoints</p>
                                    <p className="text-3xl font-black">{project.endpoints.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-default-500 mb-1">Project ID</p>
                                    <p className="text-xs font-mono bg-default-100 p-2 rounded-md break-all">{project.id}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Mock Endpoints Section */}
                <div className="mt-12 flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Mock Endpoints</h2>
                        <p className="text-default-500 text-sm">Create and manage API endpoints for this project.</p>
                    </div>
                    <Button color="primary" startContent={<Plus className="h-4 w-4" />} onPress={() => router.push(`/dashboard/project/${id}/endpoint/new`)}>
                        New Endpoint
                    </Button>
                </div>

                {project.endpoints.length === 0 ? (
                    <div className="border border-dashed border-divider rounded-3xl p-12 text-center text-default-500 flex flex-col items-center">
                        <Globe className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg">No endpoints yet.</p>
                        <p className="text-sm text-default-400">Click "New Endpoint" to add your first mock.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {project.endpoints.map((ep: any) => {
                            const formattedPath = ep.path.startsWith('/') ? ep.path : `/${ep.path}`;
                            const curlCommand = `curl -X ${ep.method} ${baseUrl}/mock/${id}${formattedPath}`;
                            return (
                                <Card key={ep.id} className="bg-content1/50 border border-divider hover:-translate-y-1 transition-transform text-left">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        className="w-full h-full cursor-pointer outline-none"
                                        onClick={() => router.push(`/dashboard/project/${id}/endpoint/${ep.id}`)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                router.push(`/dashboard/project/${id}/endpoint/${ep.id}`);
                                            }
                                        }}
                                    >
                                        <CardBody className="p-4 flex flex-row items-center gap-4">
                                            <div className={`px-2 py-1 flex-shrink-0 rounded text-xs font-bold ${ep.method === 'GET' ? 'bg-blue-500/20 text-blue-500' :
                                                ep.method === 'POST' ? 'bg-green-500/20 text-green-500' :
                                                    ep.method === 'PUT' ? 'bg-orange-500/20 text-orange-500' :
                                                        ep.method === 'DELETE' ? 'bg-danger/20 text-danger' :
                                                            'bg-default-200 text-default-600'
                                                }`}>
                                                {ep.method}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="truncate font-mono text-sm">{ep.path}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onClick={(e: any) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(curlCommand);
                                                    }}
                                                    title="Copy as cURL"
                                                >
                                                    <Copy className="h-4 w-4 text-default-500" />
                                                </Button>
                                                <div className={`px-2 py-1 rounded-full text-xs font-bold w-12 text-center ${ep.statusCode >= 200 && ep.statusCode < 300 ? 'bg-success/20 text-success' :
                                                    ep.statusCode >= 400 ? 'bg-danger/20 text-danger' :
                                                        'bg-warning/20 text-warning'
                                                    }`}>
                                                    {ep.statusCode}
                                                </div>
                                            </div>
                                        </CardBody>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                    <ModalContent>
                        <ModalHeader className="flex gap-2 items-center text-danger">
                            <Trash className="h-5 w-5" /> Confirm Deletion
                        </ModalHeader>
                        <ModalBody>
                            <p>Are you absolutely sure you want to delete <strong>{project.name}</strong>?</p>
                            <p className="text-sm text-default-500">This action cannot be undone. All mock endpoints associated with this project will be permanently removed.</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={onOpenChange}>
                                Cancel
                            </Button>
                            <Button color="danger" onPress={handleDelete} isLoading={deleting}>
                                Yes, delete project
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </AuthGuard>
    );
}

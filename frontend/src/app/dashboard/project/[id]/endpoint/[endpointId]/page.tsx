"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client/core";
import { Button, Card, CardHeader, CardBody, Input, Textarea, Select, SelectItem, Skeleton, Divider } from "@heroui/react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import AuthGuard from "@/components/AuthGuard";

const GET_MOCK_ENDPOINT = gql`
  query GetMockEndpoint($id: String!) {
    mockEndpoint(id: $id) {
      id
      path
      method
      statusCode
      responseHeaders
      delayMs
      rateLimitTokens
      rateLimitWindow
      authHeader
    }
  }
`;

const CREATE_MOCK_ENDPOINT = gql`
  mutation CreateMockEndpoint(
    $projectId: String!
    $path: String!
    $method: String!
    $statusCode: Int!
    $responseHeaders: String
    $responseBody: String
    $delayMs: Int
    $rateLimitTokens: Int
    $rateLimitWindow: Int
    $authHeader: String
  ) {
    createMockEndpoint(
      projectId: $projectId
      path: $path
      method: $method
      statusCode: $statusCode
      responseHeaders: $responseHeaders
      responseBody: $responseBody
      delayMs: $delayMs
      rateLimitTokens: $rateLimitTokens
      rateLimitWindow: $rateLimitWindow
      authHeader: $authHeader
    ) {
      id
    }
  }
`;

const EDIT_MOCK_ENDPOINT = gql`
  mutation EditMockEndpoint(
    $id: String!
    $path: String
    $method: String
    $statusCode: Int
    $responseHeaders: String
    $responseBody: String
    $delayMs: Int
    $rateLimitTokens: Int
    $rateLimitWindow: Int
    $authHeader: String
  ) {
    editMockEndpoint(
      id: $id
      path: $path
      method: $method
      statusCode: $statusCode
      responseHeaders: $responseHeaders
      responseBody: $responseBody
      delayMs: $delayMs
      rateLimitTokens: $rateLimitTokens
      rateLimitWindow: $rateLimitWindow
      authHeader: $authHeader
    ) {
      id
    }
  }
`;

const DELETE_MOCK_ENDPOINT = gql`
  mutation DeleteMockEndpoint($id: String!) {
    deleteMockEndpoint(id: $id)
  }
`;

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function EndpointBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const endpointId = params.endpointId as string;
    const isNew = endpointId === "new";

    const { data, loading, error } = useQuery(GET_MOCK_ENDPOINT, {
        variables: { id: endpointId },
        skip: isNew,
        fetchPolicy: "network-only"
    });

    const [createEndpoint, { loading: creating }] = useMutation(CREATE_MOCK_ENDPOINT);
    const [editEndpoint, { loading: saving }] = useMutation(EDIT_MOCK_ENDPOINT);
    const [deleteEndpoint, { loading: deleting }] = useMutation(DELETE_MOCK_ENDPOINT);

    const [method, setMethod] = useState("GET");
    const [pathRef, setPathRef] = useState("/api/test");
    const [statusCode, setStatusCode] = useState("200");
    const [responseHeaders, setResponseHeaders] = useState("{\n  \"Content-Type\": \"application/json\"\n}");
    const [responseBody, setResponseBody] = useState("{\n  \"message\": \"Success\"\n}");
    const [delayMs, setDelayMs] = useState("");
    const [rateLimitTokens, setRateLimitTokens] = useState("");
    const [rateLimitWindow, setRateLimitWindow] = useState("");
    const [authHeader, setAuthHeader] = useState("");

    useEffect(() => {
        if (!isNew && data?.mockEndpoint) {
            const ep = data.mockEndpoint;
            setMethod(ep.method);
            setPathRef(ep.path);
            setStatusCode(ep.statusCode.toString());
            setResponseHeaders(ep.responseHeaders || "");
            setResponseBody(ep.responseBody || "");
            setDelayMs(ep.delayMs ? ep.delayMs.toString() : "");
            setRateLimitTokens(ep.rateLimitTokens ? ep.rateLimitTokens.toString() : "");
            setRateLimitWindow(ep.rateLimitWindow ? ep.rateLimitWindow.toString() : "");
            setAuthHeader(ep.authHeader || "");
        }
    }, [data, isNew]);

    const handleSave = () => {
        const variables: any = {
            path: pathRef,
            method,
            statusCode: parseInt(statusCode),
            responseHeaders,
            responseBody,
            delayMs: delayMs ? parseInt(delayMs) : null,
            rateLimitTokens: rateLimitTokens ? parseInt(rateLimitTokens) : null,
            rateLimitWindow: rateLimitWindow ? parseInt(rateLimitWindow) : null,
            authHeader,
        };

        if (isNew) {
            createEndpoint({
                variables: { projectId, ...variables },
                onCompleted: () => router.push(`/dashboard/project/${projectId}`)
            });
        } else {
            editEndpoint({
                variables: { id: endpointId, ...variables },
                onCompleted: () => router.push(`/dashboard/project/${projectId}`)
            });
        }
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this endpoint?")) {
            deleteEndpoint({
                variables: { id: endpointId },
                onCompleted: () => router.push(`/dashboard/project/${projectId}`)
            });
        }
    };

    if (loading && !isNew) {
        return (
            <AuthGuard>
                <div className="max-w-4xl mx-auto px-8 py-12">
                    <Skeleton className="h-8 w-32 mb-8" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
            </AuthGuard>
        );
    }

    if (error && !isNew) {
        return (
            <AuthGuard>
                <div className="max-w-4xl mx-auto px-8 py-12 text-center text-danger">
                    <p>Failed to load endpoint details.</p>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className="max-w-4xl mx-auto px-8 py-12">
                <Button variant="light" startContent={<ArrowLeft className="h-4 w-4" />} onPress={() => router.push(`/dashboard/project/${projectId}`)} className="mb-8">
                    Back to Project
                </Button>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isNew ? "Create Endpoint" : "Edit Endpoint"}
                    </h1>
                    {!isNew && (
                        <Button color="danger" variant="flat" startContent={<Trash2 className="h-4 w-4" />} onPress={handleDelete} isLoading={deleting}>
                            Delete
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-8">
                    <Card className="bg-content1/50 border border-divider">
                        <CardHeader className="p-6 pb-2">
                            <h2 className="text-xl font-bold">Request Matching</h2>
                        </CardHeader>
                        <CardBody className="p-6 gap-6 pt-2">
                            <div className="flex flex-col md:flex-row gap-4">
                                <Select
                                    label="Method"
                                    placeholder="Select Method"
                                    selectedKeys={[method]}
                                    onChange={(e) => setMethod(e.target.value)}
                                    className="md:w-1/3"
                                    variant="bordered"
                                >
                                    {HTTP_METHODS.map((m) => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </Select>
                                <Input
                                    label="Path"
                                    placeholder="/api/users"
                                    value={pathRef}
                                    onValueChange={setPathRef}
                                    className="flex-1"
                                    variant="bordered"
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="bg-content1/50 border border-divider">
                        <CardHeader className="p-6 pb-2">
                            <h2 className="text-xl font-bold">Response Configuration</h2>
                        </CardHeader>
                        <CardBody className="p-6 gap-6 pt-2">
                            <Input
                                label="Status Code"
                                type="number"
                                placeholder="200"
                                value={statusCode}
                                onValueChange={setStatusCode}
                                className="w-1/3"
                                variant="bordered"
                            />

                            <Textarea
                                label="Response Headers (JSON)"
                                placeholder='{"Content-Type": "application/json"}'
                                value={responseHeaders}
                                onValueChange={setResponseHeaders}
                                minRows={3}
                                variant="bordered"
                                className="font-mono"
                            />

                            <Textarea
                                label="Response Body"
                                placeholder='{"status": "ok"}'
                                value={responseBody}
                                onValueChange={setResponseBody}
                                minRows={6}
                                variant="bordered"
                                className="font-mono text-sm leading-relaxed"
                                description="Supports dynamic faker tags like {name}, {uuid}, etc."
                            />
                        </CardBody>
                    </Card>

                    <Card className="bg-primary/5 border border-primary/20 shadow-none">
                        <CardHeader className="p-6 pb-2">
                            <h2 className="text-xl font-bold text-primary">Advanced Simulation</h2>
                        </CardHeader>
                        <CardBody className="p-6 gap-6 pt-2">
                            <Input
                                label="Required Authorization Header"
                                placeholder="e.g. Bearer my-secret-token"
                                value={authHeader}
                                onValueChange={setAuthHeader}
                                variant="bordered"
                                description="If set, simulating clients must provide this exact Authorization header to avoid a 401 Unauthorized."
                            />

                            <Divider />

                            <Input
                                label="Simulated Delay (ms)"
                                type="number"
                                placeholder="e.g. 500"
                                value={delayMs}
                                onValueChange={setDelayMs}
                                variant="bordered"
                                description="Adds artificial latency to the response."
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Rate Limit Tokens"
                                    type="number"
                                    placeholder="e.g. 10"
                                    value={rateLimitTokens}
                                    onValueChange={setRateLimitTokens}
                                    variant="bordered"
                                    description="Number of requests allowed."
                                />
                                <Input
                                    label="Rate Limit Window (seconds)"
                                    type="number"
                                    placeholder="e.g. 60"
                                    value={rateLimitWindow}
                                    onValueChange={setRateLimitWindow}
                                    variant="bordered"
                                    description="Time window for rate limit tokens."
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <div className="flex justify-end pt-4 pb-12">
                        <Button
                            color="primary"
                            size="lg"
                            className="w-full md:w-auto px-12"
                            startContent={!creating && !saving && <Save className="h-5 w-5" />}
                            isLoading={creating || saving}
                            onPress={handleSave}
                        >
                            {isNew ? "Create Endpoint" : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}

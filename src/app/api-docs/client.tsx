/**
 * Purpose: Interactive API documentation at /api-docs
 * Responsibility: Render a self-contained OpenAPI explorer for local API routes
 * Important Notes:
 *   - Client component because it fetches and expands interactive API docs
 *   - Uses the local /api/api-spec endpoint
 */

"use client";

import { useState, useCallback } from "react";

// ===== Types =====
export interface ApiSpec {
  openapi: string;
  info: { title: string; version: string; description: string };
  servers: { url: string; description: string }[];
  tags: { name: string; description: string }[];
  paths: Record<string, Record<string, EndpointInfo>>;
  components?: {
    securitySchemes?: Record<string, SecurityScheme>;
    schemas?: Record<string, SchemaInfo>;
  };
}

interface EndpointInfo {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  security?: Record<string, unknown>[];
  requestBody?: {
    required?: boolean;
    content: Record<string, { schema: SchemaRef; example?: unknown }>;
  };
  responses: Record<string, ResponseInfo>;
}

interface ResponseInfo {
  description: string;
  content?: Record<string, { schema: SchemaRef }>;
}

interface SchemaRef {
  $ref?: string;
  type?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  items?: SchemaRef;
  nullable?: boolean;
  example?: unknown;
  description?: string;
  format?: string;
  pattern?: string;
  enum?: string[];
}

interface SchemaProperty extends SchemaRef {
  enum?: string[];
}

interface SchemaInfo {
  type?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  example?: unknown;
  description?: string;
}

interface SecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  description?: string;
}

// ===== Helper: Resolve $ref =====
function resolveRef(ref: string, spec: ApiSpec): SchemaInfo | null {
  const parts = ref.replace("#/", "").split("/");
  let current: unknown = spec;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return current as SchemaInfo;
}

function getSchemaName(ref: string): string {
  const parts = ref.split("/");
  return parts[parts.length - 1];
}

// ===== Main Component =====

const methodColors: Record<string, string> = {
  get: "#4CAF50",
  post: "#2196F3",
  put: "#FF9800",
  patch: "#FF9800",
  delete: "#F44336",
};

export function ApiDocsClient({ initialSpec }: { initialSpec: ApiSpec }) {
  const [spec] = useState<ApiSpec>(initialSpec);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
  const [authToken, setAuthToken] = useState("");
  const [tryOutOpen, setTryOutOpen] = useState<Set<string>>(new Set());

  const toggleEndpoint = useCallback((key: string) => {
    setExpandedEndpoints((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleSchema = useCallback((name: string) => {
    setExpandedSchemas((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const toggleTryOut = useCallback((key: string) => {
    setTryOutOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Group endpoints by tag
  const tagGroups: Record<string, { path: string; method: string; info: EndpointInfo }[]> = {};
  const untagged: typeof tagGroups[string] = [];

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, info] of Object.entries(methods)) {
      const tags = info.tags || [];
      if (tags.length > 0) {
        for (const tag of tags) {
          if (!tagGroups[tag]) tagGroups[tag] = [];
          tagGroups[tag].push({ path, method, info: info as EndpointInfo });
        }
      } else {
        untagged.push({ path, method, info: info as EndpointInfo });
      }
    }
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>
          <h1 style={{ margin: 0, fontSize: 28, color: "#C2185B" }}>
            {spec.info.title}
          </h1>
          <p style={{ margin: "8px 0 0", color: "#666", fontSize: 14 }}>
            Version {spec.info.version} • Server: {spec.servers?.[0]?.url || "N/A"}
          </p>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#666" }}>🔐 Bearer Token:</span>
            <input
              type="text"
              aria-label="Bearer Token"
              placeholder="Paste access token here..."
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              style={{
                flex: 1,
                padding: "6px 10px",
                border: "1px solid #E0E0E0",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: "monospace",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 40px" }}>
        {/* Info description */}
        {spec.info.description && (
          <div style={{ ...cardStyle, marginTop: 20, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6 }}>
            {spec.info.description}
          </div>
        )}

        {/* Tag Groups */}
        {spec.tags?.map((tag) => {
          const endpoints = tagGroups[tag.name] || [];
          if (endpoints.length === 0) return null;
          return (
            <div key={tag.name} style={{ marginTop: 24 }}>
              <h2 style={{ ...tagTitleStyle, color: "#C2185B" }}>
                {tag.name}
              </h2>
              <p style={{ margin: "0 0 12px", color: "#666", fontSize: 14 }}>{tag.description}</p>
              {endpoints.map(({ path, method, info }) => {
                const key = `${method}-${path}`;
                const isExpanded = expandedEndpoints.has(key);
                return (
                  <EndpointCard
                    key={key}
                    path={path}
                    method={method}
                    info={info}
                    spec={spec}
                    isExpanded={isExpanded}
                    onToggle={() => toggleEndpoint(key)}
                    methodColor={methodColors[method] || "#999"}
                    authToken={authToken}
                    tryOutOpen={tryOutOpen.has(key)}
                    onToggleTryOut={() => toggleTryOut(key)}
                  />
                );
              })}
            </div>
          );
        })}

        {/* Untagged */}
        {untagged.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h2 style={tagTitleStyle}>Other Endpoints</h2>
            {untagged.map(({ path, method, info }) => {
              const key = `${method}-${path}`;
              const isExpanded = expandedEndpoints.has(key);
              return (
                <EndpointCard
                  key={key}
                  path={path}
                  method={method}
                  info={info}
                  spec={spec}
                  isExpanded={isExpanded}
                  onToggle={() => toggleEndpoint(key)}
                  methodColor={methodColors[method] || "#999"}
                  authToken={authToken}
                  tryOutOpen={tryOutOpen.has(key)}
                  onToggleTryOut={() => toggleTryOut(key)}
                />
              );
            })}
          </div>
        )}

        {/* Schemas Section */}
        {spec.components?.schemas && Object.keys(spec.components.schemas).length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ ...tagTitleStyle, color: "#880E4F" }}>📦 Schemas</h2>
            {Object.entries(spec.components.schemas).map(([name, schema]) => {
              const isExpanded = expandedSchemas.has(name);
              return (
                <SchemaCard
                  key={name}
                  name={name}
                  schema={schema}
                  spec={spec}
                  isExpanded={isExpanded}
                  onToggle={() => toggleSchema(name)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Endpoint Card =====
function EndpointCard({
  path,
  method,
  info,
  spec,
  isExpanded,
  onToggle,
  methodColor,
  authToken,
  tryOutOpen,
  onToggleTryOut,
}: {
  path: string;
  method: string;
  info: EndpointInfo;
  spec: ApiSpec;
  isExpanded: boolean;
  onToggle: () => void;
  methodColor: string;
  authToken: string;
  tryOutOpen: boolean;
  onToggleTryOut: () => void;
}) {
  return (
    <div style={endpointCardStyle}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          padding: "12px 16px",
          background: "none",
          border: "none",
          width: "100%",
          textAlign: "left",
          fontFamily: "inherit",
          fontSize: "inherit",
          color: "inherit",
        }}
      >
        <span
          style={{
            ...methodBadgeStyle,
            backgroundColor: methodColor,
          }}
        >
          {method.toUpperCase()}
        </span>
        <span style={{ fontFamily: "monospace", fontSize: 14, color: "#333", fontWeight: 500 }}>
          {path}
        </span>
        {info.summary && (
          <span style={{ marginLeft: "auto", color: "#666", fontSize: 13 }}>
            {info.summary}
          </span>
        )}
        <span style={{ fontSize: 12, color: "#999" }}>{isExpanded ? "▲" : "▼"}</span>
      </button>

      {isExpanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #F0F0F0" }}>
          {info.description && (
            <p style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#555", margin: "12px 0" }}>
              {info.description}
            </p>
          )}

          {info.security && (
            <div style={{ ...badgeRowStyle, backgroundColor: "#FFF3E0" }}>
              🔒 Requires Bearer Token Authentication
            </div>
          )}

          {/* Request Body */}
          {info.requestBody && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "#333" }}>
                📥 Request Body
                {info.requestBody.required && (
                  <span style={{ color: "#F44336", marginLeft: 4 }}>*required</span>
                )}
              </h4>
              {Object.entries(info.requestBody.content).map(([contentType, content]) => (
                <div key={contentType}>
                  <span style={{ fontSize: 12, color: "#999" }}>Content-Type: {contentType}</span>
                  {content.schema?.$ref && (
                    <SchemaDetail
                      name={getSchemaName(content.schema.$ref)}
                      schema={resolveRef(content.schema.$ref, spec)}
                      spec={spec}
                      depth={0}
                    />
                  )}
                  {content.schema?.properties && (
                    <PropertiesTable properties={content.schema.properties} required={content.schema.required} spec={spec} />
                  )}
                  {content.example !== undefined && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: "#999" }}>Example:</span>
                      <pre style={codeBlockStyle}>{JSON.stringify(content.example, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Responses */}
          <div style={{ marginTop: 16 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "#333" }}>📤 Responses</h4>
            {Object.entries(info.responses).map(([code, resp]) => (
              <div key={code} style={{ marginBottom: 8 }}>
                <span
                  style={{
                    ...statusCodeStyle,
                    backgroundColor: code.startsWith("2") ? "#E8F5E9" : code.startsWith("4") ? "#FFEBEE" : "#FFF3E0",
                    color: code.startsWith("2") ? "#2E7D32" : code.startsWith("4") ? "#C62828" : "#E65100",
                  }}
                >
                  {code}
                </span>
                <span style={{ fontSize: 13, color: "#555", marginLeft: 8 }}>{resp.description}</span>
                {resp.content && Object.entries(resp.content).map(([ct, content]) => (
                  <div key={ct} style={{ marginLeft: 24, marginTop: 4 }}>
                    {content.schema?.$ref && (
                      <SchemaDetail
                        name={getSchemaName(content.schema.$ref)}
                        schema={resolveRef(content.schema.$ref, spec)}
                        spec={spec}
                        depth={0}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Try It Out */}
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={onToggleTryOut}
              style={{
                ...tryButtonStyle,
                backgroundColor: tryOutOpen ? "#880E4F" : "#C2185B",
              }}
            >
              {tryOutOpen ? "✕ Close Try It Out" : "▶ Try It Out"}
            </button>
            {tryOutOpen && (
              <TryItOutSection
                path={path}
                method={method}
                authToken={authToken}
                requestBody={info.requestBody}
                requestExample={info.requestBody?.content?.["application/json"]?.example}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Try It Out Section =====
function TryItOutSection({
  path,
  method,
  authToken,
  requestBody,
  requestExample,
}: {
  path: string;
  method: string;
  authToken: string;
  requestBody?: EndpointInfo["requestBody"];
  requestExample?: unknown;
}) {
  const [body, setBody] = useState(
    requestExample ? JSON.stringify(requestExample, null, 2) : ""
  );
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const res = await fetch(path, {
        method: method.toUpperCase(),
        headers,
        body: ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) ? body : undefined,
      });

      const text = await res.text();
      let formatted: string;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        formatted = text;
      }
      setResponse({ status: res.status, body: formatted });
    } catch (err) {
      setResponse({ status: 0, body: `Error: ${err instanceof Error ? err.message : "Unknown"}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12, border: "1px solid #E0E0E0", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: 12, backgroundColor: "#F5F5F5" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <span style={{ ...methodBadgeStyle, backgroundColor: method === "get" ? "#4CAF50" : "#2196F3", fontSize: 12 }}>
            {method.toUpperCase()}
          </span>
          <code style={{ fontSize: 13, color: "#333" }}>{path}</code>
          <button
            type="button"
            onClick={execute}
            disabled={loading}
            style={{
              marginLeft: "auto",
              padding: "6px 16px",
              backgroundColor: loading ? "#ccc" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {loading ? "Sending..." : "Send ⚡"}
          </button>
        </div>

        {requestBody && (
          <div>
            <label htmlFor="request-body-textarea" style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>
              Request Body (JSON):
            </label>
            <textarea
              id="request-body-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{
                width: "100%",
                minHeight: 120,
                padding: 8,
                border: "1px solid #E0E0E0",
                borderRadius: 6,
                fontFamily: "monospace",
                fontSize: 12,
                resize: "vertical",
              }}
            />
          </div>
        )}
      </div>

      {response && (
        <div style={{ padding: 12, borderTop: "1px solid #E0E0E0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Response:</span>
            <span
              style={{
                ...statusCodeStyle,
                backgroundColor: response.status >= 200 && response.status < 300 ? "#E8F5E9" : "#FFEBEE",
                color: response.status >= 200 && response.status < 300 ? "#2E7D32" : "#C62828",
              }}
            >
              {response.status || "ERR"}
            </span>
          </div>
          <pre style={{ ...codeBlockStyle, maxHeight: 300, overflow: "auto" }}>
            {response.body}
          </pre>
        </div>
      )}
    </div>
  );
}

// ===== Schema Card =====
function SchemaCard({
  name,
  schema,
  spec,
  isExpanded,
  onToggle,
}: {
  name: string;
  schema: SchemaInfo;
  spec: ApiSpec;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={endpointCardStyle}>
      <button
        type="button"
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "10px 16px", background: "none", border: "none", width: "100%", textAlign: "left", fontFamily: "inherit", fontSize: "inherit", color: "inherit" }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#880E4F" }}>{name}</span>
        {schema.description && (
          <span style={{ color: "#666", fontSize: 12 }}>{schema.description}</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#999" }}>{isExpanded ? "▲" : "▼"}</span>
      </button>
      {isExpanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #F0F0F0" }}>
          <SchemaDetail name={name} schema={schema} spec={spec} depth={0} />
        </div>
      )}
    </div>
  );
}

// ===== Schema Detail (recursive) =====
function SchemaDetail({
  name: _name,
  schema,
  spec,
  depth,
}: {
  name: string;
  schema: SchemaInfo | null;
  spec: ApiSpec;
  depth: number;
}) {
  if (!schema) return <span style={{ color: "#999", fontSize: 12 }}>Schema not found</span>;

  return (
    <div style={{ marginLeft: depth > 0 ? 16 : 0, marginTop: 4 }}>
      {schema.properties && (
        <PropertiesTable properties={schema.properties} required={schema.required} spec={spec} />
      )}
    </div>
  );
}

// ===== Properties Table =====
function PropertiesTable({
  properties,
  required,
  spec,
}: {
  properties: Record<string, SchemaProperty>;
  required?: string[];
  spec: ApiSpec;
}) {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Field</th>
          <th style={thStyle}>Type</th>
          <th style={thStyle}>Required</th>
          <th style={thStyle}>Description</th>
          <th style={thStyle}>Example</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(properties).map(([fieldName, prop]) => {
          const isRef = prop.$ref;
          const refSchema = isRef ? resolveRef(prop.$ref!, spec) : null;
          const type = isRef ? getSchemaName(prop.$ref!) : prop.type || "any";
          const isArray = prop.type === "array";
          const displayType = isArray
            ? `array<${prop.items?.$ref ? getSchemaName(prop.items.$ref) : prop.items?.type || "any"}>`
            : type;

          return (
            <tr key={fieldName}>
              <td style={tdStyle}>
                <code style={{ fontSize: 12, color: "#880E4F" }}>{fieldName}</code>
              </td>
              <td style={tdStyle}>
                <code style={{ fontSize: 12, color: "#1565C0" }}>{displayType}</code>
                {prop.nullable && <span style={{ color: "#999", fontSize: 12 }}> (nullable)</span>}
              </td>
              <td style={tdStyle}>
                {required?.includes(fieldName) ? (
                  <span style={{ color: "#F44336", fontWeight: 600, fontSize: 12 }}>Yes</span>
                ) : (
                  <span style={{ color: "#999", fontSize: 12 }}>No</span>
                )}
              </td>
              <td style={{ ...tdStyle, fontSize: 12, color: "#555" }}>
                {prop.description || (isRef && refSchema?.description) || (prop.enum ? `Enum: ${prop.enum.join(" | ")}` : "")}
                {prop.format && <span style={{ color: "#999" }}> ({prop.format})</span>}
                {prop.pattern && <span style={{ color: "#999" }}> pattern: {prop.pattern}</span>}
              </td>
              <td style={tdStyle}>
                {prop.example !== undefined && (
                  <code style={{ fontSize: 12, color: "#666" }}>{String(prop.example)}</code>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ===== Styles =====
const pageStyle: React.CSSProperties = {
  fontFamily: "'Noto Sans Devanagari', 'Inter', sans-serif",
  backgroundColor: "#FAFAFA",
  minHeight: "100vh",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderBottom: "2px solid #C2185B",
  boxShadow: "0 2px 8px rgba(194,24,91,0.1)",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: 8,
  border: "1px solid #E0E0E0",
  padding: 16,
};

const tagTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  margin: "0 0 4px",
  paddingBottom: 8,
  borderBottom: "2px solid #F48FB1",
};

const endpointCardStyle: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: 8,
  border: "1px solid #E0E0E0",
  marginBottom: 8,
  overflow: "hidden",
  transition: "box-shadow 0.2s",
};

const methodBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "3px 10px",
  borderRadius: 4,
  color: "white",
  fontWeight: 700,
  fontSize: 12,
  fontFamily: "monospace",
  letterSpacing: 0.5,
  minWidth: 52,
  textAlign: "center",
};

const statusCodeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 4,
  fontWeight: 600,
  fontSize: 12,
};

const tryButtonStyle: React.CSSProperties = {
  padding: "6px 16px",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const badgeRowStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  fontSize: 13,
  marginTop: 8,
};

const codeBlockStyle: React.CSSProperties = {
  backgroundColor: "#1E1E1E",
  color: "#D4D4D4",
  padding: 12,
  borderRadius: 6,
  fontSize: 12,
  fontFamily: "monospace",
  overflow: "auto",
  margin: "8px 0 0",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
  marginTop: 8,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 10px",
  backgroundColor: "#F5F5F5",
  borderBottom: "2px solid #E0E0E0",
  fontSize: 12,
  color: "#666",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderBottom: "1px solid #F0F0F0",
  verticalAlign: "top",
};

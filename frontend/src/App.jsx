import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8080/api/v1";

const palette = {
  bg: "#0A0A0F",
  card: "#111118",
  border: "#1C1C28",
  green: "#00FF87",
  red: "#FF4444",
  orange: "#F5A623",
  muted: "#8B8FA8",
  white: "#E8E8F0",
};

function useFetch(url, interval = 5000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(() => {
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(setError);
  }, [url]);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, interval);
    return () => clearInterval(id);
  }, [fetch_, interval]);

  return { data, error };
}

function StatusLED({ status }) {
  const color =
    status === "ONLINE"
      ? palette.green
      : status === "ALERT"
      ? palette.orange
      : palette.red;

  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}`,
        animation: status === "ONLINE" ? "none" : "blink 1.2s ease-in-out infinite",
        flexShrink: 0,
      }}
    />
  );
}

function MetricBar({ label, value, unit = "%" }) {
  const capped = Math.min(value ?? 0, 100);
  const color =
    capped >= 90 ? palette.red : capped >= 75 ? palette.orange : palette.green;
  const pulse = capped >= 80;

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: palette.muted,
          letterSpacing: "0.04em",
        }}
      >
        <span>{label}</span>
        <span style={{ color: capped >= 80 ? color : palette.white, fontWeight: 600 }}>
          {value != null ? `${value.toFixed(1)}${unit}` : "—"}
        </span>
      </div>
      <div
        style={{
          height: 3,
          background: palette.border,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${capped}%`,
            background: color,
            borderRadius: 2,
            boxShadow: pulse ? `0 0 8px ${color}` : "none",
            animation: pulse ? "pulse 1.8s ease-in-out infinite" : "none",
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

function ServerCard({ server, onClick, isSelected }) {
  const { data: metrics } = useFetch(`${API}/servers/${server.id}/metrics`, 6000);
  const { data: alerts } = useFetch(`${API}/servers/${server.id}/alerts`, 6000);

  const latest = metrics?.[0];
  const activeAlerts = alerts?.filter((a) => !a.resolved) ?? [];

  const lastSeenMs = server.lastSeen ? Date.now() - new Date(server.lastSeen).getTime() : null;
  const lastSeenLabel =
    lastSeenMs == null
      ? "never"
      : lastSeenMs < 10000
      ? "just now"
      : lastSeenMs < 60000
      ? `${Math.floor(lastSeenMs / 1000)}s ago`
      : lastSeenMs < 3600000
      ? `${Math.floor(lastSeenMs / 60000)}m ago`
      : `${Math.floor(lastSeenMs / 3600000)}h ago`;

  return (
    <div
      onClick={onClick}
      style={{
        background: palette.card,
        border: `1px solid ${isSelected ? palette.green + "60" : palette.border}`,
        borderRadius: 8,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: isSelected ? `0 0 0 1px ${palette.green}30` : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <StatusLED status={server.status} />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: palette.white,
            letterSpacing: "0.02em",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {server.hostname}
        </span>
        {activeAlerts.length > 0 && (
          <span
            style={{
              background: palette.red + "20",
              color: palette.red,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
              border: `1px solid ${palette.red}40`,
            }}
          >
            {activeAlerts.length} ALERT{activeAlerts.length > 1 ? "S" : ""}
          </span>
        )}
      </div>

      {/* Metrics */}
      <MetricBar label="CPU" value={latest?.cpuUsage} />
      <MetricBar label="RAM" value={latest?.ramUsage} />
      <MetricBar label="DISK" value={latest?.diskUsage} />

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 12,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: palette.muted,
        }}
      >
        <span>{server.ip ?? "—"}</span>
        <span>{lastSeenLabel}</span>
      </div>
    </div>
  );
}

function AlertRow({ alert, onResolve }) {
  const severityColor = alert.severity === "CRITICAL" ? palette.red : palette.orange;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderBottom: `1px solid ${palette.border}`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
      }}
    >
      <span
        style={{
          color: severityColor,
          fontWeight: 700,
          fontSize: 10,
          minWidth: 60,
          letterSpacing: "0.06em",
        }}
      >
        {alert.severity}
      </span>
      <span style={{ color: palette.muted, minWidth: 80, fontSize: 11 }}>
        {alert.hostname}
      </span>
      <span style={{ color: palette.white, flex: 1, fontSize: 11 }}>{alert.message}</span>
      <button
        onClick={() => onResolve(alert.id)}
        style={{
          background: "transparent",
          border: `1px solid ${palette.border}`,
          color: palette.muted,
          padding: "3px 10px",
          borderRadius: 4,
          cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.04em",
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = palette.green;
          e.target.style.color = palette.green;
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = palette.border;
          e.target.style.color = palette.muted;
        }}
      >
        resolve
      </button>
    </div>
  );
}

function MetricHistory({ serverId }) {
  const { data: metrics } = useFetch(`${API}/servers/${serverId}/metrics`, 6000);

  if (!metrics || metrics.length === 0) return null;

  const recent = metrics.slice(0, 20).reverse();

  const MiniChart = ({ field, label, color }) => {
    const vals = recent.map((m) => m[field] ?? 0);
    const max = Math.max(...vals, 1);
    const w = 200;
    const h = 40;

    const points = vals
      .map((v, i) => {
        const x = (i / (vals.length - 1)) * w;
        const y = h - (v / max) * h;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: palette.muted,
            marginBottom: 4,
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </div>
        <svg width={w} height={h} style={{ overflow: "visible" }}>
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.8}
          />
          {vals.length > 0 && (
            <circle
              cx={(vals.length - 1) / (vals.length - 1) * w}
              cy={h - (vals[vals.length - 1] / max) * h}
              r={3}
              fill={color}
            />
          )}
        </svg>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color,
            marginTop: 2,
          }}
        >
          {vals[vals.length - 1]?.toFixed(1)}%
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: palette.muted,
          letterSpacing: "0.1em",
          marginBottom: 14,
        }}
      >
        LAST {recent.length} READINGS
      </div>
      <MiniChart field="cpuUsage" label="CPU" color={palette.green} />
      <MiniChart field="ramUsage" label="RAM" color="#7C83FF" />
      <MiniChart field="diskUsage" label="DISK" color={palette.orange} />
      {metrics[0]?.temperature > 0 && (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: palette.muted,
            marginTop: 8,
          }}
        >
          TEMP{" "}
          <span style={{ color: palette.white }}>{metrics[0].temperature?.toFixed(1)}°C</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { data: servers } = useFetch(`${API}/servers`, 6000);
  const { data: allAlerts } = useFetch(`${API}/alerts`, 6000);
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const resolveAlert = async (id) => {
    await fetch(`${API}/alerts/${id}/resolve`, { method: "PATCH" });
  };

  const online = servers?.filter((s) => s.status === "ONLINE").length ?? 0;
  const offline = servers?.filter((s) => s.status === "OFFLINE").length ?? 0;
  const alertCount = allAlerts?.length ?? 0;
  const selectedServer = servers?.find((s) => s.id === selected);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: ${palette.bg};
          color: ${palette.white};
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${palette.bg}; }
        ::-webkit-scrollbar-thumb { background: ${palette.border}; border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header
          style={{
            borderBottom: `1px solid ${palette.border}`,
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            background: palette.bg,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: palette.green,
                boxShadow: `0 0 10px ${palette.green}`,
              }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: palette.white,
              }}
            >
              SENTINELA
            </span>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "ONLINE", value: online, color: palette.green },
              { label: "OFFLINE", value: offline, color: palette.red },
              { label: "ALERTS", value: alertCount, color: palette.orange },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 18,
                    fontWeight: 700,
                    color: value > 0 && label !== "ONLINE" ? color : label === "ONLINE" && value > 0 ? color : palette.muted,
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    color: palette.muted,
                    letterSpacing: "0.1em",
                    marginTop: 2,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: palette.muted,
            }}
          >
            {new Date(now).toLocaleTimeString()}
          </div>
        </header>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Main grid */}
          <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
            {!servers && (
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: palette.muted,
                  textAlign: "center",
                  marginTop: 60,
                }}
              >
                connecting to api...
              </div>
            )}

            {servers?.length === 0 && (
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: palette.muted,
                  textAlign: "center",
                  marginTop: 60,
                }}
              >
                no servers reporting yet — deploy an agent to get started
              </div>
            )}

            {servers && servers.length > 0 && (
              <>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: palette.muted,
                    letterSpacing: "0.1em",
                    marginBottom: 16,
                  }}
                >
                  {servers.length} SERVER{servers.length !== 1 ? "S" : ""} REGISTERED
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 12,
                    marginBottom: 32,
                  }}
                >
                  {servers.map((s) => (
                    <ServerCard
                      key={s.id}
                      server={s}
                      onClick={() => setSelected(selected === s.id ? null : s.id)}
                      isSelected={selected === s.id}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Alerts section */}
            {allAlerts && allAlerts.length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: palette.muted,
                    letterSpacing: "0.1em",
                    marginBottom: 12,
                  }}
                >
                  ACTIVE ALERTS
                </div>
                <div
                  style={{
                    background: palette.card,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {allAlerts.map((a) => (
                    <AlertRow key={a.id} alert={a} onResolve={resolveAlert} />
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Side panel — server detail */}
          {selectedServer && (
            <aside
              style={{
                width: 280,
                borderLeft: `1px solid ${palette.border}`,
                padding: 20,
                overflowY: "auto",
                background: palette.card,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <StatusLED status={selectedServer.status} />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: palette.white,
                  }}
                >
                  {selectedServer.hostname}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "none",
                    color: palette.muted,
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                    padding: "0 2px",
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                {[
                  ["IP", selectedServer.ip],
                  ["OS", selectedServer.operatingSystem],
                  ["STATUS", selectedServer.status],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      paddingBottom: 8,
                      borderBottom: `1px solid ${palette.border}`,
                    }}
                  >
                    <span style={{ color: palette.muted }}>{k}</span>
                    <span style={{ color: palette.white, maxWidth: 160, textAlign: "right", wordBreak: "break-all" }}>
                      {v ?? "—"}
                    </span>
                  </div>
                ))}
              </div>

              <MetricHistory serverId={selectedServer.id} />
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
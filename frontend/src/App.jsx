import { useState, useEffect, useCallback, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API = "http://localhost:8080/api/v1";
const WS_URL = "http://localhost:8080/ws";

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

function useFetch(url, interval = null) {
  const [data, setData] = useState(null);

  const fetch_ = useCallback(() => {
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [url]);

  useEffect(() => {
    fetch_();
    if (interval) {
      const id = setInterval(fetch_, interval);
      return () => clearInterval(id);
    }
  }, [fetch_, interval]);

  return [data, setData];
}

function StatusLED({ status }) {
  const color =
    status === "ONLINE" ? palette.green : status === "ALERT" ? palette.orange : palette.red;
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}`,
        flexShrink: 0,
        animation: status !== "ONLINE" ? "blink 1.2s ease-in-out infinite" : "none",
      }}
    />
  );
}

function MetricBar({ label, value }) {
  const capped = Math.min(value ?? 0, 100);
  const color = capped >= 90 ? palette.red : capped >= 75 ? palette.orange : palette.green;
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
          {value != null ? `${value.toFixed(1)}%` : "—"}
        </span>
      </div>
      <div style={{ height: 3, background: palette.border, borderRadius: 2, overflow: "hidden" }}>
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

function ServerCard({ server, latestMetric, alertCount, onClick, isSelected }) {
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
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <StatusLED status={server.status} />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: palette.white,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {server.hostname}
        </span>
        {alertCount > 0 && (
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
            {alertCount} ALERT{alertCount > 1 ? "S" : ""}
          </span>
        )}
      </div>
      <MetricBar label="CPU" value={latestMetric?.cpuUsage} />
      <MetricBar label="RAM" value={latestMetric?.ramUsage} />
      <MetricBar label="DISK" value={latestMetric?.diskUsage} />
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
  const color = alert.severity === "CRITICAL" ? palette.red : palette.orange;
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
      <span style={{ color, fontWeight: 700, fontSize: 10, minWidth: 60, letterSpacing: "0.06em" }}>
        {alert.severity}
      </span>
      <span style={{ color: palette.muted, minWidth: 80, fontSize: 11 }}>{alert.hostname}</span>
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

function MiniChart({ values, color }) {
  if (!values || values.length < 2) return null;
  const w = 220;
  const h = 40;
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");
  const last = values[values.length - 1];
  const cx = w;
  const cy = h - (last / max) * h;
  return (
    <svg width={w} height={h} style={{ overflow: "visible", display: "block" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.8}
      />
      <circle cx={cx} cy={cy} r={3} fill={color} />
    </svg>
  );
}

function ServerDetail({ server, metrics, onClose }) {
  const recent = (metrics ?? []).slice(0, 30).reverse();
  const cpuVals = recent.map((m) => m.cpuUsage ?? 0);
  const ramVals = recent.map((m) => m.ramUsage ?? 0);
  const diskVals = recent.map((m) => m.diskUsage ?? 0);
  const latest = metrics?.[0];

  return (
    <aside
      style={{
        width: 280,
        borderLeft: `1px solid ${palette.border}`,
        padding: 20,
        overflowY: "auto",
        background: palette.card,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <StatusLED status={server.status} />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: palette.white,
          }}
        >
          {server.hostname}
        </span>
        <button
          onClick={onClose}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "none",
            color: palette.muted,
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, marginBottom: 20 }}>
        {[["IP", server.ip], ["OS", server.operatingSystem], ["STATUS", server.status]].map(
          ([k, v]) => (
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
              <span
                style={{
                  color: palette.white,
                  maxWidth: 160,
                  textAlign: "right",
                  wordBreak: "break-all",
                }}
              >
                {v ?? "—"}
              </span>
            </div>
          )
        )}
      </div>

      {recent.length > 1 && (
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: palette.muted,
              letterSpacing: "0.1em",
              marginBottom: 16,
            }}
          >
            LAST {recent.length} READINGS
          </div>

          {[
            { label: "CPU", vals: cpuVals, color: palette.green },
            { label: "RAM", vals: ramVals, color: "#7C83FF" },
            { label: "DISK", vals: diskVals, color: palette.orange },
          ].map(({ label, vals, color }) => (
            <div key={label} style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: palette.muted,
                  marginBottom: 6,
                }}
              >
                <span>{label}</span>
                <span style={{ color }}>{vals[vals.length - 1]?.toFixed(1)}%</span>
              </div>
              <MiniChart values={vals} color={color} />
            </div>
          ))}

          {latest?.temperature > 0 && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: palette.muted,
                marginTop: 4,
              }}
            >
              TEMP{" "}
              <span style={{ color: palette.white }}>{latest.temperature?.toFixed(1)}°C</span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

export default function App() {
  const [servers, setServers] = useFetch(`${API}/servers`);
  const [alerts, setAlerts] = useFetch(`${API}/alerts`);
  const [metricsMap, setMetricsMap] = useState({});
  const [alertsMap, setAlertsMap] = useState({});
  const [selected, setSelected] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [wsConnected, setWsConnected] = useState(false);
  const clientRef = useRef(null);

  // Clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Load initial metrics and alerts per server
  useEffect(() => {
    if (!servers) return;
    servers.forEach((s) => {
      fetch(`${API}/servers/${s.id}/metrics`)
        .then((r) => r.json())
        .then((metrics) => setMetricsMap((prev) => ({ ...prev, [s.id]: metrics })))
        .catch(() => {});
      fetch(`${API}/servers/${s.id}/alerts`)
        .then((r) => r.json())
        .then((serverAlerts) =>
          setAlertsMap((prev) => ({
            ...prev,
            [s.id]: serverAlerts.filter((a) => !a.resolved),
          }))
        )
        .catch(() => {});
    });
  }, [servers]);

  // WebSocket
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 3000,
      onConnect: () => {
        setWsConnected(true);

        client.subscribe("/topic/metrics", (msg) => {
          const metric = JSON.parse(msg.body);
          setMetricsMap((prev) => ({
            ...prev,
            [metric.serverId]: [metric, ...(prev[metric.serverId] ?? [])].slice(0, 30),
          }));
        });

        client.subscribe("/topic/servers", (msg) => {
          const server = JSON.parse(msg.body);
          setServers((prev) => {
            if (!prev) return [server];
            const exists = prev.find((s) => s.id === server.id);
            return exists ? prev.map((s) => (s.id === server.id ? server : s)) : [...prev, server];
          });
        });

        client.subscribe("/topic/alerts", (msg) => {
          const alert = JSON.parse(msg.body);
          setAlerts((prev) => (prev ? [alert, ...prev] : [alert]));
          setAlertsMap((prev) => ({
            ...prev,
            [alert.serverId]: [alert, ...(prev[alert.serverId] ?? [])],
          }));
        });
      },
      onDisconnect: () => setWsConnected(false),
    });

    client.activate();
    clientRef.current = client;
    return () => client.deactivate();
  }, []);

  const resolveAlert = async (id) => {
    await fetch(`${API}/alerts/${id}/resolve`, { method: "PATCH" });
    setAlerts((prev) => prev?.filter((a) => a.id !== id));
    setAlertsMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = next[k].filter((a) => a.id !== id);
      });
      return next;
    });
  };

  const online = servers?.filter((s) => s.status === "ONLINE").length ?? 0;
  const offline = servers?.filter((s) => s.status === "OFFLINE").length ?? 0;
  const alertCount = alerts?.length ?? 0;
  const selectedServer = servers?.find((s) => s.id === selected);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${palette.bg}; color: ${palette.white}; font-family: 'Inter', sans-serif; min-height: 100vh; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
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
                background: wsConnected ? palette.green : palette.muted,
                boxShadow: wsConnected ? `0 0 10px ${palette.green}` : "none",
                transition: "background 0.3s",
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
                    color: value > 0 ? color : palette.muted,
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
                      latestMetric={metricsMap[s.id]?.[0]}
                      alertCount={alertsMap[s.id]?.length ?? 0}
                      onClick={() => setSelected(selected === s.id ? null : s.id)}
                      isSelected={selected === s.id}
                    />
                  ))}
                </div>
              </>
            )}

            {alerts && alerts.length > 0 && (
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
                  {alerts.map((a) => (
                    <AlertRow key={a.id} alert={a} onResolve={resolveAlert} />
                  ))}
                </div>
              </div>
            )}
          </main>

          {selectedServer && (
            <ServerDetail
              server={selectedServer}
              metrics={metricsMap[selectedServer.id]}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      </div>
    </>
  );
}
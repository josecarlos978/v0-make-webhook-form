'use client';

import { useState, useRef } from 'react';

const WEBHOOK_URL = 'https://hook.us1.make.com/ds312scu0pfuzdthhqz8rjwxz3s1jv6v';

interface LogEntry {
  timestamp: string;
  type: 'field_change' | 'submit' | 'request' | 'response' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

export default function Home() {
  const [formData, setFormData] = useState({
    nombre_cliente: '',
    email_cliente: '',
    nombre_proyecto: '',
    id_proyecto: '',
    requerimiento_imagen: '',
    webhook_url: WEBHOOK_URL,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const messagesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (type: LogEntry['type'], message: string, data?: Record<string, unknown>) => {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    };
    setLogs((prev) => [logEntry, ...prev]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    addLog('field_change', `${name} changed`, { field: name, value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addLog('submit', 'Form submission initiated');

    // Validation
    if (
      !formData.nombre_cliente.trim() ||
      !formData.email_cliente.trim() ||
      !formData.nombre_proyecto.trim() ||
      !formData.id_proyecto.trim() ||
      !formData.requerimiento_imagen.trim() ||
      !formData.webhook_url.trim()
    ) {
      const errorMsg = 'All fields are required';
      setMessage({ type: 'error', text: errorMsg });
      addLog('error', errorMsg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email_cliente)) {
      const errorMsg = 'Invalid email format';
      setMessage({ type: 'error', text: errorMsg });
      addLog('error', errorMsg);
      return;
    }

    setLoading(true);

    const payload = {
      nombre_cliente: formData.nombre_cliente,
      email_cliente: formData.email_cliente,
      nombre_proyecto: formData.nombre_proyecto,
      id_proyecto: formData.id_proyecto,
      requerimiento_imagen: formData.requerimiento_imagen,
      timestamp: new Date().toISOString(),
    };

    addLog('request', 'POST request sent', {
      url: formData.webhook_url,
      payload,
    });

    try {
      const response = await fetch(formData.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        const successMsg = '✅ Enviado correctamente a Make';
        setMessage({ type: 'success', text: successMsg });
        addLog('response', 'Success', {
          status: response.status,
          body: responseData,
        });

        if (messagesTimeoutRef.current) {
          clearTimeout(messagesTimeoutRef.current);
        }
        messagesTimeoutRef.current = setTimeout(() => {
          setMessage(null);
        }, 4000);

        setFormData({
          nombre_cliente: '',
          email_cliente: '',
          nombre_proyecto: '',
          id_proyecto: '',
          requerimiento_imagen: '',
          webhook_url: WEBHOOK_URL,
        });
      } else {
        const errorMsg = `Error ${response.status}: ${response.statusText}`;
        setMessage({ type: 'error', text: errorMsg });
        addLog('response', 'Error response', {
          status: response.status,
          body: responseData,
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      setMessage({ type: 'error', text: errorMsg });
      addLog('error', 'Request failed', {
        error: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('field_change', 'Debug logs cleared');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#ffffff', color: '#1a1a1a', padding: '20px' }}>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Inter, system-ui, -apple-system, sans-serif;
          background-color: #ffffff;
          color: #1a1a1a;
        }
        input, textarea {
          font-family: inherit;
          font-size: 14px;
        }
      `}</style>

      <main style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Prompt-Image</h1>
          <p style={{ fontSize: '16px', color: '#666' }}>Envía tu requerimiento de imagen a Make.com</p>
        </div>

        {message && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '24px',
              borderRadius: '6px',
              backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
              color: message.type === 'success' ? '#2e7d32' : '#c62828',
              border: `1px solid ${message.type === 'success' ? '#c8e6c9' : '#ffcdd2'}`,
              fontSize: '14px',
            }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="nombre_cliente" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Nombre del cliente *
            </label>
            <input
              id="nombre_cliente"
              name="nombre_cliente"
              type="text"
              required
              value={formData.nombre_cliente}
              onChange={handleChange}
              style={{
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6c63ff')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="email_cliente" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Email del cliente *
            </label>
            <input
              id="email_cliente"
              name="email_cliente"
              type="email"
              required
              value={formData.email_cliente}
              onChange={handleChange}
              style={{
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6c63ff')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="nombre_proyecto" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Nombre del proyecto *
            </label>
            <input
              id="nombre_proyecto"
              name="nombre_proyecto"
              type="text"
              required
              value={formData.nombre_proyecto}
              onChange={handleChange}
              style={{
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6c63ff')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="id_proyecto" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              ID del proyecto *
            </label>
            <input
              id="id_proyecto"
              name="id_proyecto"
              type="text"
              required
              value={formData.id_proyecto}
              onChange={handleChange}
              style={{
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6c63ff')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="requerimiento_imagen" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Requerimiento de imagen *
            </label>
            <textarea
              id="requerimiento_imagen"
              name="requerimiento_imagen"
              required
              rows={4}
              placeholder="Describe la imagen que necesitas generar..."
              value={formData.requerimiento_imagen}
              onChange={handleChange}
              style={{
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6c63ff')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="webhook_url" style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              Webhook URL *
            </label>
            <input
              id="webhook_url"
              name="webhook_url"
              type="text"
              required
              placeholder="https://hook.make.com/..."
              value={formData.webhook_url}
              onChange={handleChange}
              style={{
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6c63ff')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              marginTop: '8px',
              backgroundColor: loading ? '#ccc' : '#6c63ff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5a52d5')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6c63ff')}
          >
            {loading && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            )}
            Enviar a Make
          </button>
        </form>
      </main>

      {/* Debug Button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '50px',
          height: '50px',
          backgroundColor: '#1a1a1a',
          color: '#00ff99',
          border: 'none',
          borderRadius: '50%',
          fontSize: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 999,
        }}
        title="Toggle Debug Console"
      >
        🛠
      </button>

      {/* Debug Drawer */}
      {showDebug && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '280px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 998,
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid #333',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              backgroundColor: '#0f0f0f',
              borderBottom: '1px solid #333',
            }}
          >
            <span style={{ color: '#00ff99', fontSize: '12px', fontWeight: '600' }}>Debug Console</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={clearLogs}
                style={{
                  backgroundColor: 'transparent',
                  color: '#00ff99',
                  border: '1px solid #00ff99',
                  borderRadius: '3px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowDebug(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#00ff99',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '0 4px',
                }}
              >
                ✕
              </button>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              backgroundColor: '#0f0f0f',
              padding: '12px 16px',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#00ff99',
              lineHeight: '1.4',
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: '#666' }}>No logs yet...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} style={{ marginBottom: '8px', borderBottom: '1px solid #1a1a1a', paddingBottom: '8px' }}>
                  <div style={{ color: '#00ff99' }}>
                    [{log.timestamp}] <span style={{ color: '#ff6b6b' }}>{log.type}</span>
                  </div>
                  <div>{log.message}</div>
                  {log.data && (
                    <div style={{ color: '#888', marginTop: '4px' }}>
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

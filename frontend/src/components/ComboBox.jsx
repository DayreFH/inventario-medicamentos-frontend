import { useEffect, useMemo, useRef, useState } from 'react';

export default function ComboBox({
  items,
  value,
  onChange,
  getItemKey,
  getItemLabel,
  /** Texto usado solo para filtrar (ej. código + nombre si la etiqueta visible es solo nombre) */
  getSearchText,
  placeholder,
  inputPlaceholder,
  maxResults = 30,
  disabled = false,
  styles
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Clave estable: al cambiar solo re-render del padre (callbacks nuevos) no cambia → no se pisa el texto al escribir.
  const selectionKey =
    value == null || value === undefined
      ? null
      : getItemKey
        ? getItemKey(value)
        : value;

  useEffect(() => {
    if (value != null && value !== undefined) {
      setQuery(String(getItemLabel(value) ?? ''));
    } else {
      setQuery('');
    }
    setHighlightIndex(-1);
    // Depende de selectionKey, no de value ni de getItemLabel (evita reinicios al teclear).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionKey]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = Array.isArray(items) ? items : [];
    if (!q) return list.slice(0, maxResults);
    const res = [];
    for (const it of list) {
      const haystack = String(
        (getSearchText ? getSearchText(it) : getItemLabel(it)) || ''
      ).toLowerCase();
      if (haystack.includes(q)) {
        res.push(it);
        if (res.length >= maxResults) break;
      }
    }
    return res;
  }, [items, query, getItemLabel, getSearchText, maxResults]);

  const selectItem = (item) => {
    onChange?.(item);
    setOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === 'Escape') {
      setOpen(false);
      setHighlightIndex(-1);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min((filtered.length || 1) - 1, i + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[highlightIndex];
      if (item) selectItem(item);
    }
  };

  const baseInputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '12px',
    boxSizing: 'border-box',
    backgroundColor: disabled ? '#f8f9fa' : 'white',
    ...styles?.input
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', ...styles?.root }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={inputPlaceholder || placeholder}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          setOpen(true);
          setHighlightIndex(-1);
          // Dejar al padre quitar la selección para poder borrar y buscar otro
          if (next === '' && value != null && value !== undefined) {
            onChange?.(null);
          }
        }}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        style={baseInputStyle}
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {open && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 50,
            ...styles?.dropdown
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '10px', fontSize: '12px', color: '#6b7280' }}>
              No hay resultados
            </div>
          ) : (
            filtered.map((it, idx) => {
              const key = getItemKey ? getItemKey(it) : idx;
              const active = idx === highlightIndex;
              return (
                <div
                  key={key}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onMouseDown={(e) => {
                    // Evita blur antes de seleccionar
                    e.preventDefault();
                    selectItem(it);
                  }}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: active ? '#eff6ff' : 'white',
                    borderBottom: '1px solid #f3f4f6'
                  }}
                >
                  {getItemLabel(it)}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}


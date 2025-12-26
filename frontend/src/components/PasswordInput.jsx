import { useState } from 'react';

const PasswordInput = ({ 
  value, 
  onChange, 
  required = false, 
  placeholder = "••••••••",
  showStrength = false,
  label = "Contraseña",
  style = {}
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  // Validar fortaleza de contraseña
  const validatePassword = (password) => {
    if (!password) return { isValid: false, message: '', strength: 0 };
    
    const hasMinLength = password.length >= 8;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    
    const isValid = hasMinLength && hasLetters && hasNumbers;
    
    let strength = 0;
    if (hasMinLength) strength++;
    if (hasLetters) strength++;
    if (hasNumbers) strength++;
    
    let message = '';
    if (!hasMinLength) message = '❌ Mínimo 8 caracteres';
    else if (!hasLetters) message = '❌ Debe incluir letras';
    else if (!hasNumbers) message = '❌ Debe incluir números';
    else message = '✅ Contraseña válida';
    
    return { isValid, message, strength };
  };
  
  const validation = showStrength ? validatePassword(value) : { isValid: true, message: '', strength: 0 };
  
  return (
    <div style={{ marginBottom: '20px', ...style }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: '600', 
          color: '#374151' 
        }}>
          {label} {required && '*'}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 48px 12px 16px',
            border: showStrength && value ? 
              (validation.isValid ? '2px solid #10b981' : '2px solid #ef4444') : 
              '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s'
          }}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#334155'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
      
      {showStrength && value && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: validation.isValid ? '#10b981' : '#ef4444',
            fontWeight: '500',
            marginBottom: '6px'
          }}>
            {validation.message}
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '4px',
            height: '4px'
          }}>
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                style={{
                  flex: 1,
                  background: level <= validation.strength ? 
                    (validation.strength === 3 ? '#10b981' : 
                     validation.strength === 2 ? '#f59e0b' : '#ef4444') : 
                    '#e2e8f0',
                  borderRadius: '2px',
                  transition: 'background 0.3s'
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;


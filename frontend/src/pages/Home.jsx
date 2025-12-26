export default function Home() {
  return (
    <div style={{ 
      height: '100%',
      width: '100%',
      margin: 0,
      padding: 0,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Imagen a pantalla completa */}
      <img
        src="/welcome-hero.png"
        alt="MediLink Pro - Sistema de Gestión de Inventario"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}



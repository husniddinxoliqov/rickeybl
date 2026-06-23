export function TestModeBanner() {
  if (import.meta.env.VITE_TEST_MODE !== 'true') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'linear-gradient(90deg, #dc2626, #f59e0b)',
        color: '#fff8dc',
        padding: '10px 16px',
        textAlign: 'center',
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}
    >
      TEST MODE
    </div>
  );
}

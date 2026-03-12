export function Spacer({ width }: { width: number }) {
  return (
    <div
      style={{
        width: '1px',
        height: '24px',
        background: '#dcdce4',
        margin: `0 ${Math.max(width, 8)}px`,
        flexShrink: 0,
      }}
    />
  );
}

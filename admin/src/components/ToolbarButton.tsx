import { IconButton } from '@strapi/design-system';

export function ToolbarButton({
  onClick,
  icon,
  active,
  disabled,
  tooltip,
  marginLeft,
  hidden,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  tooltip: string;
  marginLeft?: number;
  hidden?: boolean;
}) {
  return (
    <IconButton
      label={tooltip}
      onClick={onClick}
      variant={active ? "secondary" : 'ghost'}
      marginLeft={marginLeft || 0}
      disabled={disabled}
      data-active={active}
      style={{ display: hidden ? 'none' : undefined }}
    >
      {icon}
    </IconButton>
  );
}

import { Tooltip, Button } from '@strapi/design-system';

export function ToolbarButton({
  key,
  onClick,
  icon,
  active,
  disabled,
  tooltip,
  marginLeft,
  hidden,
}: {
  key: string;
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  tooltip: string;
  marginLeft?: number;
  hidden?: boolean;
}) {
  return (
    <Tooltip key={key} description={tooltip}>
      <Button
        onClick={onClick}
        variant="tertiary"
        size="S"
        disabled={disabled}
        className={active ? 'toolbar-btn-active' : undefined}
        style={{
          marginLeft: marginLeft ? `${marginLeft}px` : undefined,
          display: hidden ? 'none' : undefined,
        }}
      >
        {icon}
      </Button>
    </Tooltip>
  );
}

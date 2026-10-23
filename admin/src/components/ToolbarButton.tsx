import React, { ReactNode } from 'react';
import { IconButton } from '@strapi/design-system';

export interface ToolbarButtonProps {
  icon: ReactNode;
  active?: boolean;
  toggle?: boolean;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
  tooltip: string;
  ariaLabel?: string;
  marginLeft?: number;
}

/**
 * Renders a toolbar icon button with tooltip, active state, and optional WCAG `aria-pressed` toggle state.
 */
export const ToolbarButton = ({
  icon,
  active,
  toggle,
  onClick,
  disabled,
  hidden,
  tooltip,
  ariaLabel,
  marginLeft,
}: ToolbarButtonProps) => (
  <IconButton
    onClick={onClick}
    disabled={disabled}
    variant={active ? 'secondary' : 'ghost'}
    marginLeft={marginLeft || 0}
    label={tooltip}
    aria-label={ariaLabel ?? tooltip}
    aria-pressed={toggle ? Boolean(active) : undefined}
    style={{ display: hidden ? 'none' : undefined }}
  >
    {icon}
  </IconButton>
);

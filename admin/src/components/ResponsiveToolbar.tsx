import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Flex, Popover, IconButton } from '@strapi/design-system';
import { More } from '@strapi/icons';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

const MORE_BUTTON_WIDTH = 40;
const ITEM_GAP = 4;

const StyledPopoverContent = styled(Popover.Content)`
  /* Above CM header (100), left menu (200) and fullscreen editor (250); below DS overlays (300) */
  z-index: 260 !important;
`;

const MeasureContainer = styled.div`
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: ${ITEM_GAP}px;
  white-space: nowrap;
`;

export interface ToolbarItem {
  id: string;
  content: React.ReactNode;
  /** Lightweight measurement node rendered in MeasureContainer instead of content */
  measureContent?: React.ReactNode;
  /** Portaled dialogs/popovers rendered once, outside measurement and overflow */
  overlay?: React.ReactNode;
}

/**
 * Responsive toolbar container that measures item widths via ResizeObserver and moves
 * overflowing items into a "More" popover menu.
 */
export const ResponsiveToolbar = ({ items }: { items: ToolbarItem[] }) => {
  const { formatMessage } = useIntl();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);

  const itemIdsKey = items.map((item) => item.id).join('\0');

  const calculate = useCallback(() => {
    const toolbar = toolbarRef.current;
    const measure = measureRef.current;
    if (!toolbar || !measure) return;

    const availableWidth = toolbar.clientWidth;
    const children = Array.from(measure.children) as HTMLElement[];

    // Check if everything fits without the "More" button
    let totalWidth = 0;
    for (let i = 0; i < children.length; i++) {
      totalWidth += children[i].offsetWidth + (i > 0 ? ITEM_GAP : 0);
    }

    if (totalWidth <= availableWidth) {
      setVisibleCount(items.length);
      return;
    }

    // Reserve space for the "More" button and find how many items fit
    const maxWidth = availableWidth - MORE_BUTTON_WIDTH - ITEM_GAP;
    let usedWidth = 0;
    let count = 0;

    for (let i = 0; i < children.length; i++) {
      const itemWidth = children[i].offsetWidth + (i > 0 ? ITEM_GAP : 0);
      if (usedWidth + itemWidth > maxWidth) break;
      usedWidth += itemWidth;
      count++;
    }

    setVisibleCount(Math.max(0, count));
  }, [items.length, itemIdsKey]);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    const measure = measureRef.current;
    if (!toolbar) return;

    calculate();

    const observer = new ResizeObserver(calculate);
    observer.observe(toolbar);
    if (measure) {
      observer.observe(measure);
      for (const child of Array.from(measure.children)) {
        observer.observe(child);
      }
    }
    return () => observer.disconnect();
  }, [calculate]);

  const visibleItems = items.slice(0, visibleCount);
  const overflowItems = items.slice(visibleCount);

  const filteredOverflowItems = overflowItems.filter(
    (item) => !item.id.toLowerCase().includes('spacer')
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Hidden container to measure all item widths */}
      <MeasureContainer ref={measureRef} aria-hidden="true" data-measure="true" {...({ inert: '' } as Record<string, string>)}>
        {items.map((item) => (
          <div key={item.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {item.measureContent ?? item.content}
          </div>
        ))}
      </MeasureContainer>
      {items.map((item) =>
        item.overlay ? (
          <React.Fragment key={`${item.id}-overlay`}>{item.overlay}</React.Fragment>
        ) : null
      )}

      {/* Visible toolbar */}
      <Flex ref={toolbarRef} gap={1} alignItems="center" width="100%">
        {visibleItems.map((item, idx) => {
          // Hide trailing spacer
          if (item.id.toLowerCase().includes('spacer') && idx === visibleItems.length - 1) {
            return null;
          }
          return <React.Fragment key={item.id}>{item.content}</React.Fragment>;
        })}

        {filteredOverflowItems.length > 0 && (
          <Popover.Root>
            <Popover.Trigger>
              <IconButton
                label={formatMessage({ id: 'tiptap-editor.more', defaultMessage: 'More' })}
                variant="ghost"
                marginLeft="auto"
              >
                <More />
              </IconButton>
            </Popover.Trigger>
            <StyledPopoverContent side="bottom" align="end" sideOffset={6}>
              <Flex gap={1} padding={2} wrap="wrap" alignItems="center">
                {filteredOverflowItems.map((item) => (
                  <React.Fragment key={item.id}>{item.content}</React.Fragment>
                ))}
              </Flex>
            </StyledPopoverContent>
          </Popover.Root>
        )}
      </Flex>
    </div>
  );
};


import { useIntl } from 'react-intl';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, IconButton, Popover } from '@strapi/design-system';
import { More } from '@strapi/icons';
import styled from 'styled-components';

export type ToolbarItem = { id: string; content: React.ReactNode };
export type ResponsiveToolbarProps = { items: ToolbarItem[] };

const MORE_BUTTON_WIDTH = 40;
const ITEM_GAP = 4;

// Fix z-index of popover
const StyledPopoverContent = styled(Popover.Content)`
  z-index: 200 !important;
`;

export function ResponsiveToolbar({ items }: ResponsiveToolbarProps) {
  const { formatMessage } = useIntl();

  const toolbarRef = useRef<HTMLDivElement>(null);
  const itemWidths = useRef<Record<string, number>>({});
  const itemsRef = useRef(items);

  const [visibleCount, setVisibleCount] = useState(items.length);

  const itemIdsKey = useMemo(() => items.map((item) => item.id).join(','), [items]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const overflowItems = useMemo(() => items.slice(visibleCount), [items, visibleCount]);
  const filteredOverflowItems = useMemo(
    () => overflowItems.filter((item) => !item.id.toLowerCase().includes('spacer')),
    [overflowItems]
  );

  // Recalculate visible items on resize
  useLayoutEffect(() => {
    if (!itemsRef.current.length) return;

    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    /**
     * Calculates how many items can fit in the toolbar based on its current width.
     */
    const calculateVisibleItems = () => {
      const currentItems = itemsRef.current;
      const availableWidth = toolbar.clientWidth;
      const { visibleCount: nextVisibleCount } = currentItems.reduce(
        (acc, itm, idx) => {
          if (acc.overflowed || !itemWidths.current[itm.id]) return acc;

          const moreWidth = idx < currentItems.length - 1 ? MORE_BUTTON_WIDTH + ITEM_GAP : 0;
          const nextWidth = acc.usedWidth + itemWidths.current[itm.id] + ITEM_GAP;

          return nextWidth + moreWidth > availableWidth
            ? { ...acc, visibleCount: idx, overflowed: true }
            : { ...acc, usedWidth: nextWidth };
        },
        { usedWidth: 0, visibleCount: currentItems.length, overflowed: false }
      );

      setVisibleCount((current) => (current === nextVisibleCount ? current : nextVisibleCount));
    };

    calculateVisibleItems();

    const observer = new ResizeObserver(calculateVisibleItems);
    observer.observe(toolbar);

    return () => observer.disconnect();
  }, [itemIdsKey]);

  // Update itemsRef if items change
  useLayoutEffect(() => {
    itemsRef.current = items;
  }, [items]);

  return (
    <Box ref={toolbarRef} width="100%">
      <Flex gap={1}>
        {visibleItems.map(({ id, content }, idx) => {
          if (id.toLowerCase().includes('spacer') && idx === visibleItems.length - 1) return null;

          return (
            <Flex
              gap={1}
              key={id}
              ref={(element: HTMLDivElement | null) => {
                if (element) itemWidths.current[id] = element.getBoundingClientRect().width;
              }}
            >
              {content}
            </Flex>
          );
        })}

        {filteredOverflowItems.length > 0 && (
          <Popover.Root>
            <Popover.Trigger>
              <IconButton label={formatMessage({ id: 'tiptap-editor.more', defaultMessage: 'More' })} variant="ghost" marginLeft="auto">
                <More />
              </IconButton>
            </Popover.Trigger>
            <StyledPopoverContent align="end">
              <Flex padding={3} gap={1} wrap="wrap" maxWidth="max(292px, 50vw)">
                {filteredOverflowItems.map(({ id, content }) => (
                  <Flex key={id} gap={1}>
                    {content}
                  </Flex>
                ))}
              </Flex>
            </StyledPopoverContent>
          </Popover.Root>
        )}
      </Flex>
    </Box>
  );
}

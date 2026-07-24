
import { useIntl } from 'react-intl';
import { useLayoutEffect, useRef, useState } from 'react';
import { Box, Flex, IconButton, Popover } from '@strapi/design-system';
import { More } from '@strapi/icons';

export type ToolbarItem = { id: string; content: React.ReactNode };
type ResponsiveToolbarProps = { items: ToolbarItem[] };

const MORE_BUTTON_WIDTH = 40;
const ITEM_GAP = 4;

export function ResponsiveToolbar({ items }: ResponsiveToolbarProps) {
  const { formatMessage } = useIntl();

  const toolbarRef = useRef<HTMLDivElement>(null);
  const itemWidths = useRef<Record<string, number>>({});
  const [visibleCount, setVisibleCount] = useState(items.length);

  // Recalculate visible items on resize
  useLayoutEffect(() => {
    if (!items) return;

    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    /**
     * Calculates how many items can fit in the toolbar based on its current width.
     */
    const calculateVisibleItems = () => {
      const availableWidth = toolbar.clientWidth;
      const { visibleCount: nextVisibleCount } = items.reduce(
        (acc, itm, idx) => {
          if (acc.overflowed || !itemWidths.current[itm.id]) return acc;

          const moreWidth = idx < items.length - 1 ? MORE_BUTTON_WIDTH + ITEM_GAP : 0;
          const nextWidth = acc.usedWidth + itemWidths.current[itm.id] + ITEM_GAP;

          return nextWidth + moreWidth > availableWidth
            ? { ...acc, visibleCount: idx, overflowed: true }
            : { ...acc, usedWidth: nextWidth };
        },
        { usedWidth: 0, visibleCount: items.length, overflowed: false }
      );

      setVisibleCount((current) => (current === nextVisibleCount ? current : nextVisibleCount));
    };

    calculateVisibleItems();

    const observer = new ResizeObserver(calculateVisibleItems);
    observer.observe(toolbar);
   
    return () => observer.disconnect();
  }, [items]);

  const visibleItems = items.slice(0, visibleCount);
  const overflowItems = items.slice(visibleCount);

  return (
    <Box ref={toolbarRef} width="100%">
      <Flex gap={1} wrap="wrap">
        {visibleItems.map((item) => (
          <Flex
            gap={1}
            key={item.id}
            ref={(element: HTMLDivElement | null) => {
              if (element) itemWidths.current[item.id] = element.getBoundingClientRect().width;
            }}
          >
            {item.content}
          </Flex>
        ))}

        {overflowItems.length > 0 && (
          <Popover.Root>
            <Popover.Trigger>
              <IconButton label={formatMessage({ id: 'tiptap-editor.more', defaultMessage: 'More' })} variant="ghost" marginLeft="auto">
                <More />
              </IconButton>
            </Popover.Trigger>
            <Popover.Content align="end">
              <Flex padding={4} gap={1} wrap="wrap" maxWidth="max(312px, 50vw)">
                {overflowItems.map((item) => (
                  <Flex key={item.id} gap={1}>{item.content}</Flex>
                ))}
              </Flex>
            </Popover.Content>
          </Popover.Root>
        )}
      </Flex>
    </Box>
  );
}

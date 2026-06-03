import { Box, Button, Divider, Flex, Tooltip, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { ThemeColorEntry } from '../../../shared/types';
import { useTheme } from 'styled-components';

interface ColorPickerPopoverProps {
  colors: ThemeColorEntry[];
  activeColor: string | undefined;
  onSelect: (color: string) => void;
  onRemove: () => void;
  showCustomColorPicker?: boolean;
  onColorInputChange: (color: string) => void;
}

export function ColorPickerPopover({
  colors,
  activeColor,
  onSelect,
  onRemove,
  showCustomColorPicker = false,
  onColorInputChange,
}: ColorPickerPopoverProps) {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  const customLabel = formatMessage({
    id: 'tiptap-editor.color.custom',
    defaultMessage: 'Custom color',
  });

  return (
    <Box padding={3} style={{ width: 280, maxHeight: 400, overflowY: 'auto' }}>
      <Button variant="tertiary" size="S" onClick={onRemove} disabled={!activeColor} fullWidth>
        {formatMessage({
          id: 'tiptap-editor.color.remove',
          defaultMessage: 'Remove color',
        })}
      </Button>

      <Box paddingTop={3} paddingBottom={3}>
        <Divider />
      </Box>

      <Typography variant="sigma" textColor="neutral600">
        {formatMessage({
          id: 'tiptap-editor.color.theme',
          defaultMessage: 'Theme colors',
        })}
      </Typography>
      <Box paddingTop={2}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(11, 24px)',
            gap: 6,
          }}
        >
          {colors.map((entry) => (
            <Tooltip key={entry.color} description={entry.label}>
              <button
                type="button"
                aria-label={entry.label}
                onClick={() => onSelect(entry.color)}
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: entry.color,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  padding: 0,
                  ...(activeColor === entry.color
                    ? { outline: `2px solid ${theme.colors.primary600}`, outlineOffset: '2px' }
                    : {}),
                }}
              />
            </Tooltip>
          ))}
        </div>
      </Box>

      {showCustomColorPicker && (
        <>
          <Box paddingTop={3} paddingBottom={3}>
            <Divider />
          </Box>
          
          <Typography variant="sigma" textColor="neutral600">
            {customLabel}
          </Typography>

          <Box paddingTop={2}>
            <Flex gap={2} alignItems="center">
              <Tooltip description={customLabel}>
                <div
                  style={{
                    position: 'relative',
                    width: 28,
                    height: 28,
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="color"
                    value={activeColor ?? '#000000'}
                    aria-label={customLabel}
                    onChange={(e) => onColorInputChange(e.target.value)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                      padding: 0,
                      border: 'none',
                    }}
                  />
                </div>
              </Tooltip>
              <Box
                background="neutral100"
                paddingLeft={2}
                paddingRight={2}
                paddingTop={1}
                paddingBottom={1}
                hasRadius
                style={{ flexGrow: 1 }}
              >
                <Flex gap={2} alignItems="center">
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: activeColor ?? '#000000',
                      border: `1px solid ${theme.colors.neutral200}`,
                      borderRadius: 3,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="pi" style={{ fontFamily: 'monospace' }}>
                    {(activeColor ?? '#000000').toUpperCase()}
                  </Typography>
                </Flex>
              </Box>
            </Flex>
          </Box>
        </>
      )}
    </Box>
  );
}

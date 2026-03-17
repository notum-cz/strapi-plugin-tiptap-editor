import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock React ───────────────────────────────────────────────────────────────
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    createElement: (type: any, props: any, ...children: any[]) => ({
      type,
      props: {
        ...props,
        children:
          children.length === 1
            ? children[0]
            : children.length > 1
              ? children
              : props?.children,
      },
    }),
  };
});

// ─── Mock @strapi/design-system ───────────────────────────────────────────────
vi.mock('@strapi/design-system', () => ({
  Tooltip: 'Tooltip',
  Button: 'Button',
}));

// ─── Mock react-intl ──────────────────────────────────────────────────────────
vi.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: (descriptor: { id?: string; defaultMessage?: string }) =>
      descriptor.defaultMessage ?? '',
  }),
}));

// ─── Import module under test ─────────────────────────────────────────────────
import { ColorPickerPopover } from '../../admin/src/components/ColorPickerPopover';
import type { ThemeColorEntry } from '../../shared/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Recursively collect all elements matching a predicate */
function findAll(element: any, predicate: (el: any) => boolean): any[] {
  if (!element || typeof element !== 'object') return [];
  const results: any[] = [];
  if (predicate(element)) results.push(element);
  const children = element.props?.children;
  if (children) {
    const childArray = Array.isArray(children) ? children : [children];
    for (const child of childArray) {
      results.push(...findAll(child, predicate));
    }
  }
  return results;
}

/** Find all elements with a given type string or component */
function findByType(element: any, type: any): any[] {
  return findAll(element, (el) => el.type === type);
}

// ─── Test data ────────────────────────────────────────────────────────────────

const SAMPLE_COLORS: ThemeColorEntry[] = [
  { label: 'Red', color: '#ff0000' },
  { label: 'Green', color: '#00ff00' },
  { label: 'Blue', color: '#0000ff' },
  { label: 'Yellow', color: '#ffff00' },
  { label: 'Purple', color: '#800080' },
  { label: 'Orange', color: '#ff6600' },
  { label: 'Pink', color: '#ff69b4' },
];

describe('ColorPickerPopover', () => {
  const onSelect = vi.fn();
  const onRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a button for each color entry', () => {
    const result = ColorPickerPopover({
      colors: SAMPLE_COLORS,
      activeColor: undefined,
      onSelect,
      onRemove,
    });
    // Find all native button elements (not Button component)
    const swatchButtons = findAll(result, (el) => el.type === 'button');
    expect(swatchButtons).toHaveLength(SAMPLE_COLORS.length);
  });

  it('each swatch button has aria-label matching color entry label', () => {
    const result = ColorPickerPopover({
      colors: SAMPLE_COLORS,
      activeColor: undefined,
      onSelect,
      onRemove,
    });
    const swatchButtons = findAll(result, (el) => el.type === 'button');
    const ariaLabels = swatchButtons.map((b: any) => b.props['aria-label']);
    expect(ariaLabels).toEqual(SAMPLE_COLORS.map((c) => c.label));
  });

  it('active swatch has outline style when activeColor matches', () => {
    const result = ColorPickerPopover({
      colors: SAMPLE_COLORS,
      activeColor: '#ff0000',
      onSelect,
      onRemove,
    });
    const swatchButtons = findAll(result, (el) => el.type === 'button');
    const activeButton = swatchButtons.find(
      (b: any) => b.props['aria-label'] === 'Red'
    );
    expect(activeButton).toBeDefined();
    expect(activeButton.props.style.outline).toBe('2px solid #4945ff');
  });

  it('no swatch has outline style when activeColor is undefined', () => {
    const result = ColorPickerPopover({
      colors: SAMPLE_COLORS,
      activeColor: undefined,
      onSelect,
      onRemove,
    });
    const swatchButtons = findAll(result, (el) => el.type === 'button');
    const hasOutline = swatchButtons.some(
      (b: any) => b.props.style?.outline !== undefined
    );
    expect(hasOutline).toBe(false);
  });

  it('clicking a swatch calls onSelect with the color string', () => {
    const result = ColorPickerPopover({
      colors: SAMPLE_COLORS,
      activeColor: undefined,
      onSelect,
      onRemove,
    });
    const swatchButtons = findAll(result, (el) => el.type === 'button');
    const blueButton = swatchButtons.find(
      (b: any) => b.props['aria-label'] === 'Blue'
    );
    expect(blueButton).toBeDefined();
    blueButton.props.onClick();
    expect(onSelect).toHaveBeenCalledWith('#0000ff');
  });

  it('remove button calls onRemove when clicked', () => {
    const result = ColorPickerPopover({
      colors: SAMPLE_COLORS,
      activeColor: undefined,
      onSelect,
      onRemove,
    });
    // Find the Button component (design system Button, not native button)
    const removeButton = findByType(result, 'Button');
    expect(removeButton).toHaveLength(1);
    removeButton[0].props.onClick();
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('grid has 6-column layout style', () => {
    const result = ColorPickerPopover({
      colors: SAMPLE_COLORS,
      activeColor: undefined,
      onSelect,
      onRemove,
    });
    // Find the grid div — it should have gridTemplateColumns set to repeat(6, 24px)
    const grids = findAll(
      result,
      (el) =>
        el.type === 'div' &&
        el.props?.style?.gridTemplateColumns === 'repeat(6, 24px)'
    );
    expect(grids).toHaveLength(1);
  });
});

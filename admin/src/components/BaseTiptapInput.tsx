import { type InputProps } from '@strapi/strapi/admin';
import { Box, Field, Flex } from '@strapi/design-system';
import { EditorContent } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import { TiptapInputStyles } from './TiptapInputStyles';
import { FieldValue } from '../utils/tiptapUtils';
import { forwardRef, useState } from 'react';

type TiptapInputProps = InputProps & {
  labelAction?: React.ReactNode;
  editor: Editor;
  field: FieldValue;
  children?: React.ReactNode;
  secondaryToolbar?: React.ReactNode;
};

const BaseTiptapInput = forwardRef<HTMLDivElement, TiptapInputProps>(
  (
    {
      hint,
      disabled = false,
      labelAction,
      label,
      name,
      required = false,
      editor,
      field,
      children,
      secondaryToolbar,
    },
    forwardedRef
  ) => {
    const [showMore, setShowMore] = useState(false);
    const borderColor = field.error ? 'danger600' : 'neutral200';
    const background = disabled ? 'neutral200' : 'neutral0';

    return (
      <Field.Root name={name} id={name} hint={hint} error={field.error} required={required}>
        <Field.Label action={labelAction}>{label}</Field.Label>

        <TiptapInputStyles>
          <Box
            className={`tiptap-editor-wrapper ${field.error ? 'has-error' : ''} ${disabled ? 'is-disabled' : ''}`}
            hasRadius
            borderColor={borderColor}
            background={background}
            paddingTop={1}
            paddingBottom={0}
            paddingLeft={0}
            paddingRight={0}
          >
            <Box className="editor-toolbar" paddingLeft={3} paddingRight={3} paddingBottom={3}>
              <Flex gap={2} wrap="wrap" alignItems="center">
                {children}
                {secondaryToolbar && (
                  <button
                    type="button"
                    className={`toolbar-more-btn ${showMore ? 'toolbar-btn-active' : ''}`}
                    onClick={() => setShowMore(!showMore)}
                    title={showMore ? 'Show less' : 'More options'}
                  >
                    •••
                  </button>
                )}
              </Flex>
              {secondaryToolbar && showMore && (
                <Box className="editor-toolbar-secondary" marginTop={2} marginLeft={-3} marginRight={-3} paddingLeft={3} paddingRight={3} paddingTop={2} paddingBottom={1} background="neutral100">
                  <Flex gap={2} wrap="wrap" alignItems="center">
                    {secondaryToolbar}
                  </Flex>
                </Box>
              )}
            </Box>
            <Box
              className="editor-content"
              background="neutral0"
              paddingTop={2}
              paddingBottom={2}
              paddingLeft={2}
              paddingRight={2}
            >
              <EditorContent editor={editor} disabled={disabled} ref={forwardedRef} />
            </Box>
          </Box>
        </TiptapInputStyles>

        <Field.Hint />
        <Field.Error />
      </Field.Root>
    );
  }
);

export default BaseTiptapInput;

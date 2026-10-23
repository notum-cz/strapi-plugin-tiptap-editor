import React from 'react';
import { Box } from '@strapi/design-system';
import styled from 'styled-components';

const StyledBox = styled(Box)`
  width: 1px;
  height: 32px;
`;

/**
 * Vertical divider spacer between toolbar groups.
 */
export const Spacer = ({ margin }: { margin: number }) => (
  <StyledBox
    marginLeft={margin}
    marginRight={margin}
    background="neutral200"
    flex="0 0 1px"
    aria-hidden="true"
  />
);

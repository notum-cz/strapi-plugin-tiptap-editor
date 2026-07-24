import { Box } from '@strapi/design-system';
import styled from 'styled-components';

const StyledBox = styled(Box)`
  width: 1px;
  align-self: stretch;

  &:last-child {
    display: none;
  }
`;

export function Spacer({ margin }: { margin: number }) {
  return <StyledBox marginLeft={margin} marginRight={margin} background="neutral200" flex="0 0 1px" />;
}

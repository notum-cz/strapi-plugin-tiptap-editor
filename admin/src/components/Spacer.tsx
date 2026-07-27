import { Box } from '@strapi/design-system';
import styled from 'styled-components';

const StyledBox = styled(Box)`
  width: 1px;
  height: 32px;
`;

export function Spacer({ margin }: { margin: number }) {
  return <StyledBox marginLeft={margin} marginRight={margin} background="neutral200" flex="0 0 1px" />;
}

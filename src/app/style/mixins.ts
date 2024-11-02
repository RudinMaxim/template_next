import { css } from 'styled-components';

export const textTruncate = (lines: number) => css`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: ${lines};
  line-clamp: ${lines};
  -webkit-box-orient: vertical;
`;

export const hoverEffect = css`
  @media (hover: hover) {
    &:hover {
      ${({ children }: { children: any }) => children}
    }
  }
`;

export const responsiveFontSize = (minSize: string, maxSize: string, minWidth = '375px', maxWidth = '1920px') => css`
  font-size: ${minSize};

  @media (min-width: ${minWidth}) {
    font-size: calc(${minSize} + (${maxSize} - ${minSize}) * ((100vw - ${minWidth}) / (${maxWidth} - ${minWidth})));
  }

  @media (min-width: ${maxWidth}) {
    font-size: ${maxSize};
  }
`;
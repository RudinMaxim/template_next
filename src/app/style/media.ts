import { css } from "styled-components";

import { breakpoints } from "./_variables";

type Breakpoint = keyof typeof breakpoints;

export const media = {
  up: (breakpoint: Breakpoint) => css`
    @media (min-width: ${breakpoints[breakpoint]}) {
      ${css`
        ${({ children }: { children: any }) => children}
      `}
    }
  `,
  down: (breakpoint: Breakpoint) => css`
    @media (max-width: ${breakpoints[breakpoint]}) {
      ${css`
        ${({ children }: { children: any }) => children}
      `}
    }
  `,
  between: (start: Breakpoint, end: Breakpoint) => css`
    @media (min-width: ${breakpoints[start]}) and (max-width: ${breakpoints[end]}) {
      ${css`
        ${({ children }: { children: any }) => children}
      `}
    }
  `,
};


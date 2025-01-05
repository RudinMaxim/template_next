import React, { forwardRef, memo } from 'react';

import { getImageProps } from 'next/image';

interface BaseUI {
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

interface ImagesType {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  sources?: Array<{
    srcset: string;
    breakpoint?: number;
    type?: string;
  }>;
}

export type PictureType = BaseUI & ImagesType;

export const PictureView = memo(
  forwardRef<HTMLPictureElement, PictureType>((props, ref) => {
    const common = { alt: props.alt ?? '' };
    const {
      props: { ...rest },
    } = getImageProps({
      ...common,
      width: props.width ?? 1,
      height: props.height ?? 1,
      quality: props.quality ?? 100,
      priority: props.priority ?? false,
      src: props.src,
    });

    return (
      <picture
        className={props.className ?? ''}
        style={props.style}
        title={props.title}
        ref={ref}
      >
        {'sources' in props &&
          props.sources &&
          Array.isArray(props.sources) &&
          props.sources.map(({ srcset, breakpoint, type }, index) => (
            <source
              srcSet={srcset}
              media={breakpoint ? `(min-width: ${breakpoint}px)` : ''}
              type={type}
              key={srcset + index}
            />
          ))}
        <img {...rest} srcSet={props.src} alt={props.alt ?? ''} />
      </picture>
    );
  })
);

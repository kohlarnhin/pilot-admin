import type { CSSProperties } from 'react';

export type NavItemStyles = {
  icon: CSSProperties;
  texts: CSSProperties;
  title: CSSProperties;
  caption: CSSProperties;
  info: CSSProperties;
  arrow: CSSProperties;
};

export const navItemStyles: NavItemStyles = {
  icon: {
    display: 'inline-flex',
    flexShrink: 0,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  texts: {
    display: 'inline-flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: '1 1 auto',
    minWidth: 0,
  },
  title: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '13px',
    fontWeight: 'inherit',
    textAlign: 'left',
    lineHeight: '1.25rem',
  },
  caption: {
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '0.75rem',
    fontWeight: 400,
    color: '#64748B',
    textAlign: 'left',
    lineHeight: '1rem',
  },
  info: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: '6px',
  },
  arrow: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 16,
    height: 16,
    marginLeft: '6px',
    transition: 'transform 0.25s ease-in-out',
  },
};

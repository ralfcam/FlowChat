declare module 'react-router-dom' {
  import { ComponentType, ReactNode } from 'react';

  export interface BrowserRouterProps {
    basename?: string;
    children?: ReactNode;
    window?: Window;
  }

  export interface RouteProps {
    caseSensitive?: boolean;
    children?: ReactNode;
    element?: ReactNode | null;
    index?: boolean;
    path?: string;
  }

  export interface OutletProps {
    context?: unknown;
  }

  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    reloadDocument?: boolean;
    replace?: boolean;
    state?: any;
    to: string | { pathname: string; search: string; hash: string; state: any };
  }

  export interface NavigateProps {
    to: string | { pathname: string; search: string; hash: string; state: any };
    replace?: boolean;
    state?: any;
  }

  export interface LocationState {
    [key: string]: any;
  }

  export interface Location<S = LocationState> {
    pathname: string;
    search: string;
    hash: string;
    state: S;
    key: string;
  }

  export interface NavigateFunction {
    (to: string | number, options?: { replace?: boolean; state?: any }): void;
    (delta: number): void;
  }

  export const BrowserRouter: ComponentType<BrowserRouterProps>;
  export const Routes: ComponentType<{ children?: ReactNode }>;
  export const Route: ComponentType<RouteProps>;
  export const Outlet: ComponentType<OutletProps>;
  export const Link: ComponentType<LinkProps>;
  export const Navigate: ComponentType<NavigateProps>;

  export function useNavigate(): NavigateFunction;
  export function useLocation<S = LocationState>(): Location<S>;
  export function useParams<P extends { [K in keyof P]?: string } = {}>(): P;
  export function useSearchParams(): [URLSearchParams, (nextInit: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => void];
} 
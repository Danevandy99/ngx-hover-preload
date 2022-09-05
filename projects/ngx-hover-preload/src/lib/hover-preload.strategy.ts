import { Injectable } from '@angular/core';
import { PreloadingStrategy, Router, Route, PRIMARY_OUTLET } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { RegistryService } from './registry.service';

@Injectable()
export class HoverPreloadStrategy implements PreloadingStrategy {
  private loadingRoutes = new Set<Route>();

  constructor(
    private router: Router,
    private registryService: RegistryService
  ) { }

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (this.loadingRoutes.has(route)) {
      // Don't preload the same route twice
      return EMPTY;
    }

    // Prevent from preloading
    if (route.data && route.data.preload === false) {
      return EMPTY;
    }

    const path = findPath(this.router.config, route);

    if (this.registryService.shouldPrefetch(path)) {
      this.loadingRoutes.add(route);
      return load();
    }

    return EMPTY;
  }
}

const findPath = (config: Route[], route: Route): string => {
  config = config.slice();
  const parent = new Map<Route, Route>();
  const visited = new Set<Route>();

  while (config.length) {
    const el = config.shift();

    if (!el) {
      break;
    }

    visited.add(el);

    if (el === route) {
      break;
    }

    let children = el.children || [];
    const current = (el as any)._loadedConfig;

    if (current && current.routes) {
      children = children.concat(current.routes);
    }

    children.forEach((r: Route) => {
      if (visited.has(r)) {
        return;
      }

      parent.set(r, el);

      config.push(r);
    });
  }

  let path = '';
  let current: Route | undefined = route;

  while (current) {
    if (isPrimaryRoute(current)) {
      path = `/${current.path}${path}`;
    } else {
      path = `/(${current.outlet}:${current.path}${path})`;
    }

    current = parent.get(current);
  }

  return path;
};

function isPrimaryRoute(route: Route) {
  return route.outlet === PRIMARY_OUTLET || !route.outlet;
}

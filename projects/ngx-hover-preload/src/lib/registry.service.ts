import { Injectable } from '@angular/core';
import { Params, PRIMARY_OUTLET, Router, UrlSegment, UrlSegmentGroup, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RegistryService {
  // Using a map so we don't add an element
  // on each hover. This will generally reduce memory
  // usage and will not require cleanup.
  private queue = new Set<UrlTree>([]);

  constructor(private router: Router) {}

  add(route: UrlTree) {
    this.queue.add(route);
  }

  shouldPrefetch(url: string) {
    const tree = this.router.parseUrl(url);
    return [...this.queue].some(this.containsTree.bind(null, tree));
  }

  private containsTree(containee: UrlTree, container: UrlTree): boolean {
    return (
      this.containsQueryParams(container.queryParams, containee.queryParams) &&
      this.containsSegmentGroup(container.root, containee.root, containee.root.segments)
    );
  }

  private containsQueryParams(container: Params, containee: Params): boolean {
    // TODO: This does not handle array params correctly.
    return (
      Object.keys(containee).length <= Object.keys(container).length &&
      Object.keys(containee).every(key => containee[key] === container[key])
    );
  }

  private containsSegmentGroup(
    container: UrlSegmentGroup,
    containee: UrlSegmentGroup,
    containeePaths: UrlSegment[]
  ): boolean {
    if (container.segments.length > containeePaths.length) {
      const current = container.segments.slice(0, containeePaths.length);

      if (!this.equalPath(current, containeePaths)) {
        return false;
      }

      if (containee.hasChildren()) {
        return false;
      }

      return true;
    } else if (container.segments.length === containeePaths.length) {

      if (!this.equalPath(container.segments, containeePaths)) {
        return false;
      }

      if (!containee.hasChildren()) {
        return true;
      }

      for (const c in containee.children) {
        if (container.children[c]
          && this.containsSegmentGroup(
            container.children[c],
            containee.children[c],
            containee.children[c].segments
          )
        ) {
          return true;
        }
      }

      return false;
    } else {
      const current = containeePaths.slice(0, container.segments.length);
      const next = containeePaths.slice(container.segments.length);

      if (!this.equalPath(container.segments, current)) {
        return false;
      }

      if (!container.children[PRIMARY_OUTLET]) {
        return false;
      }

      return this.containsSegmentGroup(container.children[PRIMARY_OUTLET], containee, next);
    }
  }

  private equalPath(as: UrlSegment[], bs: UrlSegment[]): boolean {
    if (as.length !== bs.length) {
      return false;
    }

    return as.every(
      (a, i) => a.path === bs[i].path || a.path.startsWith(':') || bs[i].path.startsWith(':')
    );
  }
}

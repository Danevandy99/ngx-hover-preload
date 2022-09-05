/* eslint-disable @angular-eslint/directive-selector */
import {
  Directive, HostListener, Optional,
} from '@angular/core';
import { RouterLink, RouterLinkWithHref, RouterPreloader } from '@angular/router';
import { RegistryService } from './registry.service';


@Directive({
  selector: '[routerLink]'
})
export class LinkDirective {
  private routerLink: RouterLink | RouterLinkWithHref;

  constructor(
    private routePreloader: RouterPreloader,
    private registryService: RegistryService,
    @Optional() link: RouterLink,
    @Optional() linkWithHref: RouterLinkWithHref
  ) {
    this.routerLink = link || linkWithHref;
  }

  @HostListener('mouseenter')
  prefetch() {
    requestIdleCallback(() => {
      if (this.routerLink.urlTree) {
        this.registryService.add(this.routerLink.urlTree);
        this.routePreloader.preload().subscribe(() => void 0);
      }
    });
  }
}

type RequestIdleCallbackHandle = unknown;

type RequestIdleCallbackOptions = {
  timeout: number;
};

type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: (() => number);
};

type RequestIdleCallback = ((
  callback: ((deadline: RequestIdleCallbackDeadline) => void),
  opts?: RequestIdleCallbackOptions
) => RequestIdleCallbackHandle);

const requestIdleCallback: RequestIdleCallback =
  typeof window !== 'undefined'
    ? (window as Window).requestIdleCallback ||
      ((
        callback: ((deadline: RequestIdleCallbackDeadline) => void),
        opts?: RequestIdleCallbackOptions
      ) => {
        const start = Date.now();

        return setTimeout(() => {
          callback({
            didTimeout: false,
            timeRemaining: (() =>  Math.max(0, 50 - (Date.now() - start)))
          });
        }, 1);
      })
    : () => {};

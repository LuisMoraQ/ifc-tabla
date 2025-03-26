import { AfterContentInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]'
})
export class AutoFocusDirective implements AfterContentInit {

  @Input() public appAutoFocus: string| boolean | undefined;

  constructor(private el: ElementRef) { }

  public ngAfterContentInit() {
    this.el.nativeElement.select();
    this.el.nativeElement.scrollIntoView({
      block: 'nearest',
      bebehavior: 'instant'
    });
  }
}

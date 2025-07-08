import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Pipe({
    name: 'markdownHtml',
    standalone: true
})
export class MarkdownHtmlPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(value: string): SafeHtml {
        const html = marked.parse(value) as string;
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}

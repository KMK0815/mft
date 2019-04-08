import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jsonCompact'
})

export class JsonCompactPipe implements PipeTransform {

  // Note: This regex matches even invalid JSON strings, but since we�re
  // working on the output of `JSON.stringify` we know that only valid strings
  // are present (unless the user supplied a weird `options.indent` but in
  // that case we don�t care since the output would be invalid anyway).
  stringOrChar = /("(?:[^\\"]|\\.)*")|[:,\][}{]/g;
  indent;
  addMargin;
  maxLength;
  nextIndent;

  transform(value: any, args?: any): any {
    return this.stringify(value, { maxLength: 80 });
  }

  prettify(str: string, addMargin): string {
    const m = addMargin ? ' ' : '';
    const tokens = {
      '{': '{' + m,
      '[': '[' + m,
      '}': m + '}',
      ']': m + ']',
      ',': ', ',
      ':': ': '
    };
    return str.replace(this.stringOrChar, function (match, s) {
      return s ? match : tokens[match];
    });
  }

  comma(array, index) {
    return (index === array.length - 1 ? 0 : 1);
  }

  get(options, name, defaultValue) {
    return (name in options ? options[name] : defaultValue);
  }

  _stringify(o, currentIndent, reserved): string {
    if (o && typeof o.toJSON === 'function') {
      o = o.toJSON();
    }

    const s = JSON.stringify(o);

    if (s === undefined) {
      return s;
    }

    const length = this.maxLength - currentIndent.length - reserved;

    if (s.length <= length) {
      const prettified = this.prettify(s, this.addMargin);
      if (prettified.length <= length) {
        return prettified;
      }
    }

    if (typeof o === 'object' && o !== null) {
      const nextIndent = currentIndent + this.indent;
      const items = [];
      let delimiters;


      if (Array.isArray(o)) {
        for (let index = 0; index < o.length; index++) {
          items.push(
            this._stringify(o[index], nextIndent, this.comma(o, index)) || 'null'
          );
        }
        delimiters = '[]';
      } else {
        const array = Object.keys(o);
        for (let index = 0; index < array.length; index++) {
          const key = array[index];
          const keyPart = JSON.stringify(key) + ': ';
          const value = this._stringify(o[key], nextIndent, keyPart.length + this.comma(array, index));
          if (value !== undefined) {
            items.push(keyPart + value);
          }
        }

        delimiters = '{}';
      }

      if (items.length > 0) {
        return [
          delimiters[0],
          this.indent + items.join(',\n' + nextIndent),
          delimiters[1]
        ].join('\n' + currentIndent);
      }
    }
    return s;
  }

  stringify(obj, options): string {
    options = options || {};
    this.indent = JSON.stringify([1], null, this.get(options, 'indent', 2)).slice(2, -3);
    this.addMargin = this.get(options, 'margins', false);
    this.maxLength = (this.indent === '' ? Infinity : this.get(options, 'maxLength', 80));
    return (this._stringify(obj, '', 0));
  }
}

const isObject = (item: any): boolean => {
  return item !== null && typeof item === 'object';
};

const isMergebleObject = (item): boolean => {
  return isObject(item) && !Array.isArray(item);
};

export const mergeObjects = <T extends object = object>(target: T, ...sources: T[]): T => {
  if (!sources.length) {
    return target;
  }
  const source = sources.shift();
  if (source === undefined) {
    return target;
  }

  if (isMergebleObject(target) && isMergebleObject(source)) {
    Object.keys(source).forEach(function (key: string) {
      if (isMergebleObject(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        mergeObjects(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    });
  }

  return mergeObjects(target, ...sources);
};

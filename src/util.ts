'use strict';

export function expandString(s: string | undefined, kv: Map<string, string>): string {
    if (!s) {
        return '';
    }
    const expansions = new Map<string, string>();
    const mustaches = s.match(/\$\{[A-z0-9]*\}/g);
    if (!mustaches) {
        return s;
    }

    mustaches.forEach(mustache => {
        const matches = mustache.match(/\$\{([A-z0-9]*)\}/); 
        if (!matches) {
            return;
        }
        const name = matches[1];
        const expansion = kv.get(name);

        if (expansion) {
            expansions.set(mustache, expansion);
        }

    });
    
    let retval = s;
    expansions.forEach((val, key) => {
        retval = retval.replace(key, val);
    });

    return retval;
}
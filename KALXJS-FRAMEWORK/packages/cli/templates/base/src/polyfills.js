// Polyfill for Array.flat()
if (!Array.prototype.flat) {
    Object.defineProperty(Array.prototype, 'flat', {
        configurable: true,
        writable: true,
        value: function () {
            const depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);
            return depth ? Array.prototype.reduce.call(this, function (acc, cur) {
                if (Array.isArray(cur)) {
                    acc.push.apply(acc, depth > 1 ? cur.flat(depth - 1) : cur);
                } else {
                    acc.push(cur);
                }
                return acc;
            }, []) : Array.prototype.slice.call(this);
        }
    });
}

// Polyfill for Array.flatMap()
if (!Array.prototype.flatMap) {
    Object.defineProperty(Array.prototype, 'flatMap', {
        configurable: true,
        writable: true,
        value: function (callback) {
            return Array.prototype.map.call(this, callback).reduce((acc, cur) => {
                if (Array.isArray(cur)) {
                    acc.push.apply(acc, cur);
                } else {
                    acc.push(cur);
                }
                return acc;
            }, []);
        }
    });
}

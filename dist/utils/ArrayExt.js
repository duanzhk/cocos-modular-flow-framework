// @ts-ignore
!Array.prototype.__cc_extended && Object.defineProperties(Array.prototype, {
    remove: {
        value: function (filter) {
            if (typeof (filter) == 'function') {
                for (let i = this.length - 1; i > -1; --i) {
                    filter(this[i], i, this) && this.splice(i, 1);
                }
            }
            else {
                for (let i = this.length - 1; i > -1; --i) {
                    this[i] === filter && this.splice(i, 1);
                }
            }
            return this;
        }
    },
    removeOne: {
        value: function (filter) {
            if (typeof (filter) == 'function') {
                for (let i = 0; i < this.length; ++i) {
                    if (filter(this[i], i, this)) {
                        this.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                for (let i = 0; i < this.length; ++i) {
                    if (this[i] === filter) {
                        this.splice(i, 1);
                        return this;
                    }
                }
            }
            return this;
        }
    },
    random: {
        value: function () {
            let element = this[Math.floor(Math.random() * this.length)];
            return element;
        }
    },
    fastRemoveAt: {
        value: function (index) {
            const length = this.length;
            if (index < 0 || index >= length) {
                return null;
            }
            let res = this[index];
            this[index] = this[length - 1];
            this.length = length - 1;
            return res;
        }
    },
    fastRemove: {
        value: function (value) {
            const index = this.indexOf(value);
            if (index >= 0) {
                this[index] = this[this.length - 1];
                --this.length;
                return true;
            }
            return false;
        }
    },
    first: {
        value: function () {
            return this.length ? this[0] : null;
        }
    },
    last: {
        value: function () {
            return this.length ? this[this.length - 1] : null;
        }
    },
    max: {
        value: function (mapper) {
            if (!this.length) {
                return null;
            }
            function _max(a, b) {
                return a > b ? a : b;
            }
            if (typeof (mapper) == 'function') {
                let max = mapper(this[0], 0, this);
                for (let i = 1; i < this.length; ++i) {
                    let temp = mapper(this[i], i, this);
                    max = temp > max ? temp : max;
                }
                return max;
            }
            else {
                return this.reduce(function (prev, cur) { return _max(prev, cur); });
            }
        }
    },
    min: {
        value: function (mapper) {
            if (!this.length) {
                return null;
            }
            function _min(a, b) {
                return a < b ? a : b;
            }
            if (typeof (mapper) == 'function') {
                let min = mapper(this[0], 0, this);
                for (let i = 1; i < this.length; ++i) {
                    let temp = mapper(this[i], i, this);
                    min = temp < min ? temp : min;
                }
                return min;
            }
            else {
                return this.reduce(function (prev, cur) { return _min(prev, cur); });
            }
        }
    },
    distinct: {
        value: function () {
            return this.filter(function (v, i, arr) { return arr.indexOf(v) === i; });
        }
    },
    filterIndex: {
        value: function (filter) {
            let output = [];
            for (let i = 0; i < this.length; ++i) {
                if (filter(this[i], i, this)) {
                    output.push(i);
                }
            }
            return output;
        }
    },
    count: {
        value: function (filter) {
            let result = 0;
            for (let i = 0; i < this.length; ++i) {
                if (filter(this[i], i, this)) {
                    ++result;
                }
            }
            return result;
        }
    },
    sum: {
        value: function (mapper) {
            let result = 0;
            for (let i = 0; i < this.length; ++i) {
                result += mapper ? mapper(this[i], i, this) : this[i];
            }
            return result;
        }
    },
    average: {
        value: function (mapper) {
            return this.sum(mapper) / this.length;
        }
    },
    orderBy: {
        value: function () {
            let mappers = [];
            for (let _i = 0; _i < arguments.length; _i++) {
                mappers[_i] = arguments[_i];
            }
            return this.slice().sort(function (a, b) {
                for (let i = 0; i < mappers.length; ++i) {
                    let va = mappers[i](a);
                    let vb = mappers[i](b);
                    if (va > vb) {
                        return 1;
                    }
                    else if (va < vb) {
                        return -1;
                    }
                }
                return 0;
            });
        }
    },
    orderByDesc: {
        value: function () {
            let mappers = [];
            for (let _i = 0; _i < arguments.length; _i++) {
                mappers[_i] = arguments[_i];
            }
            return this.slice().sort(function (a, b) {
                for (let i = 0; i < mappers.length; ++i) {
                    let va = mappers[i](a);
                    let vb = mappers[i](b);
                    if (va > vb) {
                        return -1;
                    }
                    else if (va < vb) {
                        return 1;
                    }
                }
                return 0;
            });
        }
    },
    binarySearch: {
        value: function (value, keyMapper) {
            let low = 0, high = this.length - 1;
            while (low <= high) {
                let mid = ((high + low) / 2) | 0;
                let midValue = keyMapper ? keyMapper(this[mid]) : this[mid];
                if (value === midValue) {
                    return mid;
                }
                else if (value > midValue) {
                    low = mid + 1;
                }
                else if (value < midValue) {
                    high = mid - 1;
                }
            }
            return -1;
        }
    },
    binaryInsert: {
        value: function (item, keyMapper, unique) {
            if (typeof (keyMapper) == 'boolean') {
                unique = keyMapper;
                keyMapper = undefined;
            }
            let low = 0, high = this.length - 1;
            let mid = NaN;
            let itemValue = keyMapper ? keyMapper(item) : item;
            while (low <= high) {
                mid = ((high + low) / 2) | 0;
                let midValue = keyMapper ? keyMapper(this[mid]) : this[mid];
                if (itemValue === midValue) {
                    if (unique) {
                        return mid;
                    }
                    else {
                        break;
                    }
                }
                else if (itemValue > midValue) {
                    low = mid + 1;
                }
                else if (itemValue < midValue) {
                    high = mid - 1;
                }
            }
            let index = low > mid ? mid + 1 : mid;
            this.splice(index, 0, item);
            return index;
        }
    },
    binaryDistinct: {
        value: function (keyMapper) {
            return this.filter(function (v, i, arr) { return arr.binarySearch(v, keyMapper) === i; });
        }
    },
    findLast: {
        value: function (predicate) {
            for (let i = this.length - 1; i > -1; --i) {
                if (predicate(this[i], i, this)) {
                    return this[i];
                }
            }
            return undefined;
        }
    },
    findLastIndex: {
        value: function (predicate) {
            for (let i = this.length - 1; i > -1; --i) {
                if (predicate(this[i], i, this)) {
                    return i;
                }
            }
            return -1;
        }
    },
    groupBy: {
        value: function (grouper) {
            let group = this.reduce(function (prev, next) {
                let groupKey = grouper(next);
                if (!prev[groupKey]) {
                    prev[groupKey] = [];
                }
                prev[groupKey].push(next);
                return prev;
            }, {});
            return Object.keys(group).map(function (key) {
                let arr = group[key];
                arr.key = key;
                return arr;
            });
        }
    },
    __cc_extended: {
        value: true
    }
});

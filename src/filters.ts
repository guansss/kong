import Vue from 'vue';
import { insert } from '@/utils/string';

Vue.filter('date', (time: number) => {
    const str = new Date(time).toLocaleString('zh-cn', { hour12: false });

    // insert a space between the date and time
    // 2000/01/0100:00:00 -> 2000/01/01 00:00:00
    return insert(str, -8, ' ');
});

Vue.filter('size', (size: number) =>
    size > 1e6 ? Math.ceil(size / 1e4) / 100 + ' MB'
        : size > 1e3 ? Math.ceil(size / 10) / 100 + ' KB'
            : size + ' B'
);

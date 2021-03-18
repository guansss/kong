import { DownloadTrackingVideo } from '@/models';
import { Store } from 'vuex';

export default new Store({
    state: {
        video: null as Nullable<DownloadTrackingVideo>,

        currentTime: 0,

        thumbnailUpdating: false,
    },
});

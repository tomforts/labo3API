import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";

let requestCachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

// Repository file data models cache
global.requestCaches = [];
global.cachedRepositoriesCleanerStarted = false;

export default class CachedRequestsManager {
    static add(url, content, ETag = "") {
        if (!cachedRepositoriesCleanerStarted) {
            cachedRepositoriesCleanerStarted = true;
            CachedRequestsManager.startCachedRequestsCleaner();
        }
        if (url) {
            CachedRequestsManager.clear(url);
            requestCaches.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + requestCachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Data of ${url} repository has been cached]`);
        }
    }
    static startCachedRequestsCleaner() {
        // periodic cleaning of expired cached repository data
        setInterval(CachedRequestsManager.flushExpired, requestCachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic repositories data caches cleaning process started...]");

    }
    static clear(model) {
        if (model != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of requestCaches) {
                if (cache.model == model) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(requestCaches, indexToDelete);
        }
    }
    static find(url) {
        try {
            if (url) {
                for (let cache of requestCaches) {
                    if (cache.model == model) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + requestCachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[${cache.model} data retrieved from cache]`);
                        return cache.data;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[repository cache error!]", error);
        }
        return null;
    }
    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let cache of requestCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file data of " + cache.model + ".json expired");
            }
        }
        requestCaches = requestCaches.filter( cache => cache.Expire_Time > now);
    }
}

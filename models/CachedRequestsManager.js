import * as utilities from "../utilities.js";
import * as serverVariables from "../serverVariables.js";

let requestCachesExpirationTime = serverVariables.get("main.repository.CacheExpirationTime");

// Repository file data models cache
global.requestCaches = [];
global.cachedRequestsCleanerStarted = false;

export default class CachedRequestsManager {
    static add(url, content, ETag = "") {
        if (!cachedRequestsCleanerStarted) {
            cachedRequestsCleanerStarted = true;
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
            console.log(BgWhite + FgBlue, `[Data of ${url} has been cached]`);
        }
    }
    static startCachedRequestsCleaner() {
        // periodic cleaning of expired cached repository data
        setInterval(CachedRequestsManager.flushExpired, requestCachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic requests data caches cleaning process started...]");

    }
    static clear(url) {
        if (url) {
            let indexToDelete = [];
            let index = 0;
            for (let cache of requestCaches) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(requestCaches, indexToDelete);
        }
    }
    static find(url) {
        try {
            if (url) {
                for (let cache of requestCaches) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + requestCachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[${cache.url} data retrieved from cache]`);
                        return cache.content;
                    }
                }
            }
        } catch (error) {
            console.log(BgWhite + FgRed, "[request cache error!]", error);
        }
        return null;
    }
    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let cache of requestCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgWhite + FgBlue, "Cached file data for " + cache.url + " has expired");
            }
        }
        requestCaches = requestCaches.filter( cache => cache.Expire_Time > now);
    }
    static get(HttpContext){
        let url = HttpContext.req.url;
        let data = CachedRequestsManager.find(url);

        if(data){
            HttpContext.response.JSON(data.content, data.ETag, true);
        }
    }
}

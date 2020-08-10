// ==UserScript==
// @name         Twitter Filter
// @namespace    github.com/Myriad-Dreamin
// @version      0.1.0
// @description  filter tweets that has no image
// @author       Myriad Dreamin
// @match        https://twitter.com/i/lists/*
// @grant        none
// ==/UserScript==

// require, 
// updateURL,
// match patterns: https://developer.chrome.com/extensions/match_patterns

class TwitterFilter {
    constructor() { }

    main(options) {
        console.info('[TF] start');
        try {
            options = Object.assign(options, {
                mostTryTimes: 5,
                onNotFound() {
                    console.error('[TF] not found');
                },
                onChangedTweetEvent: this.onChangedTweetEvent,
            });
            options = Object.assign(options, {
                processIncomingTweet: this.processIncomingTweetWithTagFeature(options),
            });
    
            this.findTweetsContainer(this.traceByContainerLength(options), options);
        } catch (e) {
            console.error(e);
            console.info('[TF] stopped');
        }
    }

    onChangedTweetEvent(tweet, articleElem, event) {
        try {
            if (articleElem) {
                
                for (let imgElem of articleElem.getElementsByTagName('img')) {
                    if (imgElem.draggable === true) {
                        tweet.hidden = false;
                        return;
                    }
                }

                tweet.hidden = true;
            }
        } catch(e) {
            console.error(e);
            console.log(tweet, articleElem, event);
        }
    }

    processIncomingTweetWithTagFeature(options) {
        const {onChangedTweetEvent} = options;
            
        if (onChangedTweetEvent === undefined) {
            console.error('[TF] want a onChangedTweetEvent option');
            return;
        }

        return function(tweet, index) {
            if (index > 0) {
                if (tweet.getAttribute('tf-searched') == 'true') {
                    console.info('skip searched tags');
                    return;
                }
    
                let tweetContainer = null;
    
                for (let maybeGroupContainer of tweet.getElementsByTagName('div')) {
                    if (maybeGroupContainer.getAttribute('role') === 'group') {
                        tweetContainer = maybeGroupContainer.parentNode;
                        break;
                    }
                }
                
                if (tweetContainer !== null) {
                    let binded = onChangedTweetEvent.bind(this, tweet, tweetContainer);
                    binded();

                    tweetContainer.addEventListener('DOMSubtreeModified', binded);
                }
    
                tweet.setAttribute('tf-searched', 'true');
            }
        }
    }

    traceByContainerLength(options) {
        return function (tweets_container) {
    
            let {handleLoopExit, processIncomingTweet} = options;
            handleLoopExit = handleLoopExit || function() {};
            
            if (processIncomingTweet === undefined) {
                console.error('[TF] want a processIncomingTweet option');
                return;
            }
    
            let oldLength = 0;
    
            const containerLoopExitHandler = setInterval(function () {
                let newLength = tweets_container.children.length;
    
                if (oldLength != newLength) {
                    console.info('[TF] Container Updating');
                    for (let tweetIndex in tweets_container.children) {
                        processIncomingTweet(tweets_container.children[tweetIndex], tweetIndex);
                    }
                    oldLength = newLength;
                }
            }, 100);
    
            handleLoopExit(containerLoopExitHandler);
        };
    }

    findTweetsContainer(callback, options) {
        const {onNotFound} = options;

        this._findTweetsContainerCharacteristics(function (maybe_container) {

            while(maybe_container) {
                if (maybe_container.offsetHeight > window.innerHeight) {
                    break;
                }
                maybe_container = maybe_container.parentNode;
            }
            
            if (!maybe_container) {
                onNotFound();
                return;
            }

            callback(maybe_container);
        }, options);
    }

    _findTweetsContainerCharacteristics(callback, { mostTryTimes, onNotFound }) {
        if (callback == undefined) {
            console.error('callback nil');
            return;
        }
        onNotFound = onNotFound || function () { };
        mostTryTimes = mostTryTimes || 5;

        let triedTimes = 0;
        let finding_TweetsContainer_characteristics = null;
        let waitLoading = setInterval(function () {
            for (let maybe_list_head_a of document.getElementsByTagName('a')) {
                if (maybe_list_head_a.href.endsWith('members')) {
                    finding_TweetsContainer_characteristics = maybe_list_head_a;
                    break;
                }
            }

            triedTimes++;

            if (mostTryTimes <= triedTimes || finding_TweetsContainer_characteristics !== null) {
                clearInterval(waitLoading);

                if (finding_TweetsContainer_characteristics !== null) {
                    callback(finding_TweetsContainer_characteristics);
                } else {
                    onNotFound();
                }
            }
        }, 1000);
    }
}

(function () {
    'use strict';

    (new TwitterFilter()).main({
        mostTryTimes: 5,
        onNotFound() {
            console.error('[TwitterFilter] not found');
        }
    });
})();